import { AuthService, type LoginCredentials, type RefreshResponse } from './auth';
import { tokenManager } from './token-manager';
import { config } from './config';

export interface TestResult {
  test: string;
  success: boolean;
  data?: unknown;
  error?: string;
  duration: number;
}

export interface TokenRefreshTestResult extends TestResult {
  refreshData?: RefreshResponse;
}

export interface AuthTestResults {
  loginTest: TestResult;
  tokenValidationTest: TestResult;
  userInfoTest: TestResult;
  logoutTest: TestResult;
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    duration: number;
  };
}

export class AuthTestService {
  private static testCredentials: LoginCredentials = {
    identifier: "adminit",
    password: "admin@@#"
  };

  static async runAllTests(): Promise<AuthTestResults> {
    console.log('🧪 Starting Authentication Tests...');
    const startTime = Date.now();
    
    const results: AuthTestResults = {
      loginTest: await this.testLogin(),
      tokenValidationTest: { test: 'Token Validation', success: false, duration: 0 },
      userInfoTest: { test: 'User Info Fetch', success: false, duration: 0 },
      logoutTest: { test: 'Logout', success: false, duration: 0 },
      summary: {
        totalTests: 4,
        passed: 0,
        failed: 0,
        duration: 0
      }
    };

    // Only run subsequent tests if login was successful
    if (results.loginTest.success && (results.loginTest.data as any)?.jwt) {
      const token = (results.loginTest.data as any).jwt;
      
      results.tokenValidationTest = await this.testTokenValidation(token);
      results.userInfoTest = await this.testUserInfoFetch(token);
      results.logoutTest = await this.testLogout();
    } else {
      // Mark dependent tests as skipped
      results.tokenValidationTest = { 
        test: 'Token Validation', 
        success: false, 
        error: 'Skipped - Login failed', 
        duration: 0 
      };
      results.userInfoTest = { 
        test: 'User Info Fetch', 
        success: false, 
        error: 'Skipped - Login failed', 
        duration: 0 
      };
      results.logoutTest = { 
        test: 'Logout', 
        success: false, 
        error: 'Skipped - Login failed', 
        duration: 0 
      };
    }

    // Calculate summary
    const allTests = [
      results.loginTest,
      results.tokenValidationTest,
      results.userInfoTest,
      results.logoutTest
    ];

    results.summary = {
      totalTests: allTests.length,
      passed: allTests.filter(test => test.success).length,
      failed: allTests.filter(test => !test.success).length,
      duration: Date.now() - startTime
    };

    console.log('✅ Authentication Tests Completed');
    return results;
  }

  private static async testLogin(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log('🔐 Testing Login...');
      const response = await AuthService.login(this.testCredentials);
      
      const duration = Date.now() - startTime;
      
      if (response.jwt && response.user) {
        console.log('✅ Login successful');
        return {
          test: 'Login',
          success: true,
          data: response,
          duration
        };
      } else {
        console.log('❌ Login failed - Invalid response format');
        return {
          test: 'Login',
          success: false,
          error: 'Invalid response format',
          duration
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log('❌ Login failed:', error);
      
      return {
        test: 'Login',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      };
    }
  }

  private static async testTokenValidation(token: string): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Testing Token Validation...');
      const isValid = await AuthService.validateToken(token);
      const duration = Date.now() - startTime;
      
      if (isValid) {
        console.log('✅ Token validation successful');
        return {
          test: 'Token Validation',
          success: true,
          data: { isValid: true },
          duration
        };
      } else {
        console.log('❌ Token validation failed');
        return {
          test: 'Token Validation',
          success: false,
          error: 'Token is invalid',
          duration
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log('❌ Token validation error:', error);
      
      return {
        test: 'Token Validation',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      };
    }
  }

  private static async testUserInfoFetch(token: string): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log('👤 Testing User Info Fetch...');
      const user = await AuthService.getCurrentUser(token);
      const duration = Date.now() - startTime;
      
      if (user && user.id) {
        console.log('✅ User info fetch successful');
        return {
          test: 'User Info Fetch',
          success: true,
          data: user,
          duration
        };
      } else {
        console.log('❌ User info fetch failed - Invalid user data');
        return {
          test: 'User Info Fetch',
          success: false,
          error: 'Invalid user data received',
          duration
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log('❌ User info fetch error:', error);
      
      return {
        test: 'User Info Fetch',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      };
    }
  }

  private static async testLogout(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log('🚪 Testing Logout...');
      await AuthService.logout();
      const duration = Date.now() - startTime;
      
      // Check if token was removed
      const token = AuthService.getToken();
      
      if (!token) {
        console.log('✅ Logout successful');
        return {
          test: 'Logout',
          success: true,
          data: { tokenRemoved: true },
          duration
        };
      } else {
        console.log('❌ Logout failed - Token still exists');
        return {
          test: 'Logout',
          success: false,
          error: 'Token was not removed',
          duration
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log('❌ Logout error:', error);
      
      return {
        test: 'Logout',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      };
    }
  }

  // Individual test methods for specific scenarios
  static async testInvalidCredentials(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log('🚫 Testing Invalid Credentials...');
      await AuthService.login({ 
        identifier: "invaliduser", 
        password: "wrongpassword" 
      });
      
      const duration = Date.now() - startTime;
      
      // If we reach here, the test failed because login should have thrown an error
      return {
        test: 'Invalid Credentials',
        success: false,
        error: 'Login succeeded when it should have failed',
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log('✅ Invalid credentials correctly rejected');
      
      return {
        test: 'Invalid Credentials',
        success: true,
        data: { errorMessage: error instanceof Error ? error.message : 'Unknown error' },
        duration
      };
    }
  }

  static async testEmptyCredentials(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log('⚠️ Testing Empty Credentials...');
      await AuthService.login({ 
        identifier: "", 
        password: "" 
      });
      
      const duration = Date.now() - startTime;
      
      return {
        test: 'Empty Credentials',
        success: false,
        error: 'Login succeeded with empty credentials',
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log('✅ Empty credentials correctly rejected');
      
      return {
        test: 'Empty Credentials',
        success: true,
        data: { errorMessage: error instanceof Error ? error.message : 'Unknown error' },
        duration
      };
    }
  }

  // Utility method to test backend connection
  static async testBackendConnection(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log('🌐 Testing Backend Connection...');
      const response = await fetch(`${config.getBackendServicesUrl()}/api/auth/local`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({ identifier: '', password: '' }),
      });

      const duration = Date.now() - startTime;
      
      if (response.status !== 0) {
        console.log('✅ Backend is reachable');
        return {
          test: 'Backend Connection',
          success: true,
          data: { 
            status: response.status,
            reachable: true
          },
          duration
        };
      } else {
        return {
          test: 'Backend Connection',
          success: false,
          error: 'Backend not reachable',
          duration
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log('❌ Backend connection failed:', error);
      
      return {
        test: 'Backend Connection',
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
        duration
      };
    }
  }

  // NEW: Token Refresh Tests
  static async testTokenRefresh(): Promise<TokenRefreshTestResult> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Testing Token Refresh...');
      
      // First ensure we have a token
      const currentToken = AuthService.getToken();
      if (!currentToken) {
        console.log('❌ No token available for refresh test');
        return {
          test: 'Token Refresh',
          success: false,
          error: 'No token available',
          duration: Date.now() - startTime
        };
      }

      const refreshResult = await AuthService.refreshToken();
      const duration = Date.now() - startTime;

      if (refreshResult) {
        console.log('✅ Token refresh test completed');
        return {
          test: 'Token Refresh',
          success: true,
          data: refreshResult,
          refreshData: refreshResult,
          duration
        };
      } else {
        return {
          test: 'Token Refresh',
          success: false,
          error: 'Refresh returned null',
          duration
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log('❌ Token refresh test failed:', error);
      
      return {
        test: 'Token Refresh',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      };
    }
  }

  static async testTokenExpiry(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log('⏰ Testing Token Expiry Check...');
      
      const token = AuthService.getToken();
      if (!token) {
        return {
          test: 'Token Expiry',
          success: false,
          error: 'No token available',
          duration: Date.now() - startTime
        };
      }

      const expiry = AuthService.getTokenExpiry();
      const timeUntilExpiry = AuthService.getTimeUntilExpiry();
      const shouldRefresh = AuthService.shouldRefreshToken();
      const duration = Date.now() - startTime;

      console.log('✅ Token expiry check completed');
      return {
        test: 'Token Expiry',
        success: true,
        data: {
          expiry: expiry ? new Date(expiry).toISOString() : null,
          timeUntilExpiry,
          shouldRefresh,
          timeUntilExpiryMinutes: timeUntilExpiry ? Math.floor(timeUntilExpiry / 60000) : null
        },
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log('❌ Token expiry test failed:', error);
      
      return {
        test: 'Token Expiry',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      };
    }
  }

  // Full refresh system test
  static async testRefreshSystem(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log('🧪 Testing Complete Refresh System...');
      
      // Step 1: Login to get fresh token
      console.log('1. Login for fresh token...');
      const loginResult = await AuthService.login(this.testCredentials);
      
      // Step 2: Check token status
      console.log('2. Checking token status...');
      const expiry = AuthService.getTokenExpiry();
      const timeUntilExpiry = AuthService.getTimeUntilExpiry();
      const shouldRefresh = AuthService.shouldRefreshToken();
      
      // Step 3: Test refresh
      console.log('3. Testing refresh mechanism...');
      const refreshResult = await AuthService.refreshToken();
      
      // Step 4: Initialize token manager
      console.log('4. Testing token manager initialization...');
      AuthService.initializeTokenManager();
      
      const duration = Date.now() - startTime;
      
      console.log('✅ Complete refresh system test completed');
      return {
        test: 'Complete Refresh System',
        success: true,
        data: {
          login: !!loginResult.jwt,
          tokenStatus: {
            expiry: expiry ? new Date(expiry).toISOString() : null,
            timeUntilExpiry,
            shouldRefresh
          },
          refresh: refreshResult,
          tokenManagerInitialized: true
        },
        duration
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log('❌ Complete refresh system test failed:', error);
      
      return {
        test: 'Complete Refresh System',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      };
    }
  }
}

// Token Test Utils for browser console testing
export const TokenTestUtils = {
  
  // Test 1: Check current token status
  checkTokenStatus() {
    const token = AuthService.getToken();
    
    if (!token) {
      console.log('❌ No token found');
      return;
    }
    
    try {
      const expiry = AuthService.getTokenExpiry();
      const timeUntilExpiry = AuthService.getTimeUntilExpiry();
      const shouldRefresh = AuthService.shouldRefreshToken();
      
      console.log('🔍 Token Status:');
      console.log('- Expires at:', expiry ? new Date(expiry).toLocaleString() : 'Unknown');
      console.log('- Time left:', timeUntilExpiry ? Math.floor(timeUntilExpiry / 1000 / 60) : 'Unknown', 'minutes');
      console.log('- Needs refresh:', shouldRefresh);
      console.log('- Is expired:', tokenManager.isTokenExpired());
      
    } catch (error) {
      console.log('❌ Token decode error:', error);
    }
  },

  // Test 2: Manual token refresh
  async testTokenRefresh() {
    try {
      console.log('🔄 Testing manual token refresh...');
      const refreshResult = await AuthService.refreshToken();
      console.log('📝 Refresh result:', refreshResult);
    } catch (error) {
      console.error('❌ Refresh test failed:', error);
    }
  },

  // Test 3: Listen to token events
  setupEventListeners() {
    console.log('👂 Setting up token event listeners...');
    
    window.addEventListener('tokenRefreshed', (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('🔄 Token Refreshed Event:', customEvent.detail);
    });
    
    window.addEventListener('tokenExpired', () => {
      console.log('⚠️ Token Expired Event');
    });
    
    console.log('✅ Event listeners set up');
  },

  // Test 4: Clear token (for testing logout)
  async clearToken() {
    await AuthService.logout();
    console.log('🗑️ Token cleared via logout');
  },

  // Test 5: Run all refresh tests
  async runRefreshTests() {
    console.log('🧪 Running All Refresh Tests...');
    
    const tokenRefreshTest = await AuthTestService.testTokenRefresh();
    const tokenExpiryTest = await AuthTestService.testTokenExpiry();
    const refreshSystemTest = await AuthTestService.testRefreshSystem();
    
    console.log('Results:');
    console.log('- Token Refresh:', tokenRefreshTest.success ? '✅' : '❌', tokenRefreshTest);
    console.log('- Token Expiry:', tokenExpiryTest.success ? '✅' : '❌', tokenExpiryTest);
    console.log('- Refresh System:', refreshSystemTest.success ? '✅' : '❌', refreshSystemTest);
  }
};

// Auto-run basic checks when imported
if (typeof window !== 'undefined') {
  console.log('🧪 Enhanced Token Test Utils Loaded');
  console.log('Available methods:');
  console.log('- TokenTestUtils.checkTokenStatus()');
  console.log('- TokenTestUtils.testTokenRefresh()');
  console.log('- TokenTestUtils.setupEventListeners()');
  console.log('- TokenTestUtils.clearToken()');
  console.log('- TokenTestUtils.runRefreshTests()');
  console.log('- AuthTestService.testTokenRefresh()');
  console.log('- AuthTestService.testRefreshSystem()');
}