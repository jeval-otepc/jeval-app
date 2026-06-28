import { env } from 'process';
import { tokenManager } from './token-manager';
import { config } from './config';

export interface LoginCredentials {
  identifier: string;
  password: string;
}

export interface AuthResponse {
  jwt: string;
  user: {
    id: number;
    username: string;
    email: string;
    blocked: boolean;
    confirmed: boolean;
    displayname?: string;
  };
}

export interface RefreshResponse {
  jwt?: string;
  user?: any;
  refreshed?: boolean;
  message?: string;
  refreshNeeded?: boolean;
  timeUntilExpiry?: number;
}

export interface AuthError {
  error: {
    status: number;
    name: string;
    message: string;
  };
}

const STRAPI_BASE_URL = config.getBackendServicesUrl()

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${STRAPI_BASE_URL}/api/auth/local`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Login failed');
    }

    return data;
  }

  static async logout(): Promise<void> {
    tokenManager.clearToken();
  }

  static getToken(): string | null {
    return tokenManager.getToken();
  }

  static setToken(token: string): void {
    tokenManager.setToken(token);
  }

  static async refreshToken(): Promise<RefreshResponse | null> {
    const currentToken = tokenManager.getToken();
    if (!currentToken) return null;

    try {
      const response = await fetch(`${STRAPI_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
        },
      });

      const data: RefreshResponse = await response.json();

      if (response.ok && data.refreshed && data.jwt) {
        tokenManager.setToken(data.jwt);
        return data;
      } else if (response.status === 401) {
        // Token expired, logout user
        await this.logout();
        return null;
      }

      return data;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  static isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // Check if token is expired
    if (tokenManager.isTokenExpired()) {
      this.logout();
      return false;
    }

    return true;
  }

  static async validateToken(token?: string): Promise<boolean> {
    const tokenToValidate = token || this.getToken();
    if (!tokenToValidate) return false;

    // First check if token is expired locally
    if (tokenManager.isTokenExpired()) {
      return false;
    }

    try {
      const response = await fetch(`${STRAPI_BASE_URL}/api/users/me`, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${tokenToValidate}`,
        },
      });

      if (response.status === 401) {
        // Token is invalid or expired
        await this.logout();
        return false;
      }

      return response.ok;
    } catch {
      return false;
    }
  }

  static shouldRefreshToken(): boolean {
    return tokenManager.shouldRefreshToken();
  }

  static getTokenExpiry(): number | null {
    return tokenManager.getTokenExpiry();
  }

  static getTimeUntilExpiry(): number | null {
    return tokenManager.getTimeUntilExpiry();
  }

  static initializeTokenManager(): void {
    tokenManager.initialize();
  }

  static async getCurrentUser(token: string) {
    try {
      const response = await fetch(`${STRAPI_BASE_URL}/api/users/me`, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }
}