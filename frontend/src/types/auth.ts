export type UserRole = 'admin' | 'student' | 'worker'

export interface UserData {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface LoginRequest {
  email: string
  password: string
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
}

export interface LoginResponse {
  message: string
  user: UserData
  tokens: TokenResponse
}
