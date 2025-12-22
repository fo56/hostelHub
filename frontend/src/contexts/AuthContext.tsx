import React, { useState, useCallback } from 'react'
import { authService } from '../services/authService'
import type { UserData } from '../services/authService'
import { AuthContext } from './AuthContextType'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await authService.loginAdmin(credentials.email, credentials.password)
      setUser(response.user)
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

  const value = {
    user,
    isLoading,
    error,
    login,
    logout,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
