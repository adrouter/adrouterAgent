import { describe, expect, it, vi } from 'vitest';
import { WebSearchService } from '@/main/web-search-service';
import type { WebSearchStore } from '@/main/web-search-store';
import type { SearchProvider } from '@/shared/contracts';

const fixtures: Record<SearchProvider, Record<string, unknown>> = {
  openai: {
    output_text: 'OpenAI answer',
    output: [
      {
        type: 'message',
        content: [
          {
            type: 'output_text',
            text: 'OpenAI answer',
            annotations: [
              { type: 'url_citation', url: 'https://openai.example/', title: 'OpenAI source' },
            ],
          },
        ],
      },
    ],
  },
  exa: { results: [{ title: 'Exa source', url: 'https://exa.example/', highlights: ['Exa'] }] },
  brave: {
    web: {
      results: [{ title: 'Brave source', url: 'https://brave.example/', description: 'Brave' }],
    },
  },
  parallel: {
    results: [
      { title: 'Parallel source', url: 'https://parallel.example/', excerpts: ['Parallel'] },
    ],
  },
  tavily: {
    answer: 'Tavily answer',
    results: [{ title: 'Tavily source', url: 'https://tavily.example/', content: 'Tavily' }],
  },
  perplexity: {
    choices: [{ message: { content: 'Perplexity answer' } }],
    citations: [{ title: 'Perplexity source', url: 'https://perplexity.example/' }],
    search_results: [
      {
        title: 'Perplexity result',
        url: 'https://perplexity-result.example/',
        snippet: 'Perplexity',
      },
    ],
  },
  gemini: {
    candidates: [
      {
        content: { parts: [{ text: 'Gemini answer' }] },
        groundingMetadata: {
          groundingChunks: [{ web: { title: 'Gemini source', uri: 'https://gemini.example/' } }],
        },
      },
    ],
  },
};

const fakeStore = (provider: SearchProvider): WebSearchStore =>
  ({
    assertEnabled: vi.fn().mockResolvedValue(undefined),
    runtimeConfiguration: vi.fn().mockResolvedValue({
      provider,
      apiKey: 'provider-secret',
      credentialGeneration: 0,
      settingsGeneration: 0,
    }),
    validateRuntimeConfiguration: vi.fn().mockResolvedValue(undefined),
    onInvalidation: vi.fn(),
    noteProviderError: vi.fn().mockResolvedValue(undefined),
    getContent: vi.fn(),
    storeContent: vi.fn(),
  }) as unknown as WebSearchStore;

describe('native web search provider adapters', () => {
  for (const provider of Object.keys(fixtures) as SearchProvider[]) {
    it(`normalizes ${provider} results without exposing its credential`, async () => {
      const providerFetch = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify(fixtures[provider])));
      const service = new WebSearchService(fakeStore(provider), providerFetch);
      const result = await service.execute({
        requestId: '11111111-1111-4111-8111-111111111111',
        taskId: '22222222-2222-4222-8222-222222222222',
        action: {
          type: 'search',
          queries: ['current information'],
          provider,
          resultCount: 5,
          includeContent: false,
        },
      });
      expect(result.queries).toEqual([
        expect.objectContaining({
          query: 'current information',
          provider,
          results: expect.arrayContaining([
            expect.objectContaining({ url: expect.stringMatching(/^https:/) }),
          ]),
          error: null,
        }),
      ]);
      expect(JSON.stringify(result)).not.toContain('provider-secret');
      expect(providerFetch).toHaveBeenCalledOnce();
      if (provider === 'perplexity') {
        expect(providerFetch).toHaveBeenCalledWith(
          'https://api.perplexity.ai/v1/sonar',
          expect.any(Object)
        );
      }
      if (provider === 'openai') {
        const init = providerFetch.mock.calls[0]?.[1] as RequestInit;
        expect(JSON.parse(String(init.body))).toMatchObject({
          model: 'gpt-5.4',
          tool_choice: { type: 'web_search' },
          store: false,
        });
      }
    });
  }

  it('reports a malformed provider response per query and never replays it', async () => {
    const providerFetch = vi.fn().mockResolvedValue(new Response('{bad json'));
    const service = new WebSearchService(fakeStore('brave'), providerFetch);
    const result = await service.execute({
      requestId: '11111111-1111-4111-8111-111111111111',
      taskId: '22222222-2222-4222-8222-222222222222',
      action: {
        type: 'search',
        queries: ['one'],
        provider: 'brave',
        resultCount: 5,
        includeContent: false,
      },
    });
    expect(result.queries).toEqual([
      expect.objectContaining({ query: 'one', error: 'Provider returned malformed JSON.' }),
    ]);
    expect(providerFetch).toHaveBeenCalledOnce();
  });

  it('keeps partial batch failures instead of retrying or dropping successful queries', async () => {
    const providerFetch = vi.fn(
      async (url: string) =>
        new Response(
          url.includes('bad')
            ? '{bad json'
            : JSON.stringify({ web: { results: [{ url: 'https://ok.example/', title: 'OK' }] } })
        )
    );
    const service = new WebSearchService(fakeStore('brave'), providerFetch);
    const result = await service.execute({
      requestId: '11111111-1111-4111-8111-111111111111',
      taskId: '22222222-2222-4222-8222-222222222222',
      action: {
        type: 'search',
        queries: ['good', 'bad'],
        provider: 'brave',
        resultCount: 5,
        includeContent: false,
      },
    });
    expect(result.queries).toEqual([
      expect.objectContaining({ query: 'good', error: null }),
      expect.objectContaining({ query: 'bad', error: 'Provider returned malformed JSON.' }),
    ]);
    expect(providerFetch).toHaveBeenCalledTimes(2);
  });

  it('extracts readable HTML, strips active markup, and stores only encrypted-cache input', async () => {
    const store = fakeStore('brave');
    vi.mocked(store.storeContent).mockResolvedValue({
      handle: '33333333-3333-4333-8333-333333333333',
      bytes: 12,
      expiresAt: '2026-09-18T01:00:00.000Z',
    });
    const contentFetch = vi.fn().mockResolvedValue({
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
      body: new TextEncoder().encode(
        '<html><head><title>Safe title</title><script>steal()</script></head><body><main><h1>Readable</h1><p>Useful content.</p><img src=x onerror=steal()></main></body></html>'
      ),
    });
    const service = new WebSearchService(store, vi.fn(), contentFetch);
    const result = await service.execute({
      requestId: '11111111-1111-4111-8111-111111111111',
      taskId: '22222222-2222-4222-8222-222222222222',
      action: { type: 'fetch-content', urls: ['https://content.example/article'] },
    });
    expect(result.items).toEqual([
      expect.objectContaining({
        url: 'https://content.example/article',
        excerpt: expect.stringContaining('Useful content.'),
        error: null,
      }),
    ]);
    expect(JSON.stringify(result)).not.toContain('steal()');
    expect(store.storeContent).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.not.stringContaining('steal()') })
    );
  });

  it('cancels an in-flight provider request without retrying it', async () => {
    let started: (() => void) | undefined;
    const providerStarted = new Promise<void>((resolve) => {
      started = resolve;
    });
    const providerFetch = vi.fn(
      async (_url: string, init: RequestInit): Promise<Response> =>
        await new Promise((_resolve, reject) => {
          started?.();
          init.signal?.addEventListener(
            'abort',
            () => reject(new DOMException('cancelled', 'AbortError')),
            { once: true }
          );
        })
    );
    const service = new WebSearchService(fakeStore('openai'), providerFetch);
    const request = service.execute({
      requestId: '11111111-1111-4111-8111-111111111111',
      taskId: '22222222-2222-4222-8222-222222222222',
      action: {
        type: 'search',
        queries: ['cancel me'],
        provider: 'openai',
        resultCount: 5,
        includeContent: false,
      },
    });
    await providerStarted;
    service.cancel('11111111-1111-4111-8111-111111111111');
    await expect(request).rejects.toThrow(/cancelled/);
    expect(providerFetch).toHaveBeenCalledOnce();
  });

  it('checks enablement before content retrieval', async () => {
    const store = fakeStore('openai');
    vi.mocked(store.assertEnabled).mockRejectedValue(
      new Error('Web search is disabled in Settings.')
    );
    const contentFetch = vi.fn();
    const service = new WebSearchService(store, vi.fn(), contentFetch);
    await expect(
      service.execute({
        requestId: '11111111-1111-4111-8111-111111111111',
        taskId: '22222222-2222-4222-8222-222222222222',
        action: { type: 'fetch-content', urls: ['https://content.example/'] },
      })
    ).rejects.toThrow(/disabled/);
    expect(contentFetch).not.toHaveBeenCalled();
  });

  it.each([
    [401, 'rejected the configured API key'],
    [429, 'rate limit'],
  ])('returns an actionable HTTP %i provider error without replay', async (status, message) => {
    const providerFetch = vi.fn().mockResolvedValue(new Response('', { status }));
    const service = new WebSearchService(fakeStore('openai'), providerFetch);
    const result = await service.execute({
      requestId: '11111111-1111-4111-8111-111111111111',
      taskId: '22222222-2222-4222-8222-222222222222',
      action: {
        type: 'search',
        queries: ['one'],
        provider: 'openai',
        resultCount: 5,
        includeContent: false,
      },
    });
    expect(JSON.stringify(result)).toContain(message);
    expect(providerFetch).toHaveBeenCalledOnce();
  });

  it('shares one abort-aware two-slot semaphore across concurrent requests', async () => {
    let active = 0;
    let maximum = 0;
    const providerFetch = vi.fn(async () => {
      active += 1;
      maximum = Math.max(maximum, active);
      await new Promise((resolve) => setTimeout(resolve, 20));
      active -= 1;
      return new Response(JSON.stringify(fixtures.brave));
    });
    const service = new WebSearchService(fakeStore('brave'), providerFetch);
    await Promise.all(
      [
        '11111111-1111-4111-8111-111111111111',
        '22222222-2222-4222-8222-222222222222',
        '33333333-3333-4333-8333-333333333333',
      ].map((requestId) =>
        service.execute({
          requestId,
          taskId: '44444444-4444-4444-8444-444444444444',
          action: {
            type: 'search',
            queries: ['one'],
            provider: 'brave',
            resultCount: 5,
            includeContent: false,
          },
        })
      )
    );
    expect(maximum).toBe(2);
    expect(providerFetch).toHaveBeenCalledTimes(3);
  });
});
