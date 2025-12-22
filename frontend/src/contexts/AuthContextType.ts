import { createContext } from 'react'
import type { UserData } from '../services/authService'

export type UserRole = 'admin' | 'student' | 'worker'

export interface AuthContextType {
  user: UserData | null
  isLoading: boolean
  error: string | null
  login: (credentials: { email: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

export const AuthContext = createContext<AuthContextType | null>(null)
