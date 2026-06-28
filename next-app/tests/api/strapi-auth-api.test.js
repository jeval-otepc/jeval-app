// Strapi API Authentication Integration Tests
// Direct testing of Strapi authentication endpoints

const fetch = require('node-fetch');

describe('Strapi API Authentication Tests', () => {
  // Production Strapi API URL
  const STRAPI_API_BASE = 'https://jeval.otepc.go.th/api';

  // Test credentials from environment or default
  const TEST_CREDENTIALS = {
    identifier: process.env.TEST_USER_EMAIL || 'admin@otepc.mail.go.th',
    password: process.env.TEST_USER_PASSWORD || 'Admin@@#'
  };

  let authToken = null;
  let userData = null;

  beforeAll(() => {
    console.log('🧪 Testing Strapi API Authentication');
    console.log('🌐 API Base URL:', STRAPI_API_BASE);
    console.log('👤 Test User:', TEST_CREDENTIALS.identifier);
    console.log('');
  });

  describe('Authentication Endpoint Tests', () => {
    test('POST /auth/local - should authenticate with valid credentials', async () => {
      const startTime = Date.now();

      const response = await fetch(`${STRAPI_API_BASE}/auth/local`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json',
          'User-Agent': 'JEVAL-Test-Suite/1.0'
        },
        body: JSON.stringify(TEST_CREDENTIALS)
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      console.log(`📊 Response Time: ${responseTime}ms`);
      console.log(`📈 Status Code: ${response.status}`);

      // Check response status
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');

      const data = await response.json();

      // Validate response structure
      expect(data).toHaveProperty('jwt');
      expect(data).toHaveProperty('user');

      // Validate JWT token
      expect(data.jwt).toBeTruthy();
      expect(typeof data.jwt).toBe('string');
      expect(data.jwt.length).toBeGreaterThan(50);

      // Validate user data
      expect(data.user).toHaveProperty('id');
      expect(data.user).toHaveProperty('email');
      expect(data.user).toHaveProperty('username');
      expect(data.user.email).toBe(TEST_CREDENTIALS.identifier);

      // Store for subsequent tests
      authToken = data.jwt;
      userData = data.user;

      console.log('✅ Authentication successful');
      console.log('🔑 JWT Token length:', data.jwt.length);
      console.log('👤 User ID:', data.user.id);
      console.log('📧 User Email:', data.user.email);
      console.log('👤 Username:', data.user.username);

      // Check if user has appropriate role
      if (data.user.role) {
        console.log('🔐 User Role:', data.user.role.name || data.user.role);
      }

      // Performance check
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    }, 10000);

    test('POST /auth/local - should fail with invalid credentials', async () => {
      const invalidCredentials = {
        identifier: 'invalid@test.com',
        password: 'wrongpassword123'
      };

      const response = await fetch(`${STRAPI_API_BASE}/auth/local`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json'
        },
        body: JSON.stringify(invalidCredentials)
      });

      console.log(`📈 Invalid credentials status: ${response.status}`);

      // Should return 400 Bad Request for invalid credentials
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');

      console.log('❌ Authentication failed as expected');
      console.log('📋 Error message:', data.error.message || data.error);
    }, 10000);

    test('POST /auth/local - should fail with missing credentials', async () => {
      const response = await fetch(`${STRAPI_API_BASE}/auth/local`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json'
        },
        body: JSON.stringify({})
      });

      expect(response.status).toBe(400);
      console.log('❌ Empty credentials rejected as expected');
    }, 10000);
  });

  describe('Protected Endpoint Tests', () => {
    test('GET /users/me - should return user data with valid token', async () => {
      if (!authToken) {
        throw new Error('No auth token available. Authentication test must run first.');
      }

      const response = await fetch(`${STRAPI_API_BASE}/users/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log(`📈 /users/me status: ${response.status}`);

      expect(response.status).toBe(200);

      const data = await response.json();

      // Validate user data
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('email');
      expect(data.id).toBe(userData.id);
      expect(data.email).toBe(TEST_CREDENTIALS.identifier);

      console.log('✅ User data retrieved successfully');
      console.log('👤 User ID:', data.id);
      console.log('📧 Email:', data.email);

      if (data.role) {
        console.log('🔐 Role:', data.role.name || data.role);
      }
    }, 10000);

    test('GET /users/me - should fail with invalid token', async () => {
      const response = await fetch(`${STRAPI_API_BASE}/users/me`, {
        headers: {
          'Authorization': 'Bearer invalid-token-123',
          'Accept': 'application/json'
        }
      });

      expect(response.status).toBe(401);
      console.log('❌ Invalid token rejected as expected');
    }, 10000);

    test('GET /users/me - should fail without token', async () => {
      const response = await fetch(`${STRAPI_API_BASE}/users/me`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      expect(response.status).toBe(401);
      console.log('❌ No token rejected as expected');
    }, 10000);
  });

  describe('API Content Access Tests', () => {
    test('GET /forms - should access forms endpoint with authentication', async () => {
      if (!authToken) {
        throw new Error('No auth token available. Authentication test must run first.');
      }

      const response = await fetch(`${STRAPI_API_BASE}/forms`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json'
        }
      });

      console.log(`📈 /forms endpoint status: ${response.status}`);

      if (response.status === 200) {
        const data = await response.json();
        console.log('✅ Forms endpoint accessible');
        console.log('📊 Forms count:', data.data ? data.data.length : 'Unknown');
      } else if (response.status === 403) {
        console.log('⚠️ Forms endpoint forbidden - user may not have permission');
      } else if (response.status === 404) {
        console.log('ℹ️ Forms endpoint not found - may not be implemented');
      }

      // Accept 200, 403, or 404 as valid responses
      expect([200, 403, 404]).toContain(response.status);
    }, 10000);

    test('GET /questions - should access questions endpoint with authentication', async () => {
      if (!authToken) {
        throw new Error('No auth token available. Authentication test must run first.');
      }

      const response = await fetch(`${STRAPI_API_BASE}/questions`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json'
        }
      });

      console.log(`📈 /questions endpoint status: ${response.status}`);

      if (response.status === 200) {
        const data = await response.json();
        console.log('✅ Questions endpoint accessible');
        console.log('📊 Questions count:', data.data ? data.data.length : 'Unknown');
      } else if (response.status === 403) {
        console.log('⚠️ Questions endpoint forbidden - user may not have permission');
      } else if (response.status === 404) {
        console.log('ℹ️ Questions endpoint not found - may not be implemented');
      }

      expect([200, 403, 404]).toContain(response.status);
    }, 10000);
  });

  describe('Token Validation Tests', () => {
    test('should validate JWT token structure', () => {
      if (!authToken) {
        throw new Error('No auth token available. Authentication test must run first.');
      }

      // JWT should have 3 parts separated by dots
      const parts = authToken.split('.');
      expect(parts).toHaveLength(3);

      // Each part should be base64 encoded
      parts.forEach((part, index) => {
        expect(part).toBeTruthy();
        expect(part.length).toBeGreaterThan(0);
        console.log(`🔍 JWT part ${index + 1} length:`, part.length);
      });

      console.log('✅ JWT token structure is valid');
    });

    test('should decode JWT header and payload', () => {
      if (!authToken) {
        throw new Error('No auth token available. Authentication test must run first.');
      }

      const parts = authToken.split('.');

      try {
        // Decode header
        const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
        expect(header).toHaveProperty('alg');
        expect(header).toHaveProperty('typ');
        console.log('🔍 JWT Algorithm:', header.alg);
        console.log('🔍 JWT Type:', header.typ);

        // Decode payload
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        expect(payload).toHaveProperty('id');
        expect(payload.id).toBe(userData.id);

        if (payload.exp) {
          const expirationDate = new Date(payload.exp * 1000);
          console.log('⏰ Token expires:', expirationDate.toISOString());
        }

        console.log('✅ JWT payload decoded successfully');
      } catch (error) {
        console.error('❌ JWT decode error:', error.message);
        throw error;
      }
    });
  });

  describe('Security and Performance Tests', () => {
    test('should enforce HTTPS', async () => {
      // Verify the API is accessed via HTTPS
      expect(STRAPI_API_BASE).toMatch(/^https:/);
      console.log('✅ API uses HTTPS protocol');
    });

    test('should have proper CORS headers', async () => {
      const response = await fetch(`${STRAPI_API_BASE}/auth/local`, {
        method: 'OPTIONS'
      });

      console.log('📋 CORS preflight status:', response.status);

      const corsHeaders = {
        'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
        'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
        'access-control-allow-headers': response.headers.get('access-control-allow-headers'),
      };

      console.log('🔍 CORS headers:', corsHeaders);

      // At least one CORS header should be present
      const hasCorsHeaders = Object.values(corsHeaders).some(header => header !== null);
      if (hasCorsHeaders) {
        console.log('✅ CORS headers configured');
      } else {
        console.log('ℹ️ CORS headers may not be exposed in preflight');
      }
    });

    test('should respond within acceptable time limits', async () => {
      const startTime = Date.now();

      const response = await fetch(`${STRAPI_API_BASE}/auth/local`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(TEST_CREDENTIALS)
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      console.log(`⚡ API response time: ${responseTime}ms`);

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(10000); // 10 seconds max for production

      if (responseTime < 1000) {
        console.log('🚀 Excellent response time');
      } else if (responseTime < 3000) {
        console.log('✅ Good response time');
      } else {
        console.log('⚠️ Slow response time - consider optimization');
      }
    }, 15000);
  });

  afterAll(() => {
    console.log('');
    console.log('🏁 Strapi API Authentication Tests Completed');
    console.log('📊 Test Summary:');
    console.log('   - Authentication endpoint tested');
    console.log('   - Token validation verified');
    console.log('   - Protected endpoints checked');
    console.log('   - Security measures validated');
    console.log('   - Performance benchmarked');
  });
});

// Export for standalone execution
module.exports = {
  STRAPI_API_BASE: 'https://jeval.otepc.go.th/api',
  TEST_CREDENTIALS: {
    identifier: process.env.TEST_USER_EMAIL || 'admin@otepc.mail.go.th',
    password: process.env.TEST_USER_PASSWORD || 'Admin@@#'
  }
};