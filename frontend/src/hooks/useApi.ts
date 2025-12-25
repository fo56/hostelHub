import { useCallback } from 'react';
import { authService } from '../services/authService';

const API_BASE_URL = 'http://localhost:8000/api';

interface RequestOptions {
  headers?: Record<string, string>;
  body?: any;
}

export const useApi = () => {
  const getToken = () => {
    return localStorage.getItem('accessToken');
  };

  const request = useCallback(
    async (
      endpoint: string,
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
      body?: any,
      options?: RequestOptions
    ) => {
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
            await authService.refreshToken();
            // Retry with new token
            token = getToken();
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
              config.headers = headers;
              response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            }
          }
        } catch (error) {
          // If refresh fails, clear tokens and redirect to login
          authService.clearTokens();
          window.location.href = '/login';
          throw new Error('Session expired. Please log in again.');
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || `HTTP Error: ${response.status}`;
        
        // Provide better error messages
        if (response.status === 403) {
          throw new Error('You do not have permission to perform this action.');
        } else if (response.status === 404) {
          throw new Error('The requested resource was not found.');
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again later.');
        }
        
        throw new Error(errorMessage);
      }

      return response.json();
    },
    []
  );

  return { request };
};
