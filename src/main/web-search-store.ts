import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { safeStorage } from 'electron';
import type {
  SearchProvider,
  SearchProviderSelection,
  WebSearchSettings,
} from '../shared/contracts';
import { assertSecureCredentialStorage } from './credential-storage';

export const SEARCH_PROVIDERS: readonly SearchProvider[] = [
  'openai',
  'exa',
  'brave',
  'parallel',
  'tavily',
  'perplexity',
  'gemini',
];

interface PersistedSearchSettings {
  version: 1;
  enabled: boolean;
  defaultProvider: SearchProviderSelection;
  encryptedKeys: Partial<Record<SearchProvider, string>>;
  errors: Partial<Record<SearchProvider, string>>;
}

interface CacheEntry {
  handle: string;
  taskId: string;
  url: string;
  title: string;
  mimeType: string;
  storedAt: number;
  bytes: number;
  encryptedContent: string;
}

interface PersistedContentCache {
  version: 1;
  entries: CacheEntry[];
}

export interface WebSearchCipher {
  assertSecure(): Promise<void>;
  encrypt(value: string): Promise<string>;
  decrypt(value: string): Promise<string>;
}

export interface WebSearchRuntimeConfiguration {
  provider: SearchProvider;
  apiKey: string;
  credentialGeneration: number;
  settingsGeneration: number;
}

export type WebSearchInvalidation =
  | { type: 'disabled' }
  | { type: 'credential'; provider: SearchProvider };

const electronCipher: WebSearchCipher = {
  assertSecure: () => assertSecureCredentialStorage(),
  encrypt: async (value) => (await safeStorage.encryptStringAsync(value)).toString('base64'),
  decrypt: async (value) =>
    (await safeStorage.decryptStringAsync(Buffer.from(value, 'base64'))).result,
};

const CACHE_TTL_MS = 60 * 60 * 1_000;
const MAX_CACHE_ENTRIES = 128;
const MAX_CACHE_BYTES = 128 * 1024 * 1024;

const atomicWrite = async (path: string, value: unknown): Promise<void> => {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(value)}\n`, { encoding: 'utf8', mode: 0o600 });
    await rename(temporary, path);
  } catch (error) {
    await unlink(temporary).catch(() => undefined);
    throw error;
  }
};

const readJson = async <T>(path: string): Promise<T | undefined> => {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
};

export class WebSearchStore {
  private settingsQueue: Promise<void> = Promise.resolve();
  private cacheQueue: Promise<void> = Promise.resolve();
  private settingsGeneration = 0;
  private cacheGeneration = 0;
  private readonly credentialGenerations = new Map<SearchProvider, number>();
  private readonly invalidationListeners = new Set<(event: WebSearchInvalidation) => void>();

  public constructor(
    private readonly settingsPath: string,
    private readonly cachePath: string,
    private readonly cipher: WebSearchCipher = electronCipher
  ) {}

  public onInvalidation(listener: (event: WebSearchInvalidation) => void): () => void {
    this.invalidationListeners.add(listener);
    return () => this.invalidationListeners.delete(listener);
  }

  private invalidate(event: WebSearchInvalidation): void {
    this.settingsGeneration += 1;
    if (event.type === 'credential') {
      this.credentialGenerations.set(
        event.provider,
        (this.credentialGenerations.get(event.provider) ?? 0) + 1
      );
    }
    for (const listener of this.invalidationListeners) listener(event);
  }

  private queueSettings<T>(mutation: () => Promise<T>): Promise<T> {
    const result = this.settingsQueue.catch(() => undefined).then(mutation);
    this.settingsQueue = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  }

  private queueCache<T>(mutation: () => Promise<T>): Promise<T> {
    const result = this.cacheQueue.catch(() => undefined).then(mutation);
    this.cacheQueue = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  }

  private empty(): PersistedSearchSettings {
    return { version: 1, enabled: false, defaultProvider: 'auto', encryptedKeys: {}, errors: {} };
  }

  public async initialize(): Promise<void> {
    await this.queueCache(() => this.pruneCacheTransaction());
  }

  private async readSettings(): Promise<PersistedSearchSettings> {
    const parsed = await readJson<PersistedSearchSettings>(this.settingsPath);
    if (parsed?.version !== 1) return this.empty();
    return {
      version: 1,
      enabled: parsed.enabled === true,
      defaultProvider:
        parsed.defaultProvider === 'auto' || SEARCH_PROVIDERS.includes(parsed.defaultProvider)
          ? parsed.defaultProvider
          : 'auto',
      encryptedKeys: Object.fromEntries(
        Object.entries(parsed.encryptedKeys ?? {}).filter(
          ([provider, value]) =>
            SEARCH_PROVIDERS.includes(provider as SearchProvider) && typeof value === 'string'
        )
      ),
      errors: Object.fromEntries(
        Object.entries(parsed.errors ?? {}).filter(
          ([provider, value]) =>
            SEARCH_PROVIDERS.includes(provider as SearchProvider) && typeof value === 'string'
        )
      ),
    };
  }

  public async getSettings(): Promise<WebSearchSettings> {
    await this.settingsQueue;
    const settings = await this.readSettings();
    const cache = await this.queueCache(() => this.pruneCacheTransaction());
    return {
      version: 1,
      enabled: settings.enabled,
      defaultProvider: settings.defaultProvider,
      providers: SEARCH_PROVIDERS.map((provider) => ({
        provider,
        configured: Boolean(settings.encryptedKeys[provider]),
        error: settings.errors[provider] ?? null,
      })),
      cacheEntries: cache.entries.length,
      cacheBytes: cache.entries.reduce((total, entry) => total + entry.bytes, 0),
    };
  }

  public async updateSettings(input: {
    enabled: boolean;
    defaultProvider: SearchProviderSelection;
  }): Promise<WebSearchSettings> {
    if (!input.enabled) this.invalidate({ type: 'disabled' });
    await this.queueSettings(async () => {
      const settings = await this.readSettings();
      if (input.enabled) await this.cipher.assertSecure();
      await atomicWrite(this.settingsPath, { ...settings, ...input });
    });
    return this.getSettings();
  }

  public async assertEnabled(): Promise<void> {
    await this.settingsQueue;
    const settings = await this.readSettings();
    if (!settings.enabled) throw new Error('Web search is disabled in Settings.');
  }

  public async noteProviderError(
    provider: SearchProvider,
    credentialGeneration: number,
    error: string | null
  ): Promise<void> {
    await this.queueSettings(async () => {
      if ((this.credentialGenerations.get(provider) ?? 0) !== credentialGeneration) return;
      const settings = await this.readSettings();
      if (!settings.enabled || !settings.encryptedKeys[provider]) return;
      if (error) settings.errors[provider] = error.slice(0, 500);
      else delete settings.errors[provider];
      await atomicWrite(this.settingsPath, settings);
    });
  }

  public async saveCredential(
    provider: SearchProvider,
    apiKey: string
  ): Promise<WebSearchSettings> {
    this.invalidate({ type: 'credential', provider });
    await this.queueSettings(async () => {
      await this.cipher.assertSecure();
      const settings = await this.readSettings();
      settings.encryptedKeys[provider] = await this.cipher.encrypt(apiKey.trim());
      delete settings.errors[provider];
      await atomicWrite(this.settingsPath, settings);
    });
    return this.getSettings();
  }

  public async deleteCredential(provider: SearchProvider): Promise<WebSearchSettings> {
    this.invalidate({ type: 'credential', provider });
    await this.queueSettings(async () => {
      const settings = await this.readSettings();
      delete settings.encryptedKeys[provider];
      delete settings.errors[provider];
      await atomicWrite(this.settingsPath, settings);
    });
    return this.getSettings();
  }

  public async runtimeConfiguration(
    requested?: SearchProviderSelection
  ): Promise<WebSearchRuntimeConfiguration> {
    await this.settingsQueue;
    const settings = await this.readSettings();
    if (!settings.enabled) throw new Error('Web search is disabled in Settings.');
    await this.cipher.assertSecure();
    const selection = requested ?? settings.defaultProvider;
    const provider =
      selection === 'auto'
        ? SEARCH_PROVIDERS.find((candidate) => Boolean(settings.encryptedKeys[candidate]))
        : selection;
    if (!provider || !settings.encryptedKeys[provider]) {
      throw new Error(
        selection === 'auto'
          ? 'No web-search provider API key is configured.'
          : `${selection} web search is not configured.`
      );
    }
    return {
      provider,
      apiKey: await this.cipher.decrypt(settings.encryptedKeys[provider] as string),
      credentialGeneration: this.credentialGenerations.get(provider) ?? 0,
      settingsGeneration: this.settingsGeneration,
    };
  }

  public async validateRuntimeConfiguration(
    configuration: Pick<
      WebSearchRuntimeConfiguration,
      'provider' | 'credentialGeneration' | 'settingsGeneration'
    >
  ): Promise<void> {
    await this.settingsQueue;
    if (
      configuration.settingsGeneration !== this.settingsGeneration ||
      configuration.credentialGeneration !==
        (this.credentialGenerations.get(configuration.provider) ?? 0)
    ) {
      throw new Error('The web-search credential changed before dispatch.');
    }
    const settings = await this.readSettings();
    if (!settings.enabled) throw new Error('Web search is disabled in Settings.');
    if (!settings.encryptedKeys[configuration.provider]) {
      throw new Error(`${configuration.provider} web search is not configured.`);
    }
  }

  private async readCache(): Promise<PersistedContentCache> {
    const parsed = await readJson<PersistedContentCache>(this.cachePath);
    return parsed?.version === 1 && Array.isArray(parsed.entries)
      ? parsed
      : { version: 1, entries: [] };
  }

  private async pruneCacheTransaction(now = Date.now()): Promise<PersistedContentCache> {
    const cache = await this.readCache();
    const entries = cache.entries
      .filter((entry) => now - entry.storedAt < CACHE_TTL_MS)
      .sort((a, b) => b.storedAt - a.storedAt);
    let bytes = entries.reduce((total, entry) => total + entry.bytes, 0);
    while (entries.length > MAX_CACHE_ENTRIES || bytes > MAX_CACHE_BYTES) {
      const removed = entries.pop();
      if (!removed) break;
      bytes -= removed.bytes;
    }
    if (entries.length !== cache.entries.length)
      await atomicWrite(this.cachePath, { version: 1, entries });
    return { version: 1, entries };
  }

  public async storeContent(input: {
    taskId: string;
    url: string;
    title: string;
    mimeType: string;
    content: string;
  }): Promise<{ handle: string; bytes: number; expiresAt: string }> {
    await this.cipher.assertSecure();
    const generation = this.cacheGeneration;
    const bytes = Buffer.byteLength(input.content);
    if (bytes > MAX_CACHE_BYTES)
      throw new Error('Extracted content exceeds the search cache limit.');
    const entry: CacheEntry = {
      handle: randomUUID(),
      taskId: input.taskId,
      url: input.url,
      title: input.title.slice(0, 500),
      mimeType: input.mimeType.slice(0, 200),
      storedAt: Date.now(),
      bytes,
      encryptedContent: await this.cipher.encrypt(input.content),
    };
    await this.queueCache(async () => {
      if (generation !== this.cacheGeneration) {
        throw new Error('The search cache was cleared before content could be stored.');
      }
      const cache = await this.pruneCacheTransaction();
      cache.entries.unshift(entry);
      let total = cache.entries.reduce((sum, candidate) => sum + candidate.bytes, 0);
      while (cache.entries.length > MAX_CACHE_ENTRIES || total > MAX_CACHE_BYTES) {
        const removed = cache.entries.pop();
        if (!removed) break;
        total -= removed.bytes;
      }
      if (generation !== this.cacheGeneration) {
        throw new Error('The search cache was cleared before content could be stored.');
      }
      await atomicWrite(this.cachePath, cache);
    });
    return {
      handle: entry.handle,
      bytes,
      expiresAt: new Date(entry.storedAt + CACHE_TTL_MS).toISOString(),
    };
  }

  public async getContent(input: {
    taskId: string;
    handle: string;
    offset?: number;
    maxCharacters?: number;
  }): Promise<Record<string, unknown>> {
    const cache = await this.queueCache(() => this.pruneCacheTransaction());
    const entry = cache.entries.find((candidate) => candidate.handle === input.handle);
    if (!entry) throw new Error('Search content expired or was evicted; retrieve it again.');
    if (entry.taskId !== input.taskId) throw new Error('Search content belongs to another task.');
    await this.cipher.assertSecure();
    const content = await this.cipher.decrypt(entry.encryptedContent);
    const offset = Math.max(0, Math.min(Math.floor(input.offset ?? 0), content.length));
    const maxCharacters = Math.max(1, Math.min(Math.floor(input.maxCharacters ?? 16_000), 64_000));
    const chunk = content.slice(offset, offset + maxCharacters);
    return {
      handle: entry.handle,
      url: entry.url,
      title: entry.title,
      mimeType: entry.mimeType,
      offset,
      content: chunk,
      nextOffset: offset + chunk.length < content.length ? offset + chunk.length : null,
      totalCharacters: content.length,
    };
  }

  public async clearCache(): Promise<void> {
    this.cacheGeneration += 1;
    await this.queueCache(async () => {
      await unlink(this.cachePath).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== 'ENOENT') throw error;
      });
    });
  }
}
