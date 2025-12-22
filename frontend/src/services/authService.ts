const API_URL = 'http://localhost:8000/api/auth';

export interface AdminRegisterRequest {
  hostelName: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STUDENT' | 'WORKER';
}

export interface LoginResponse {
  message: string;
  user: UserData;
  accessToken: string;
  refreshToken: string;
}

export interface QRLoginRequest {
  qrToken: string;
}

export interface URLLoginRequest {
  loginURL: string;
}

export interface SetPasswordRequest {
  loginURL: string;
  password: string;
}

class AuthService {
  // ADMIN REGISTRATION
  async registerAdmin(data: AdminRegisterRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/register-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Registration failed');
    }

    const result = await response.json();
    this.setTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    return result;
  }

  // ADMIN LOGIN
  async loginAdmin(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/login-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Login failed');
    }

    const result = await response.json();
    this.setTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    return result;
  }

  // STUDENT/WORKER LOGIN (email & password)
  async loginUser(email: string, password: string, role: 'STUDENT' | 'WORKER'): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/login-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Login failed');
    }

    const result = await response.json();
    this.setTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    return result;
  }

  // QR CODE LOGIN
  async loginViaQR(qrToken: string): Promise<LoginResponse | { setPasswordURL: string; userId: string }> {
    const response = await fetch(`${API_URL}/login-qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Login failed');
    }

    const result = await response.json();
    
    if (result.setPasswordURL) {
      return result;
    }

    this.setTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    return result;
  }

  // TOKENIZED LOGIN URL
  async loginViaURL(loginURL: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/login-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginURL }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Login failed');
    }

    const result = await response.json();
    this.setTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    return result;
  }

  // SET PASSWORD (First login)
  async setPassword(loginURL: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/set-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginURL, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to set password');
    }

    const result = await response.json();
    this.setTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    return result;
  }

  // REFRESH TOKEN
  async refreshToken(): Promise<TokenResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token found');
    }

    const response = await fetch(`${API_URL}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      this.logout();
      const error = await response.json();
      throw new Error(error.message || error.error || 'Token refresh failed');
    }

    const result = await response.json();
    this.setTokens(result.tokens);
    return result.tokens;
  }

  // LOGOUT
  async logout(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    
    try {
      if (refreshToken) {
        await fetch(`${API_URL}/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAccessToken()}`
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } finally {
      this.clearTokens();
    }
  }

  // TOKEN MANAGEMENT
  setTokens(tokens: TokenResponse): void {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  getAuthHeader(): Record<string, string> {
    const token = this.getAccessToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
}

export const authService = new AuthService();
