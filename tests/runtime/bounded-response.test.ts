import { afterEach, describe, expect, it, vi } from 'vitest';
import { iterateBoundedResponse } from '@/runtime/bounded-response';

afterEach(() => vi.useRealTimers());

describe('bounded response cleanup', () => {
  it('allows continuous output beyond one minute and enforces the overall deadline', async () => {
    vi.useFakeTimers();
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    const body = new ReadableStream<Uint8Array>({
      start: (value) => {
        controller = value;
      },
    });
    const iterator = iterateBoundedResponse(new Response(body), {
      maxBytes: 100,
      idleTimeoutMs: 60_000,
      overallTimeoutMs: 125_000,
    });
    for (let i = 0; i < 3; i++) {
      const next = iterator.next();
      await vi.advanceTimersByTimeAsync(40_000);
      controller.enqueue(new Uint8Array([1]));
      expect((await next).done).toBe(false);
    }
    const rejected = expect(iterator.next()).rejects.toThrow(/timeout/);
    await vi.advanceTimersByTimeAsync(5_001);
    await rejected;
    expect(body.locked).toBe(false);
  });

  it.each([
    'idle',
    'abort',
    'oversize',
  ] as const)('delivers %s failure even when transport cancellation never settles', async (failure) => {
    vi.useFakeTimers();
    const cancel = vi.fn(() => new Promise<void>(() => {}));
    const body = new ReadableStream<Uint8Array>({ cancel });
    const signal = new AbortController();
    const response = new Response(body, {
      headers: failure === 'oversize' ? { 'content-length': '101' } : {},
    });
    const iterator = iterateBoundedResponse(response, {
      maxBytes: 100,
      idleTimeoutMs: 60_000,
      overallTimeoutMs: 600_000,
      signal: signal.signal,
    });
    let outcome: unknown;
    void iterator.next().then(
      () => {
        outcome = 'unexpected success';
      },
      (error) => {
        outcome = error;
      }
    );
    if (failure === 'abort') signal.abort(new Error('User stopped'));
    await vi.advanceTimersByTimeAsync(failure === 'idle' ? 60_001 : 1);
    expect(outcome).toBeInstanceOf(Error);
    expect(cancel).toHaveBeenCalledOnce();
    expect(body.locked).toBe(false);
  });
});
