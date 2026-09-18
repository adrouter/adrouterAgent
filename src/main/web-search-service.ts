import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';
// The CJS build lets Vite include Turndown's Domino parser in the self-contained main bundle.
import TurndownService from 'turndown/lib/turndown.cjs.js';
import { fetchPublicHttpsResource, MAX_NETWORK_RESPONSE_BYTES } from '../runtime/network-policy';
import type { SearchProvider } from '../shared/contracts';
import { type RuntimeWebAction, RuntimeWebResultSchema } from '../shared/runtime-protocol';
import type { WebSearchRuntimeConfiguration, WebSearchStore } from './web-search-store';

const REQUEST_TIMEOUT_MS = 30_000;
const PROVIDER_RESPONSE_LIMIT = 10 * 1024 * 1024;

const PROVIDER_ENDPOINTS: Record<SearchProvider, string> = {
  openai: 'https://api.openai.com/v1/responses',
  exa: 'https://api.exa.ai/search',
  brave: 'https://api.search.brave.com/res/v1/web/search',
  parallel: 'https://api.parallel.ai/v1/search',
  tavily: 'https://api.tavily.com/search',
  perplexity: 'https://api.perplexity.ai/v1/sonar',
  gemini:
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent',
};

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface SearchResponse {
  provider: SearchProvider;
  answer: string;
  results: SearchResult[];
}

type ProviderFetch = (url: string, init: RequestInit) => Promise<Response>;
type ContentFetch = typeof fetchPublicHttpsResource;
type WebProgress = (progress: {
  phase: 'queued' | 'dispatching' | 'completed' | 'failed' | 'cancelled';
  provider: SearchProvider | null;
  query: string | null;
  completed: number;
  total: number;
  error?: string;
}) => void;

class AbortableSemaphore {
  private active = 0;
  private readonly waiters: Array<{
    signal: AbortSignal;
    resolve: (release: () => void) => void;
    reject: (error: Error) => void;
    abort: () => void;
  }> = [];

  public constructor(private readonly capacity: number) {}

  public async acquire(signal: AbortSignal): Promise<() => void> {
    if (signal.aborted) throw new Error('The web request was cancelled.');
    if (this.active < this.capacity) {
      this.active += 1;
      return this.releaseOnce();
    }
    return await new Promise<() => void>((resolve, reject) => {
      const waiter = {
        signal,
        resolve,
        reject,
        abort: (): void => {
          const index = this.waiters.indexOf(waiter);
          if (index >= 0) this.waiters.splice(index, 1);
          reject(new Error('The web request was cancelled.'));
        },
      };
      signal.addEventListener('abort', waiter.abort, { once: true });
      this.waiters.push(waiter);
    });
  }

  private releaseOnce(): () => void {
    let released = false;
    return () => {
      if (released) return;
      released = true;
      while (this.waiters.length > 0) {
        const waiter = this.waiters.shift();
        if (!waiter) break;
        waiter.signal.removeEventListener('abort', waiter.abort);
        if (waiter.signal.aborted) continue;
        waiter.resolve(this.releaseOnce());
        return;
      }
      this.active -= 1;
    };
  }
}

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const text = (value: unknown, limit = 16_000): string =>
  typeof value === 'string'
    ? Array.from(value, (character) => {
        const code = character.charCodeAt(0);
        return code <= 8 || code === 11 || code === 12 || (code >= 14 && code <= 31) || code === 127
          ? ''
          : character;
      })
        .join('')
        .trim()
        .slice(0, limit)
    : '';

const httpsUrl = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return undefined;
    url.hash = '';
    return url.toString();
  } catch {
    return undefined;
  }
};

const normalizeResults = (values: unknown[], limit: number): SearchResult[] => {
  const results: SearchResult[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const item = record(value);
    const url = httpsUrl(item.url ?? item.uri ?? item.link);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    results.push({
      title: text(item.title ?? item.name, 500) || url,
      url,
      snippet: text(item.snippet ?? item.description ?? item.content ?? item.text, 2_000),
    });
    if (results.length >= limit) break;
  }
  return results;
};

const answerFromResults = (results: SearchResult[]): string =>
  results
    .map((result) =>
      result.snippet
        ? `${result.snippet}\nSource: ${result.title} (${result.url})`
        : `Source: ${result.title} (${result.url})`
    )
    .join('\n\n')
    .slice(0, 16_000);

const readBoundedJson = async (response: Response): Promise<Record<string, unknown>> => {
  const declared = Number(response.headers.get('content-length') ?? 0);
  if (declared > PROVIDER_RESPONSE_LIMIT) throw new Error('Provider response exceeded 10 MiB.');
  const reader = response.body?.getReader();
  if (!reader) return {};
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    bytes += part.value.byteLength;
    if (bytes > PROVIDER_RESPONSE_LIMIT) {
      await reader.cancel();
      throw new Error('Provider response exceeded 10 MiB.');
    }
    chunks.push(part.value);
  }
  const body = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString('utf8');
  try {
    return record(JSON.parse(body));
  } catch {
    throw new Error('Provider returned malformed JSON.');
  }
};

const concurrentMap = async <T, R>(
  values: T[],
  concurrency: number,
  mapper: (value: T, index: number) => Promise<R>
): Promise<R[]> => {
  const results = new Array<R>(values.length);
  let cursor = 0;
  const worker = async (): Promise<void> => {
    while (cursor < values.length) {
      const index = cursor++;
      results[index] = await mapper(values[index] as T, index);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, worker));
  return results;
};

export class WebSearchService {
  private readonly controllers = new Map<
    string,
    { controller: AbortController; provider?: SearchProvider }
  >();
  private readonly network = new AbortableSemaphore(2);

  public constructor(
    private readonly store: WebSearchStore,
    private readonly providerFetch: ProviderFetch = fetch,
    private readonly contentFetch: ContentFetch = fetchPublicHttpsResource
  ) {
    this.store.onInvalidation?.((event) => {
      for (const entry of this.controllers.values()) {
        if (event.type === 'disabled' || entry.provider === event.provider) {
          entry.controller.abort(new Error('The web request was cancelled by a settings change.'));
        }
      }
    });
  }

  public cancel(requestId: string): void {
    this.controllers.get(requestId)?.controller.abort();
  }

  public cancelAll(): void {
    for (const { controller } of this.controllers.values()) controller.abort();
  }

  public async execute(input: {
    requestId: string;
    taskId: string;
    action: RuntimeWebAction;
    signal?: AbortSignal;
    authorizeDispatch?: () => Promise<void> | void;
    onProgress?: WebProgress;
  }): Promise<Record<string, unknown>> {
    if (this.controllers.has(input.requestId)) {
      throw new Error('A duplicate active web request identifier was rejected.');
    }
    const controller = new AbortController();
    const signal = input.signal
      ? AbortSignal.any([input.signal, controller.signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)])
      : AbortSignal.any([controller.signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)]);
    const identity = { controller, provider: undefined as SearchProvider | undefined };
    this.controllers.set(input.requestId, identity);
    try {
      await this.store.assertEnabled();
      if (input.action.type === 'search') {
        return RuntimeWebResultSchema.parse(
          await this.search(input.taskId, input.action, signal, identity, input)
        );
      }
      if (input.action.type === 'fetch-content') {
        return RuntimeWebResultSchema.parse(
          await this.fetchContent(
            input.taskId,
            input.action.urls,
            signal,
            input.authorizeDispatch,
            input.onProgress
          )
        );
      }
      if (signal.aborted) throw new Error('The web request was cancelled.');
      return RuntimeWebResultSchema.parse(
        await this.store.getContent({
          taskId: input.taskId,
          handle: input.action.handle,
          offset: input.action.offset,
          maxCharacters: input.action.maxCharacters,
        })
      );
    } finally {
      if (this.controllers.get(input.requestId) === identity) {
        this.controllers.delete(input.requestId);
      }
    }
  }

  private async search(
    taskId: string,
    input: Extract<RuntimeWebAction, { type: 'search' }>,
    signal: AbortSignal,
    identity: { controller: AbortController; provider?: SearchProvider },
    execution: {
      authorizeDispatch?: () => Promise<void> | void;
      onProgress?: WebProgress;
    }
  ): Promise<Record<string, unknown>> {
    const configuration = await this.store.runtimeConfiguration(input.provider);
    identity.provider = configuration.provider;
    let completed = 0;
    const queries = await concurrentMap(input.queries, 2, async (query) => {
      execution.onProgress?.({
        phase: 'queued',
        provider: configuration.provider,
        query,
        completed,
        total: input.queries.length,
      });
      try {
        const result = await this.searchOne(
          configuration,
          query,
          input.resultCount,
          signal,
          execution.authorizeDispatch,
          execution.onProgress,
          completed,
          input.queries.length
        );
        completed += 1;
        execution.onProgress?.({
          phase: 'completed',
          provider: configuration.provider,
          query,
          completed,
          total: input.queries.length,
        });
        return { query, ...result, error: null };
      } catch (error) {
        if (signal.aborted) {
          execution.onProgress?.({
            phase: 'cancelled',
            provider: configuration.provider,
            query,
            completed,
            total: input.queries.length,
          });
          throw new Error('The web request was cancelled.');
        }
        completed += 1;
        const message = text(error instanceof Error ? error.message : String(error), 500);
        execution.onProgress?.({
          phase: 'failed',
          provider: configuration.provider,
          query,
          completed,
          total: input.queries.length,
          error: message,
        });
        return {
          query,
          provider: configuration.provider,
          answer: '',
          results: [],
          error: message,
        };
      }
    });
    const providerError = queries.find((query) => query.error)?.error ?? null;
    await this.store.noteProviderError(
      configuration.provider,
      configuration.credentialGeneration,
      providerError
    );
    let fetched: Record<string, unknown>[] = [];
    if (input.includeContent) {
      const urls = [
        ...new Set(queries.flatMap((query) => query.results.map((result) => result.url))),
      ].slice(0, 4);
      fetched = (
        await this.fetchContent(
          taskId,
          urls,
          signal,
          execution.authorizeDispatch,
          execution.onProgress
        )
      ).items as Record<string, unknown>[];
    }
    return { queries, content: fetched };
  }

  private async searchOne(
    configuration: WebSearchRuntimeConfiguration,
    query: string,
    resultCount: number,
    signal: AbortSignal,
    authorizeDispatch?: () => Promise<void> | void,
    onProgress?: WebProgress,
    completed = 0,
    total = 1
  ): Promise<SearchResponse> {
    const { provider, apiKey } = configuration;
    const endpoint = PROVIDER_ENDPOINTS[provider];
    const headers: Record<string, string> = { Accept: 'application/json' };
    let url = endpoint;
    let body: Record<string, unknown> | undefined;
    if (provider === 'openai') {
      headers.Authorization = `Bearer ${apiKey}`;
      headers['Content-Type'] = 'application/json';
      body = {
        model: 'gpt-5.4',
        instructions: 'Search the web and answer concisely with source citations.',
        input: query,
        tools: [{ type: 'web_search' }],
        tool_choice: { type: 'web_search' },
        include: ['web_search_call.action.sources'],
        store: false,
      };
    } else if (provider === 'exa') {
      headers['x-api-key'] = apiKey;
      headers['Content-Type'] = 'application/json';
      body = {
        query,
        type: 'auto',
        numResults: resultCount,
        contents: { text: { maxCharacters: 3_000 }, highlights: true },
      };
    } else if (provider === 'brave') {
      headers['X-Subscription-Token'] = apiKey;
      url = `${endpoint}?${new URLSearchParams({ q: query, count: String(resultCount) })}`;
    } else if (provider === 'parallel') {
      headers['x-api-key'] = apiKey;
      headers['Content-Type'] = 'application/json';
      body = {
        objective: query,
        search_queries: [query],
        advanced_settings: { max_results: resultCount },
      };
    } else if (provider === 'tavily') {
      headers.Authorization = `Bearer ${apiKey}`;
      headers['Content-Type'] = 'application/json';
      body = {
        query,
        search_depth: 'basic',
        max_results: resultCount,
        include_answer: 'basic',
        include_raw_content: false,
      };
    } else if (provider === 'perplexity') {
      headers.Authorization = `Bearer ${apiKey}`;
      headers['Content-Type'] = 'application/json';
      body = {
        model: 'sonar',
        messages: [{ role: 'user', content: query }],
        max_tokens: 1_024,
        return_related_questions: false,
      };
    } else {
      headers['x-goog-api-key'] = apiKey;
      headers['Content-Type'] = 'application/json';
      body = {
        contents: [{ role: 'user', parts: [{ text: query }] }],
        tools: [{ google_search: {} }],
      };
    }

    const release = await this.network.acquire(signal);
    try {
      if (signal.aborted) throw new Error('The web request was cancelled.');
      await authorizeDispatch?.();
      await this.store.validateRuntimeConfiguration(configuration);
      if (signal.aborted) throw new Error('The web request was cancelled.');
      onProgress?.({ phase: 'dispatching', provider, query, completed, total });
      const response = await this.providerFetch(url, {
        method: body ? 'POST' : 'GET',
        headers,
        body: body ? JSON.stringify(body) : undefined,
        redirect: 'manual',
        signal,
      });
      if (response.status >= 300 && response.status < 400) {
        await response.body?.cancel().catch(() => undefined);
        throw new Error(`${provider} returned a redirect, which is not followed.`);
      }
      if (!response.ok) {
        await response.body?.cancel().catch(() => undefined);
        if (response.status === 401 || response.status === 403) {
          throw new Error(`${provider} rejected the configured API key (HTTP ${response.status}).`);
        }
        if (response.status === 429) {
          throw new Error(`${provider} rate limit was reached (HTTP 429).`);
        }
        throw new Error(`${provider} search failed with HTTP ${response.status}.`);
      }
      const data = await readBoundedJson(response);
      return this.normalizeProviderResponse(provider, data, resultCount);
    } finally {
      release();
    }
  }

  private normalizeProviderResponse(
    provider: SearchProvider,
    data: Record<string, unknown>,
    limit: number
  ): SearchResponse {
    if (provider === 'brave') {
      const results = normalizeResults((record(data.web).results as unknown[]) ?? [], limit);
      return { provider, answer: answerFromResults(results), results };
    }
    if (provider === 'exa' || provider === 'parallel' || provider === 'tavily') {
      const rawResults = Array.isArray(data.results) ? data.results : [];
      const normalizedInput = rawResults.map((value) => {
        const item = record(value);
        const excerpts = Array.isArray(item.excerpts)
          ? item.excerpts.map((part) => text(part, 2_000))
          : [];
        const highlights = Array.isArray(item.highlights)
          ? item.highlights.map((part) => text(part, 2_000))
          : [];
        return { ...item, snippet: item.content ?? excerpts[0] ?? highlights[0] ?? item.text };
      });
      const results = normalizeResults(normalizedInput, limit);
      return {
        provider,
        answer: text(data.answer) || answerFromResults(results),
        results,
      };
    }
    if (provider === 'perplexity') {
      const choices = Array.isArray(data.choices) ? data.choices : [];
      const answer = text(record(record(choices[0]).message).content);
      const citations = Array.isArray(data.citations) ? data.citations : [];
      const searchResults = Array.isArray(data.search_results) ? data.search_results : [];
      const results = normalizeResults(
        [
          ...searchResults,
          ...citations.map((citation, index) =>
            typeof citation === 'string'
              ? { url: citation, title: `Source ${index + 1}` }
              : citation
          ),
        ],
        limit
      );
      return { provider, answer, results };
    }
    if (provider === 'gemini') {
      const candidate = record(Array.isArray(data.candidates) ? data.candidates[0] : undefined);
      const parts = Array.isArray(record(candidate.content).parts)
        ? (record(candidate.content).parts as unknown[])
        : [];
      const answer = parts
        .map((part) => text(record(part).text))
        .filter(Boolean)
        .join('\n');
      const chunks = Array.isArray(record(candidate.groundingMetadata).groundingChunks)
        ? (record(candidate.groundingMetadata).groundingChunks as unknown[])
        : [];
      const results = normalizeResults(
        chunks.map((chunk) => record(record(chunk).web)),
        limit
      );
      return { provider, answer, results };
    }

    const output = Array.isArray(data.output) ? data.output : [];
    const messages = output.filter((item) => record(item).type === 'message');
    const content = messages.flatMap((item) =>
      Array.isArray(record(item).content) ? (record(item).content as unknown[]) : []
    );
    const answer =
      text(data.output_text) ||
      content
        .map((part) => text(record(part).text))
        .filter(Boolean)
        .join('\n');
    const annotations = content.flatMap((part) =>
      Array.isArray(record(part).annotations) ? (record(part).annotations as unknown[]) : []
    );
    const calls = output.filter((item) => record(item).type === 'web_search_call');
    const sources = calls.flatMap((call) => {
      const item = record(call);
      const actionSources = record(item.action).sources;
      return [actionSources, item.sources, item.results].flatMap((value) =>
        Array.isArray(value) ? value : []
      );
    });
    const results = normalizeResults([...annotations, ...sources], limit);
    return { provider, answer, results };
  }

  private async fetchContent(
    taskId: string,
    urls: string[],
    signal: AbortSignal,
    authorizeDispatch?: () => Promise<void> | void,
    onProgress?: WebProgress
  ): Promise<{ items: Record<string, unknown>[] }> {
    let completed = 0;
    const items = await concurrentMap(urls, 2, async (url) => {
      try {
        onProgress?.({
          phase: 'queued',
          provider: null,
          query: url,
          completed,
          total: urls.length,
        });
        const release = await this.network.acquire(signal);
        let response: Awaited<ReturnType<ContentFetch>>;
        try {
          if (signal.aborted) throw new Error('The web request was cancelled.');
          await authorizeDispatch?.();
          await this.store.assertEnabled();
          if (signal.aborted) throw new Error('The web request was cancelled.');
          onProgress?.({
            phase: 'dispatching',
            provider: null,
            query: url,
            completed,
            total: urls.length,
          });
          response = await this.contentFetch(
            { url, maxResponseBytes: MAX_NETWORK_RESPONSE_BYTES },
            signal
          );
        } finally {
          release();
        }
        if (response.status < 200 || response.status >= 300) {
          throw new Error(`Page retrieval failed with HTTP ${response.status}.`);
        }
        const mimeType =
          String(response.headers['content-type'] ?? 'text/plain')
            .split(';')[0]
            ?.trim()
            .toLowerCase() ?? 'text/plain';
        if (!['text/html', 'text/markdown', 'text/plain'].includes(mimeType)) {
          throw new Error('Only HTML, Markdown, and plain text pages are supported.');
        }
        const raw = Buffer.from(response.body).toString('utf8');
        const extracted =
          mimeType === 'text/html' ? this.extractHtml(raw) : { title: '', content: raw };
        if (signal.aborted) throw new Error('The web request was cancelled.');
        const content = text(extracted.content, MAX_NETWORK_RESPONSE_BYTES);
        if (!content) throw new Error('The page did not contain readable text.');
        if (signal.aborted) throw new Error('The web request was cancelled.');
        const cached = await this.store.storeContent({
          taskId,
          url,
          title: extracted.title,
          mimeType,
          content,
        });
        completed += 1;
        onProgress?.({
          phase: 'completed',
          provider: null,
          query: url,
          completed,
          total: urls.length,
        });
        return {
          url,
          title: extracted.title,
          mimeType,
          excerpt: content.slice(0, 4_000),
          truncated: content.length > 4_000,
          ...cached,
          error: null,
        };
      } catch (error) {
        if (signal.aborted) {
          onProgress?.({
            phase: 'cancelled',
            provider: null,
            query: url,
            completed,
            total: urls.length,
          });
          throw new Error('The web request was cancelled.');
        }
        completed += 1;
        const message = text(error instanceof Error ? error.message : String(error), 500);
        onProgress?.({
          phase: 'failed',
          provider: null,
          query: url,
          completed,
          total: urls.length,
          error: message,
        });
        return {
          url,
          error: message,
        };
      }
    });
    return { items };
  }

  private extractHtml(html: string): { title: string; content: string } {
    const { document } = parseHTML(html);
    for (const element of document.querySelectorAll(
      'script, style, noscript, iframe, object, embed, svg, form, button, input, img'
    )) {
      element.remove();
    }
    for (const anchor of document.querySelectorAll('a')) {
      const safeUrl = httpsUrl(anchor.getAttribute('href'));
      if (safeUrl) anchor.setAttribute('href', safeUrl);
      else anchor.removeAttribute('href');
    }
    const article = new Readability(document as unknown as Document, { charThreshold: 0 }).parse();
    const turndown = new TurndownService({ codeBlockStyle: 'fenced', headingStyle: 'atx' });
    return {
      title: text(article?.title ?? document.title, 500),
      content: article?.content
        ? turndown.turndown(article.content)
        : text(document.body?.textContent ?? '', MAX_NETWORK_RESPONSE_BYTES),
    };
  }
}
