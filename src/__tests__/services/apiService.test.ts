import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { apiService } from '../../services/apiService';

// Mock fetch
global.fetch = vi.fn();

// Mock response helper
const mockResponse = (data: any, status = 200, ok = true) => {
  return Promise.resolve({
    ok,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(JSON.stringify(data)),
    headers: new Map([['content-type', 'application/json']]),
  } as any);
};

describe('ApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockData = { id: 1, name: 'Test User' };
      (fetch as any).mockResolvedValue(mockResponse(mockData));

      const result = await apiService.get('/users/1');
      
      expect(fetch).toHaveBeenCalledWith('/users/1', expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }));
      expect(result).toEqual(mockData);
    });

    it('should handle GET request with query parameters', async () => {
      const mockData = { users: [], total: 0 };
      (fetch as any).mockResolvedValue(mockResponse(mockData));

      const params = { page: 1, limit: 10, search: 'john' };
      await apiService.get('/users', { params });
      
      expect(fetch).toHaveBeenCalledWith(
        '/users?page=1&limit=10&search=john',
        expect.any(Object)
      );
    });

    it('should handle GET request with custom headers', async () => {
      const mockData = { protected: 'data' };
      (fetch as any).mockResolvedValue(mockResponse(mockData));

      const headers = { Authorization: 'Bearer token123' };
      await apiService.get('/protected', { headers });
      
      expect(fetch).toHaveBeenCalledWith('/protected', expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token123',
        }),
      }));
    });
  });

  describe('POST requests', () => {
    it('should make successful POST request', async () => {
      const postData = { name: 'New User', email: 'new@example.com' };
      const responseData = { id: 123, ...postData };
      (fetch as any).mockResolvedValue(mockResponse(responseData, 201));

      const result = await apiService.post('/users', postData);
      
      expect(fetch).toHaveBeenCalledWith('/users', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(postData),
      }));
      expect(result).toEqual(responseData);
    });

    it('should handle POST request with FormData', async () => {
      const formData = new FormData();
      formData.append('file', new Blob(['test'], { type: 'text/plain' }), 'test.txt');
      formData.append('name', 'Test Upload');

      const responseData = { success: true, fileId: 'file123' };
      (fetch as any).mockResolvedValue(mockResponse(responseData));

      await apiService.post('/upload', formData);
      
      expect(fetch).toHaveBeenCalledWith('/upload', expect.objectContaining({
        method: 'POST',
        body: formData,
        // Should NOT include Content-Type header for FormData
      }));
    });
  });

  describe('PUT requests', () => {
    it('should make successful PUT request', async () => {
      const updateData = { name: 'Updated User' };
      const responseData = { id: 1, name: 'Updated User', email: 'user@example.com' };
      (fetch as any).mockResolvedValue(mockResponse(responseData));

      const result = await apiService.put('/users/1', updateData);
      
      expect(fetch).toHaveBeenCalledWith('/users/1', expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(updateData),
      }));
      expect(result).toEqual(responseData);
    });
  });

  describe('PATCH requests', () => {
    it('should make successful PATCH request', async () => {
      const patchData = { status: 'active' };
      const responseData = { id: 1, status: 'active', name: 'User' };
      (fetch as any).mockResolvedValue(mockResponse(responseData));

      const result = await apiService.patch('/users/1', patchData);
      
      expect(fetch).toHaveBeenCalledWith('/users/1', expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify(patchData),
      }));
      expect(result).toEqual(responseData);
    });
  });

  describe('DELETE requests', () => {
    it('should make successful DELETE request', async () => {
      (fetch as any).mockResolvedValue(mockResponse({ success: true }, 204));

      const result = await apiService.delete('/users/1');
      
      expect(fetch).toHaveBeenCalledWith('/users/1', expect.objectContaining({
        method: 'DELETE',
      }));
      expect(result).toEqual({ success: true });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors', async () => {
      const errorResponse = { error: 'User not found' };
      (fetch as any).mockResolvedValue(mockResponse(errorResponse, 404, false));

      await expect(apiService.get('/users/999')).rejects.toThrow('HTTP 404');
    });

    it('should handle 500 errors', async () => {
      const errorResponse = { error: 'Internal server error' };
      (fetch as any).mockResolvedValue(mockResponse(errorResponse, 500, false));

      await expect(apiService.get('/users')).rejects.toThrow('HTTP 500');
    });

    it('should handle network errors', async () => {
      (fetch as any).mockRejectedValue(new Error('Network error'));

      await expect(apiService.get('/users')).rejects.toThrow('Network error');
    });

    it('should handle malformed JSON responses', async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
        text: vi.fn().mockResolvedValue('Invalid JSON response'),
      });

      await expect(apiService.get('/users')).rejects.toThrow('Invalid JSON');
    });

    it('should handle timeout errors', async () => {
      vi.useFakeTimers();
      
      (fetch as any).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 10000))
      );

      const requestPromise = apiService.get('/users', { timeout: 5000 });
      
      vi.advanceTimersByTime(6000);
      
      await expect(requestPromise).rejects.toThrow('timeout');
      
      vi.useRealTimers();
    });
  });

  describe('Request Interceptors', () => {
    it('should apply request interceptors', async () => {
      const mockData = { data: 'test' };
      (fetch as any).mockResolvedValue(mockResponse(mockData));

      // Mock interceptor that adds auth header
      const requestInterceptor = vi.fn((config) => ({
        ...config,
        headers: { ...config.headers, Authorization: 'Bearer interceptor-token' }
      }));

      apiService.addRequestInterceptor(requestInterceptor);
      
      await apiService.get('/protected');
      
      expect(requestInterceptor).toHaveBeenCalled();
      expect(fetch).toHaveBeenCalledWith('/protected', expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer interceptor-token',
        }),
      }));
    });
  });

  describe('Response Interceptors', () => {
    it('should apply response interceptors', async () => {
      const originalData = { data: 'original' };
      const transformedData = { data: 'transformed' };
      (fetch as any).mockResolvedValue(mockResponse(originalData));

      // Mock interceptor that transforms response
      const responseInterceptor = vi.fn(() => transformedData);
      apiService.addResponseInterceptor(responseInterceptor);
      
      const result = await apiService.get('/data');
      
      expect(responseInterceptor).toHaveBeenCalledWith(originalData);
      expect(result).toEqual(transformedData);
    });

    it('should handle errors in response interceptors', async () => {
      const mockData = { data: 'test' };
      (fetch as any).mockResolvedValue(mockResponse(mockData));

      const errorInterceptor = vi.fn(() => {
        throw new Error('Interceptor error');
      });
      apiService.addResponseInterceptor(errorInterceptor);
      
      await expect(apiService.get('/data')).rejects.toThrow('Interceptor error');
    });
  });

  describe('Request Retry Logic', () => {
    it('should retry failed requests', async () => {
      (fetch as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockResponse({ success: true }));

      const result = await apiService.get('/data', { retries: 3 });
      
      expect(fetch).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ success: true });
    });

    it('should fail after max retries', async () => {
      (fetch as any).mockRejectedValue(new Error('Persistent error'));

      await expect(apiService.get('/data', { retries: 2 })).rejects.toThrow('Persistent error');
      expect(fetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should use exponential backoff for retries', async () => {
      vi.useFakeTimers();
      
      (fetch as any)
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockResolvedValueOnce(mockResponse({ success: true }));

      const requestPromise = apiService.get('/data', { 
        retries: 1, 
        retryDelay: 1000 
      });
      
      // Fast forward through retry delay
      vi.advanceTimersByTime(1000);
      
      const result = await requestPromise;
      expect(result).toEqual({ success: true });
      
      vi.useRealTimers();
    });
  });

  describe('Request Caching', () => {
    it('should cache GET requests', async () => {
      const mockData = { cached: 'data' };
      (fetch as any).mockResolvedValue(mockResponse(mockData));

      // First request
      const result1 = await apiService.get('/data', { cache: true });
      expect(fetch).toHaveBeenCalledTimes(1);
      
      // Second request should use cache
      const result2 = await apiService.get('/data', { cache: true });
      expect(fetch).toHaveBeenCalledTimes(1); // Should not make second request
      
      expect(result1).toEqual(result2);
    });

    it('should respect cache TTL', async () => {
      vi.useFakeTimers();
      
      const mockData = { ttl: 'data' };
      (fetch as any).mockResolvedValue(mockResponse(mockData));

      // First request
      await apiService.get('/data', { cache: true, cacheTTL: 5000 });
      expect(fetch).toHaveBeenCalledTimes(1);
      
      // Within TTL - should use cache
      vi.advanceTimersByTime(3000);
      await apiService.get('/data', { cache: true, cacheTTL: 5000 });
      expect(fetch).toHaveBeenCalledTimes(1);
      
      // After TTL - should make new request
      vi.advanceTimersByTime(3000);
      await apiService.get('/data', { cache: true, cacheTTL: 5000 });
      expect(fetch).toHaveBeenCalledTimes(2);
      
      vi.useRealTimers();
    });
  });

  describe('Progress Tracking', () => {
    it('should track upload progress', async () => {
      const progressCallback = vi.fn();
      const formData = new FormData();
      formData.append('file', new Blob(['large file content'], { type: 'text/plain' }));

      (fetch as any).mockResolvedValue(mockResponse({ success: true }));

      await apiService.post('/upload', formData, { 
        onUploadProgress: progressCallback 
      });
      
      // Progress callback should be called during upload
      expect(progressCallback).toHaveBeenCalled();
    });

    it('should track download progress', async () => {
      const progressCallback = vi.fn();
      
      (fetch as any).mockResolvedValue(mockResponse({ largeData: 'content' }));

      await apiService.get('/download', { 
        onDownloadProgress: progressCallback 
      });
      
      // Progress callback should be called during download
      expect(progressCallback).toHaveBeenCalled();
    });
  });

  describe('Request Cancellation', () => {
    it('should cancel requests using AbortController', async () => {
      const controller = new AbortController();
      
      (fetch as any).mockImplementation((url, config) => {
        if (config.signal?.aborted) {
          return Promise.reject(new Error('Request aborted'));
        }
        return new Promise(resolve => setTimeout(resolve, 5000));
      });

      const requestPromise = apiService.get('/slow-endpoint', { 
        signal: controller.signal 
      });
      
      // Cancel the request
      controller.abort();
      
      await expect(requestPromise).rejects.toThrow('Request aborted');
    });
  });

  describe('Base URL and Path Resolution', () => {
    it('should handle relative URLs correctly', async () => {
      (fetch as any).mockResolvedValue(mockResponse({ data: 'test' }));

      await apiService.get('users');
      
      expect(fetch).toHaveBeenCalledWith('users', expect.any(Object));
    });

    it('should handle absolute URLs correctly', async () => {
      (fetch as any).mockResolvedValue(mockResponse({ data: 'test' }));

      await apiService.get('https://api.example.com/users');
      
      expect(fetch).toHaveBeenCalledWith('https://api.example.com/users', expect.any(Object));
    });

    it('should join base URL with relative paths', async () => {
      apiService.setBaseURL('https://api.example.com');
      (fetch as any).mockResolvedValue(mockResponse({ data: 'test' }));

      await apiService.get('/users');
      
      expect(fetch).toHaveBeenCalledWith('https://api.example.com/users', expect.any(Object));
    });
  });
});