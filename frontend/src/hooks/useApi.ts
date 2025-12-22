import { useCallback } from 'react';

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
      const token = getToken();
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
      };

      if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.body = JSON.stringify(body);
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP Error: ${response.status}`);
      }

      return response.json();
    },
    []
  );

  return { request };
};
