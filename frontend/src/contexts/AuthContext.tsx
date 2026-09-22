import React, { useState, useCallback, useEffect } from 'react'
import { authService } from '../services/auth.service'
import type { UserData } from '../services/auth.service'
import { createContext } from 'react'
import { logger } from '../lib/logger'

export type UserRole = 'ADMIN' | 'STUDENT' | 'WORKER'

export interface AuthContextType {
  user: UserData | null
  isLoading: boolean
  error: string | null
  login: (credentials: { email: string; password: string }) => Promise<UserData>
  logout: () => Promise<void>
  updateUser: (updates: Partial<UserData>) => void
  isAuthenticated: boolean
}

export const AuthContext = createContext<AuthContextType | null>(null)



export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true) // Gating the initial render
  const [error, setError] = useState<string | null>(null)

  // On mount, check if token exists and restore session
  useEffect(() => {
    const checkSession = async () => {
      const token = authService.getAccessToken();
      if (token) {
        try {
          const user = await authService.getMe();
          setUser(user);
        } catch (error: any) {
          if (error.status === 401 || error.message?.includes('401')) {
            try {
              await authService.refreshToken();
              const refreshedUser = await authService.getMe();
              setUser(refreshedUser);
            } catch (refreshError) {
              logger.error('AUTH', 'Failed to restore session via refresh', refreshError);
              authService.clearTokens();
              setUser(null);
            }
          } else {
            // Token invalid or other error
            logger.error('AUTH', 'Failed to restore session via /me', error);
            authService.clearTokens();
            setUser(null);
          }
        }
      }
      setIsInitializing(false);
    };
    checkSession();
  }, []);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await authService.login(credentials.email, credentials.password)
      setUser(response.user)
      return response.user
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await authService.logout()
      setUser(null)
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Logout failed'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateUser = useCallback((updates: Partial<UserData>) => {
    setUser((prev: UserData | null) => prev ? { ...prev, ...updates } : null)
  }, [])

  const value = {
    user,
    isLoading: isLoading || isInitializing,
    error,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user
  }

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100vh] w-full text-muted">
        <div className="w-6 h-6 border-2 border-hairline border-t-ink rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
