import { useCallback } from 'react';
import { authService } from '../services/auth.service';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

let refreshPromise: Promise<any> | null = null;

interface RequestOptions {
  headers?: Record<string, string>;
  body?: unknown;
  skipToast?: boolean;
}

const apiCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useApi = () => {
  const getToken = () => {
    return localStorage.getItem('accessToken');
  };

  const request = useCallback(
    async (
      endpoint: string,
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
      body?: unknown,
      options?: RequestOptions & { skipCache?: boolean }
    ) => {
      const isGet = method === 'GET';
      const cacheKey = endpoint;
      
      // Check cache for GET requests
      if (isGet && !options?.skipCache) {
        const cached = apiCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
          return cached.data;
        }
      }

      let token = getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options?.headers,
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const config: RequestInit = {
        method,
        headers,
        credentials: 'include',
      };

      if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.body = JSON.stringify(body);
      }

      let response = await fetch(`${API_BASE_URL}${endpoint}`, config);

      // Handle token expiry - try to refresh
      if (response.status === 401) {
        try {
          // Try to refresh token
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            if (!refreshPromise) {
              refreshPromise = authService.refreshToken().finally(() => {
                refreshPromise = null;
              });
            }
            await refreshPromise;
            // Retry with new token
            token = getToken();
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
              config.headers = headers;
              response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            }
          }
        } catch {
          // If refresh fails, clear tokens and redirect to login
          authService.clearTokens();
          window.location.href = '/login';
          throw new Error('Session expired. Please log in again.');
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = errorData.message || errorData.error || `HTTP Error: ${response.status}`;

        // Provide better error messages
        if (response.status === 403) {
          throw new Error('You do not have permission to perform this action.');
        } else if (response.status === 404) {
          throw new Error('The requested resource was not found.');
        } else if (response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }

        if (!options?.skipToast) {
          toast.error(errorMessage);
        }
        throw new Error(errorMessage);
      }

      const responseData = await response.json();

      // Save to cache if GET
      if (isGet) {
        apiCache.set(cacheKey, { data: responseData, timestamp: Date.now() });
      } else {
        // Invalidate cache for relevant endpoints if it's a mutation
        // Simple approach: clear all cache on mutation to ensure fresh data
        apiCache.clear();
      }

      return responseData;
    },
    []
  );

  const fetchApi = request; // Alias for compatibility with some components

  return { request, fetchApi };
};
