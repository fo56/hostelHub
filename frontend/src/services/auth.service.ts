const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const API_URL = `${API_BASE_URL}/auth`;

// Type for PasswordCredential from Credential Management API
declare global {
  interface PasswordCredential {
    id: string;
    password: string;
    name?: string;
    iconURL?: string;
  }
}

// Helper to save credentials if browser supports it
let isCredentialRequestPending = false;

const saveCredentials = async (email: string, password: string) => {
  if (navigator.credentials && !isCredentialRequestPending) {
    try {
      isCredentialRequestPending = true;
      const PasswordCredentialType = (window as unknown as { PasswordCredential: new (args: unknown) => PasswordCredential }).PasswordCredential;
      if (PasswordCredentialType) {
        const credential = new PasswordCredentialType({
          id: email,
          password: password,
          name: email,
          iconURL: window.location.origin + '/logo.png'
        });
        await navigator.credentials.store(credential as any);
      }
    } catch (err) {
      // Silently fail if credential storage is not available
      console.debug('Could not save credentials:', err);
    } finally {
      isCredentialRequestPending = false;
    }
  }
};

// Helper to get saved credentials
const getCredentials = async (): Promise<{ email: string; password: string } | null> => {
  if (navigator.credentials && !isCredentialRequestPending) {
    try {
      isCredentialRequestPending = true;
      const PasswordCredentialType = (window as unknown as { PasswordCredential: new (args: unknown) => PasswordCredential }).PasswordCredential;
      if (PasswordCredentialType) {
        const credential = await navigator.credentials.get({
          password: true,
          mediation: 'optional'
        } as unknown as CredentialRequestOptions) as unknown as PasswordCredential;

        if (credential && credential.id && credential.password) {
          return {
            email: credential.id,
            password: credential.password
          };
        }
      }
    } catch (err) {
      console.debug('Could not retrieve credentials:', err);
    } finally {
      isCredentialRequestPending = false;
    }
  }
  return null;
};

export interface AdminRegisterRequest {
  hostelName: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  mealPlan?: any[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UserData {
  id: string;
  name: string;
  username: string;
  email?: string;
  role: 'ADMIN' | 'STUDENT';
  hostelId?: string;
  isPrimaryAdmin?: boolean;
}

export interface LoginResponse {
  message: string;
  user: UserData;
  accessToken: string;
  refreshToken: string;
}



class AuthService {
  // ADMIN REGISTRATION
  async registerAdmin(data: AdminRegisterRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/admin/register`, {
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

  // UNIFIED LOGIN
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      const errorMessage = error.message || error.error || 'Login failed';
      throw new Error(errorMessage);
    }

    const result = await response.json();
    this.setTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });

    // Save credentials for autofill
    await saveCredentials(username, password);

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

  // GET CURRENT USER
  async getMe(): Promise<UserData> {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'GET',
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      const error: any = new Error('Failed to fetch user data');
      error.status = response.status;
      throw error;
    }

    return await response.json();
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

  async getSavedCredentials(): Promise<{ email: string; password: string } | null> {
    return getCredentials();
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
