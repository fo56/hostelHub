import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useApi } from './useApi';

// Mock authService
vi.mock('../services/auth.service', () => ({
  authService: {
    refreshToken: vi.fn(),
    clearTokens: vi.fn()
  }
}));

describe('useApi Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should make a GET request and return data', async () => {
    const mockData = { id: 1, name: 'Test' };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    const { result } = renderHook(() => useApi());
    
    const data = await result.current.request('/test-endpoint');
    
    expect(data).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test-endpoint'),
      expect.objectContaining({
        method: 'GET'
      })
    );
  });

  it('should include Authorization header if token exists in localStorage', async () => {
    localStorage.setItem('accessToken', 'mock-token');
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    const { result } = renderHook(() => useApi());
    
    await result.current.request('/auth-endpoint');
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-token'
        })
      })
    );
  });

  it('should throw an error if the request fails (e.g. 403 Forbidden)', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ message: 'Forbidden' })
    });

    const { result } = renderHook(() => useApi());
    
    await expect(result.current.request('/forbidden-endpoint'))
      .rejects.toThrow('You do not have permission to perform this action.');
  });
});
