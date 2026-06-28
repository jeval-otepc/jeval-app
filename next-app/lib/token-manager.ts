interface TokenInfo {
  token: string;
  expiresAt: number;
  user: any;
}

interface RefreshResponse {
  jwt?: string;
  user?: any;
  refreshed?: boolean;
  message?: string;
  refreshNeeded?: boolean;
  timeUntilExpiry?: number;
}

class TokenManager {
  private token: string | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private baseURL: string;
  
  constructor(baseURL?: string) {
    // Import config dynamically to avoid circular dependencies
    import('./config').then(({ config }) => {
      this.baseURL = baseURL || config.getBackendServicesUrl();
    });
    this.baseURL = baseURL || 'https://jeval.otepc.go.th/api';
  }

  setToken(token: string): void {
    this.token = token;
    this.scheduleTokenCheck();
    this.updateCookie(token);
  }

  getToken(): string | null {
    if (!this.token && typeof document !== 'undefined') {
      this.token = this.getTokenFromCookie();
    }
    return this.token;
  }

  private getTokenFromCookie(): string | null {
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    const jwtCookie = cookies.find(cookie => cookie.trim().startsWith('jwt='));
    
    return jwtCookie ? jwtCookie.split('=')[1] : null;
  }

  private updateCookie(token: string): void {
    if (typeof document !== 'undefined') {
      const maxAge = 24 * 60 * 60; // 1 day to match backend JWT expiry
      document.cookie = `jwt=${token}; path=/; max-age=${maxAge}; SameSite=Strict`;
    }
  }

  private scheduleTokenCheck(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    // Check token every 30 minutes (matches backend)
    this.refreshTimer = setInterval(() => {
      this.checkAndRefreshToken();
    }, 30 * 60 * 1000);
  }

  private async checkAndRefreshToken(): Promise<void> {
    if (!this.token) return;

    try {
      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json() as RefreshResponse;
        
        if (data.refreshed && data.jwt) {
          const oldToken = this.token;
          this.token = data.jwt;
          this.updateCookie(data.jwt);
          
          // Dispatch custom event for token refresh (browser only)
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('tokenRefreshed', {
              detail: { 
                oldToken, 
                newToken: this.token,
                user: data.user 
              }
            }));
          }
          
          console.log('Token refreshed successfully');
        } else if (data.refreshNeeded === false) {
          console.log('Token refresh not needed yet');
        }
      } else if (response.status === 401) {
        // Token expired, clear it
        this.clearToken();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('tokenExpired'));
        }
      }
    } catch (error) {
      console.error('Token refresh check failed:', error);
    }
  }

  public async manualRefresh(): Promise<boolean> {
    if (!this.token) return false;

    try {
      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json() as RefreshResponse;
        
        if (data.refreshed && data.jwt) {
          this.token = data.jwt;
          this.updateCookie(data.jwt);
          return true;
        }
      } else if (response.status === 401) {
        this.clearToken();
        return false;
      }
    } catch (error) {
      console.error('Manual token refresh failed:', error);
    }
    
    return false;
  }

  public getTokenExpiry(): number | null {
    if (!this.token) return null;

    try {
      const base64Url = this.token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const decoded = JSON.parse(jsonPayload);
      return decoded.exp ? decoded.exp * 1000 : null; // Convert to milliseconds
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  public isTokenExpired(): boolean {
    const expiry = this.getTokenExpiry();
    if (!expiry) return true;
    
    return Date.now() > expiry;
  }

  public getTimeUntilExpiry(): number | null {
    const expiry = this.getTokenExpiry();
    if (!expiry) return null;
    
    return Math.max(0, expiry - Date.now());
  }

  public shouldRefreshToken(): boolean {
    const timeUntilExpiry = this.getTimeUntilExpiry();
    if (!timeUntilExpiry) return false;
    
    // Refresh if less than 2 hours remaining (matches backend)
    const twoHoursInMs = 2 * 60 * 60 * 1000;
    return timeUntilExpiry < twoHoursInMs;
  }

  public clearToken(): void {
    this.token = null;
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    // Clear cookie
    if (typeof document !== 'undefined') {
      document.cookie = 'jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
    }
  }

  public initialize(): void {
    // Initialize with existing token from cookie
    const existingToken = this.getTokenFromCookie();
    if (existingToken) {
      this.token = existingToken;
      this.scheduleTokenCheck();
      
      // Check immediately if token needs refresh
      if (this.shouldRefreshToken()) {
        this.checkAndRefreshToken();
      }
    }
  }
}

// Export singleton instance
export const tokenManager = new TokenManager();
export default TokenManager;