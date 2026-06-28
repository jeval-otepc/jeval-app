'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AuthService } from '@/lib/auth';

interface User {
  id: number;
  username: string;
  email: string;
  blocked: boolean;
  confirmed: boolean;
  displayname?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const eventListenersRef = useRef(false);

  const isAuthenticated = !!user;

  useEffect(() => {
    const initAuth = async () => {
      // Initialize token manager first
      AuthService.initializeTokenManager();
      
      const token = AuthService.getToken();
      
      if (token) {
        try {
          const isValid = await AuthService.validateToken(token);
          if (isValid) {
            const userData = await AuthService.getCurrentUser(token);
            
            console.log('User data from token validation:', userData);
            
            // Check if user is blocked during token validation
            if (userData?.blocked) {
              AuthService.logout();
              return;
            }
            
            setUser(userData);
            
            // Check if token needs refresh immediately
            if (AuthService.shouldRefreshToken()) {
              console.log('Token needs refresh, attempting refresh...');
              const refreshResult = await AuthService.refreshToken();
              if (refreshResult?.refreshed) {
                console.log('Token refreshed during initialization');
              }
            }
          } else {
            AuthService.logout();
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          AuthService.logout();
        }
      }
      
      setLoading(false);
    };

    // Setup event listeners for token events
    const setupEventListeners = () => {
      if (eventListenersRef.current || typeof window === 'undefined') return;
      
      const handleTokenRefreshed = (event: CustomEvent) => {
        console.log('Token refreshed, updating user context');
        const { user: updatedUser } = event.detail;
        if (updatedUser) {
          setUser(updatedUser);
        }
      };

      const handleTokenExpired = () => {
        console.log('Token expired, logging out user');
        setUser(null);
        AuthService.logout();
      };

      window.addEventListener('tokenRefreshed', handleTokenRefreshed as EventListener);
      window.addEventListener('tokenExpired', handleTokenExpired);
      
      eventListenersRef.current = true;

      return () => {
        window.removeEventListener('tokenRefreshed', handleTokenRefreshed as EventListener);
        window.removeEventListener('tokenExpired', handleTokenExpired);
      };
    };

    initAuth();
    const cleanup = setupEventListeners();
    
    return cleanup;
  }, []);

  const login = async (identifier: string, password: string) => {
    try {
      const response = await AuthService.login({ identifier, password });
      
      // Check if user is blocked
      if (response.user?.blocked) {
        throw new Error('บัญชีของคุณได้ถูกปิดใช้งานชั่วคราว กรุณาติดต่อผู้ดูแลระบบ');
      }
      
      AuthService.setToken(response.jwt);
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      setUser(null);
      
      // Clear any remaining timers or listeners
      eventListenersRef.current = false;
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}