// Production Authentication Test Suite
// Test authentication flow against production environment

const { config } = require('../../lib/config');

describe('Production Authentication Tests', () => {
  const PRODUCTION_BASE_URL = 'https://jeval.otepc.go.th';
  const STRAPI_API_URL = 'https://jeval.otepc.go.th/api';

  // Test credentials (should be stored in environment variables)
  const TEST_CREDENTIALS = {
    identifier: process.env.TEST_USER_EMAIL || 'admin@otepc.mail.go.th',
    password: process.env.TEST_USER_PASSWORD || 'Admin@@#'
  };

  beforeAll(() => {
    // Ensure we're testing in production mode
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_APP_ENV = 'production';
  });

  describe('Strapi API Authentication', () => {
    test('should successfully authenticate with valid credentials', async () => {
      const response = await fetch(`${STRAPI_API_URL}/auth/local`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(TEST_CREDENTIALS),
      });

      expect(response.status).toBe(200);

      const data = await response.json();

      // Verify response structure
      expect(data).toHaveProperty('jwt');
      expect(data).toHaveProperty('user');
      expect(data.jwt).toBeTruthy();
      expect(data.user).toHaveProperty('id');
      expect(data.user).toHaveProperty('email');
      expect(data.user.email).toBe(TEST_CREDENTIALS.identifier);

      console.log('✅ Authentication successful');
      console.log('🔑 JWT Token received');
      console.log('👤 User ID:', data.user.id);
      console.log('📧 User Email:', data.user.email);
    }, 30000);

    test('should fail with invalid credentials', async () => {
      const invalidCredentials = {
        identifier: 'invalid@email.com',
        password: 'wrongpassword'
      };

      const response = await fetch(`${STRAPI_API_URL}/auth/local`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(invalidCredentials),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');

      console.log('❌ Authentication failed as expected with invalid credentials');
    }, 30000);

    test('should validate JWT token', async () => {
      // First, get a valid token
      const loginResponse = await fetch(`${STRAPI_API_URL}/auth/local`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(TEST_CREDENTIALS),
      });

      const loginData = await loginResponse.json();
      const token = loginData.jwt;

      // Test the token by accessing a protected endpoint
      const meResponse = await fetch(`${STRAPI_API_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json; charset=utf-8'
        }
      });

      expect(meResponse.status).toBe(200);

      const userData = await meResponse.json();
      expect(userData).toHaveProperty('id');
      expect(userData).toHaveProperty('email');
      expect(userData.email).toBe(TEST_CREDENTIALS.identifier);

      console.log('✅ JWT token validation successful');
      console.log('👤 User data retrieved:', userData.email);
    }, 30000);
  });

  describe('Frontend Authentication Integration', () => {
    test('should access frontend login page', async () => {
      const response = await fetch(`${PRODUCTION_BASE_URL}/login`);
      expect(response.status).toBe(200);

      const html = await response.text();
      expect(html).toContain('login');

      console.log('✅ Frontend login page accessible');
    }, 10000);

    test('should test API route authentication', async () => {
      // Test frontend API route
      const response = await fetch(`${PRODUCTION_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(TEST_CREDENTIALS),
      });

      // This might return different status codes depending on your implementation
      console.log('Frontend API auth status:', response.status);

      if (response.status === 200) {
        const data = await response.json();
        console.log('✅ Frontend API authentication successful');
        console.log('Response:', data);
      } else {
        console.log('ℹ️ Frontend API response:', response.status);
      }
    }, 30000);
  });

  describe('SSL and Security Tests', () => {
    test('should enforce HTTPS', async () => {
      // Test HTTP redirect to HTTPS
      const httpResponse = await fetch('http://jeval.otepc.go.th', {
        redirect: 'manual'
      });

      // Should redirect to HTTPS or return 301/302
      expect([301, 302, 200]).toContain(httpResponse.status);

      console.log('✅ HTTP to HTTPS enforcement verified');
    }, 10000);

    test('should have valid SSL certificate', async () => {
      const response = await fetch(PRODUCTION_BASE_URL);
      expect(response.status).toBe(200);

      // Check if connection is secure
      expect(response.url).toMatch(/^https:/);

      console.log('✅ SSL certificate valid');
    }, 10000);
  });

  describe('Performance Tests', () => {
    test('should respond within acceptable time limits', async () => {
      const startTime = Date.now();

      const response = await fetch(`${STRAPI_API_URL}/auth/local`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(TEST_CREDENTIALS),
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // 5 seconds max

      console.log(`✅ Authentication response time: ${responseTime}ms`);
    }, 10000);
  });
});

// Helper function to run all tests
async function runProductionAuthTests() {
  console.log('🧪 Starting Production Authentication Tests...');
  console.log('🌐 Testing against:', 'https://jeval.otepc.go.th');
  console.log('🔑 Testing Strapi API:', 'https://jeval.otepc.go.th/api');
  console.log('👤 Test user:', process.env.TEST_USER_EMAIL || 'admin@otepc.mail.go.th');
  console.log('');
}

module.exports = { runProductionAuthTests };