import { describe, it, expect, vi } from 'vitest';
import { apiService } from '../services/apiService';

describe('scratch timeout', () => {
  it('should reject promise after fake timer advance', async () => {
    vi.useFakeTimers();

    const promise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('timeout')), 1000);
    });

    vi.advanceTimersByTime(1500);

    await expect(promise).rejects.toThrow('timeout');

    vi.useRealTimers();
  });

  it('should increment debug counter when scheduling timeout in apiService', async () => {
    vi.useFakeTimers();

    const originalFetch = global.fetch;
    const fetchMock = vi.fn(() => new Promise(resolve => setTimeout(resolve, 10000)) as any);
    (global.fetch as typeof global.fetch) = fetchMock as unknown as typeof global.fetch;

    const requestPromise = (apiService as any)
      .get('/debug', { timeout: 5000 })
      .catch((error: unknown) => error);

    await vi.advanceTimersByTimeAsync(6000);

    expect((apiService as any).__debugTimeoutValues).toContain(5000);
    expect((apiService as any).__debugTimeoutCount).toBeGreaterThan(0);

    const result = await requestPromise;
    expect(result).toBeInstanceOf(Error);
    expect((result as Error).message).toBe('timeout');

    (global.fetch as typeof global.fetch) = originalFetch;

    vi.useRealTimers();
  });
});
