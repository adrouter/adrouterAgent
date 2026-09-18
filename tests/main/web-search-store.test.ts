import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type WebSearchCipher, WebSearchStore } from '@/main/web-search-store';

const directories: string[] = [];
const cipher: WebSearchCipher = {
  assertSecure: async () => undefined,
  encrypt: async (value) => Buffer.from(value).toString('base64'),
  decrypt: async (value) => Buffer.from(value, 'base64').toString('utf8'),
};

afterEach(async () => {
  vi.useRealTimers();
  await Promise.all(
    directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

const createStore = async (): Promise<WebSearchStore> => {
  const directory = await mkdtemp(join(tmpdir(), 'adrouter-web-search-'));
  directories.push(directory);
  return new WebSearchStore(
    join(directory, 'settings.json'),
    join(directory, 'cache.json'),
    cipher
  );
};

describe('web search encrypted state', () => {
  it('fails closed when secure credential storage is unavailable', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'adrouter-web-search-'));
    directories.push(directory);
    const unavailableCipher: WebSearchCipher = {
      assertSecure: async () => {
        throw new Error('Secure credential storage is unavailable.');
      },
      encrypt: cipher.encrypt,
      decrypt: cipher.decrypt,
    };
    const store = new WebSearchStore(
      join(directory, 'settings.json'),
      join(directory, 'cache.json'),
      unavailableCipher
    );
    await expect(store.updateSettings({ enabled: true, defaultProvider: 'auto' })).rejects.toThrow(
      /unavailable/
    );
    await expect(store.saveCredential('openai', 'secret')).rejects.toThrow(/unavailable/);
    expect((await store.getSettings()).enabled).toBe(false);
  });

  it('defaults disabled and returns only configured status after saving a credential', async () => {
    const store = await createStore();
    expect(await store.getSettings()).toMatchObject({
      enabled: false,
      defaultProvider: 'auto',
      cacheEntries: 0,
    });
    const status = await store.saveCredential('openai', 'secret-key-value');
    expect(status.providers.find(({ provider }) => provider === 'openai')).toEqual({
      provider: 'openai',
      configured: true,
      error: null,
    });
    expect(JSON.stringify(status)).not.toContain('secret-key-value');
    await store.updateSettings({ enabled: true, defaultProvider: 'auto' });
    await expect(store.runtimeConfiguration()).resolves.toMatchObject({
      provider: 'openai',
      apiKey: 'secret-key-value',
    });
    const configuration = await store.runtimeConfiguration('openai');
    await store.noteProviderError(
      'openai',
      configuration.credentialGeneration,
      'Provider unavailable'
    );
    expect(
      (await store.getSettings()).providers.find(({ provider }) => provider === 'openai')
    ).toEqual({ provider: 'openai', configured: true, error: 'Provider unavailable' });
  });

  it('fails clearly for explicit unconfigured providers and after credential deletion', async () => {
    const store = await createStore();
    await store.saveCredential('exa', 'exa-secret');
    await store.updateSettings({ enabled: true, defaultProvider: 'exa' });
    await expect(store.runtimeConfiguration('brave')).rejects.toThrow(/not configured/);
    await store.deleteCredential('exa');
    await expect(store.runtimeConfiguration()).rejects.toThrow(/not configured/);
  });

  it('binds encrypted cached content to one task and clears it explicitly', async () => {
    const store = await createStore();
    const cached = await store.storeContent({
      taskId: '11111111-1111-4111-8111-111111111111',
      url: 'https://example.com/',
      title: 'Example',
      mimeType: 'text/plain',
      content: 'bounded content',
    });
    await expect(
      store.getContent({
        taskId: '11111111-1111-4111-8111-111111111111',
        handle: cached.handle,
        maxCharacters: 7,
      })
    ).resolves.toMatchObject({ content: 'bounded', nextOffset: 7 });
    await expect(
      store.getContent({
        taskId: '22222222-2222-4222-8222-222222222222',
        handle: cached.handle,
      })
    ).rejects.toThrow(/another task/);
    await store.clearCache();
    await expect(
      store.getContent({
        taskId: '11111111-1111-4111-8111-111111111111',
        handle: cached.handle,
      })
    ).rejects.toThrow(/expired or was evicted/);
  });

  it('prunes expired content on initialization and access', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-18T00:00:00.000Z'));
    const store = await createStore();
    const cached = await store.storeContent({
      taskId: '11111111-1111-4111-8111-111111111111',
      url: 'https://example.com/',
      title: 'Example',
      mimeType: 'text/plain',
      content: 'expires',
    });
    vi.setSystemTime(new Date('2026-09-18T01:00:00.001Z'));
    await store.initialize();
    await expect(
      store.getContent({
        taskId: '11111111-1111-4111-8111-111111111111',
        handle: cached.handle,
      })
    ).rejects.toThrow(/expired or was evicted/);
    expect((await store.getSettings()).cacheEntries).toBe(0);
  });

  it('serializes concurrent credential mutations without losing either provider', async () => {
    const store = await createStore();
    await Promise.all([
      store.saveCredential('openai', 'openai-secret'),
      store.saveCredential('brave', 'brave-secret'),
    ]);
    const settings = await store.getSettings();
    expect(
      settings.providers.filter((provider) => provider.configured).map((item) => item.provider)
    ).toEqual(['openai', 'brave']);
  });

  it('serializes concurrent page inserts and retains both task-owned handles', async () => {
    const store = await createStore();
    const [first, second] = await Promise.all([
      store.storeContent({
        taskId: '11111111-1111-4111-8111-111111111111',
        url: 'https://first.example/',
        title: 'First',
        mimeType: 'text/plain',
        content: 'first page',
      }),
      store.storeContent({
        taskId: '11111111-1111-4111-8111-111111111111',
        url: 'https://second.example/',
        title: 'Second',
        mimeType: 'text/plain',
        content: 'second page',
      }),
    ]);
    await expect(
      store.getContent({ taskId: '11111111-1111-4111-8111-111111111111', handle: first.handle })
    ).resolves.toMatchObject({ content: 'first page' });
    await expect(
      store.getContent({ taskId: '11111111-1111-4111-8111-111111111111', handle: second.handle })
    ).resolves.toMatchObject({ content: 'second page' });
    expect((await store.getSettings()).cacheEntries).toBe(2);
  });

  it('leaves the previous settings readable after an atomic replacement fails', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'adrouter-web-search-'));
    directories.push(directory);
    const settingsPath = join(directory, 'settings.json');
    const cachePath = join(directory, 'cache.json');
    const seedStore = new WebSearchStore(settingsPath, cachePath, cipher);
    await seedStore.saveCredential('openai', 'preserved-secret');
    await seedStore.updateSettings({ enabled: true, defaultProvider: 'openai' });
    const failingStore = new WebSearchStore(settingsPath, cachePath, cipher, {
      rename: async () => {
        throw new Error('simulated atomic replacement failure');
      },
    });
    await expect(failingStore.saveCredential('brave', 'must-not-commit')).rejects.toThrow(
      /simulated atomic replacement failure/
    );
    await expect(failingStore.runtimeConfiguration('openai')).resolves.toMatchObject({
      apiKey: 'preserved-secret',
    });
    await expect(failingStore.runtimeConfiguration('brave')).rejects.toThrow(/not configured/);
  });

  it('rejects stale provider status after key replacement or deletion', async () => {
    const store = await createStore();
    await store.saveCredential('openai', 'old-secret');
    await store.updateSettings({ enabled: true, defaultProvider: 'openai' });
    const stale = await store.runtimeConfiguration('openai');
    await store.saveCredential('openai', 'replacement-secret');
    await store.noteProviderError('openai', stale.credentialGeneration, 'stale failure');
    expect(
      (await store.getSettings()).providers.find((item) => item.provider === 'openai')?.error
    ).toBeNull();
    await store.deleteCredential('openai');
    await store.noteProviderError('openai', stale.credentialGeneration, 'deleted failure');
    expect(
      (await store.getSettings()).providers.find((item) => item.provider === 'openai')
    ).toMatchObject({ configured: false, error: null });
  });

  it('prevents a delayed cache write from repopulating a cleared cache', async () => {
    let releaseEncryption: (() => void) | undefined;
    const encryptionBlocked = new Promise<void>((resolve) => {
      releaseEncryption = resolve;
    });
    let block = true;
    const delayedCipher: WebSearchCipher = {
      ...cipher,
      encrypt: async (value) => {
        if (block) await encryptionBlocked;
        return cipher.encrypt(value);
      },
    };
    const directory = await mkdtemp(join(tmpdir(), 'adrouter-web-search-'));
    directories.push(directory);
    const store = new WebSearchStore(
      join(directory, 'settings.json'),
      join(directory, 'cache.json'),
      delayedCipher
    );
    const pending = store.storeContent({
      taskId: '11111111-1111-4111-8111-111111111111',
      url: 'https://example.com/',
      title: 'Example',
      mimeType: 'text/plain',
      content: 'late content',
    });
    await Promise.resolve();
    await store.clearCache();
    block = false;
    releaseEncryption?.();
    await expect(pending).rejects.toThrow(/cache was cleared/);
    expect((await store.getSettings()).cacheEntries).toBe(0);
  });
});
