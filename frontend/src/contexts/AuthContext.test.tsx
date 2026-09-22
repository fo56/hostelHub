import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom'; // Ensure DOM matchers like toHaveTextContent work
import { AuthProvider, useAuth } from './AuthContext';

// A simple test component that consumes AuthContext
const TestComponent = () => {
  const { user, isLoading } = useAuth();

  return (
    <div>
      <div data-testid="user">{user ? user.username : 'null'}</div>
      <div data-testid="loading">{String(isLoading)}</div>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Mock global fetch using globalThis instead of global
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with isLoading=false and user=null if no token exists', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Because there's no token in localStorage, it shouldn't fetch
    // the session, so isLoading should become false quickly.
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    expect(screen.getByTestId('user')).toHaveTextContent('null');
  });

  it('should restore session if a valid token exists in localStorage', async () => {
    localStorage.setItem('accessToken', 'mock-valid-token');

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { _id: '1', username: 'john_doe', role: 'STUDENT' } })
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Initial state might be loading=true, then it resolves
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    // User should be populated from the mocked fetch response
    expect(screen.getByTestId('user')).toHaveTextContent('john_doe');
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/me'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-valid-token'
        })
      })
    );
  });

  it('should clear token and user if session restore fails (e.g. invalid token)', async () => {
    localStorage.setItem('accessToken', 'mock-invalid-token');

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Invalid token' })
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    // The token should be cleared and user should be null
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(screen.getByTestId('user')).toHaveTextContent('null');
  });
});