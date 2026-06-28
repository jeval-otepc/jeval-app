#!/usr/bin/env node

// Authentication Test Runner
// Easy way to run all authentication tests

const { spawn } = require('child_process');
const path = require('path');

// Test configuration
const config = {
  STRAPI_API_BASE: 'https://jeval.otepc.go.th/api',
  FRONTEND_BASE: 'https://jeval.otepc.go.th',
  TEST_USER: process.env.TEST_USER_EMAIL || 'test@example.com',
  TEST_PASSWORD: process.env.TEST_USER_PASSWORD || 'password123'
};

console.log('🧪 JEVAL Authentication Test Suite');
console.log('=====================================');
console.log('🌐 Frontend URL:', config.FRONTEND_BASE);
console.log('🔗 Strapi API:', config.STRAPI_API_BASE);
console.log('👤 Test User:', config.TEST_USER);
console.log('');

// Quick API test function
async function quickApiTest() {
  console.log('🚀 Running Quick API Authentication Test...');
  console.log('');

  try {
    const fetch = require('node-fetch');
    const startTime = Date.now();

    // Test Strapi authentication endpoint
    const response = await fetch(`${config.STRAPI_API_BASE}/auth/local`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json',
        'User-Agent': 'JEVAL-Quick-Test/1.0'
      },
      body: JSON.stringify({
        identifier: config.TEST_USER,
        password: config.TEST_PASSWORD
      })
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`📊 Response Time: ${responseTime}ms`);
    console.log(`📈 Status Code: ${response.status}`);
    console.log(`📋 Content Type: ${response.headers.get('content-type')}`);

    if (response.status === 200) {
      const data = await response.json();

      console.log('✅ Authentication Successful!');
      console.log('🔑 JWT Token Length:', data.jwt ? data.jwt.length : 'Not provided');
      console.log('👤 User ID:', data.user ? data.user.id : 'Not provided');
      console.log('📧 User Email:', data.user ? data.user.email : 'Not provided');

      if (data.user && data.user.role) {
        console.log('🔐 User Role:', data.user.role.name || data.user.role);
      }

      // Test protected endpoint
      console.log('');
      console.log('🔒 Testing Protected Endpoint...');

      const meResponse = await fetch(`${config.STRAPI_API_BASE}/users/me`, {
        headers: {
          'Authorization': `Bearer ${data.jwt}`,
          'Accept': 'application/json'
        }
      });

      console.log(`📈 /users/me Status: ${meResponse.status}`);

      if (meResponse.status === 200) {
        console.log('✅ Protected endpoint accessible with token');
      } else {
        console.log('❌ Protected endpoint failed');
      }

    } else {
      console.log('❌ Authentication Failed!');
      const errorData = await response.json().catch(() => null);

      if (errorData && errorData.error) {
        console.log('📋 Error:', errorData.error.message || errorData.error);
      }
    }

  } catch (error) {
    console.log('❌ Test Error:', error.message);

    if (error.code === 'ENOTFOUND') {
      console.log('🌐 Network Error: Cannot connect to the API server');
      console.log('   - Check if the domain is accessible');
      console.log('   - Verify SSL certificate is valid');
      console.log('   - Ensure network connectivity');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('🔒 Connection Refused: Server may be down');
    }
  }

  console.log('');
  console.log('================================');
  console.log('');
}

// Run Jest tests
function runJestTests() {
  console.log('🧪 Running Jest Test Suite...');
  console.log('');

  const jestProcess = spawn('npx', ['jest', 'tests/api/strapi-auth-api.test.js', '--verbose'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      TEST_USER_EMAIL: config.TEST_USER,
      TEST_USER_PASSWORD: config.TEST_PASSWORD
    }
  });

  jestProcess.on('close', (code) => {
    console.log('');
    if (code === 0) {
      console.log('✅ Jest tests completed successfully');
    } else {
      console.log('❌ Jest tests failed');
    }
    console.log('');
  });
}

// Run Playwright tests
function runPlaywrightTests() {
  console.log('🎭 Running Playwright E2E Tests...');
  console.log('');

  const playwrightProcess = spawn('npx', ['playwright', 'test', 'tests/e2e/auth-flow.spec.js'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      TEST_USER_EMAIL: config.TEST_USER,
      TEST_USER_PASSWORD: config.TEST_PASSWORD
    }
  });

  playwrightProcess.on('close', (code) => {
    console.log('');
    if (code === 0) {
      console.log('✅ Playwright tests completed successfully');
    } else {
      console.log('❌ Playwright tests failed');
    }
    console.log('');
  });
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--quick') || args.includes('-q')) {
    await quickApiTest();
  } else if (args.includes('--jest') || args.includes('-j')) {
    runJestTests();
  } else if (args.includes('--playwright') || args.includes('-p')) {
    runPlaywrightTests();
  } else if (args.includes('--all') || args.includes('-a')) {
    await quickApiTest();
    runJestTests();
    // Note: Playwright tests require browser setup
  } else {
    console.log('Usage:');
    console.log('  node scripts/run-auth-tests.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  -q, --quick      Run quick API test');
    console.log('  -j, --jest       Run Jest test suite');
    console.log('  -p, --playwright Run Playwright E2E tests');
    console.log('  -a, --all        Run all tests');
    console.log('');
    console.log('Environment Variables:');
    console.log('  TEST_USER_EMAIL     Test user email (default: test@example.com)');
    console.log('  TEST_USER_PASSWORD  Test user password (default: password123)');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/run-auth-tests.js --quick');
    console.log('  TEST_USER_EMAIL=user@test.com node scripts/run-auth-tests.js --jest');
    console.log('');

    // Run quick test by default
    await quickApiTest();
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.log('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.log('❌ Uncaught Exception:', error.message);
  process.exit(1);
});

// Run main function
main().catch(error => {
  console.error('❌ Script error:', error.message);
  process.exit(1);
});