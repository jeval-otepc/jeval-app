# Authentication Testing Guide

## Overview

Comprehensive testing suite for JEVAL authentication system with Strapi backend API.

## Test Coverage

### 🔐 API Authentication Tests
- ✅ Strapi `/auth/local` endpoint testing
- ✅ JWT token validation and structure
- ✅ Protected endpoint access (`/users/me`)
- ✅ Invalid credentials handling
- ✅ Token expiration and security
- ✅ Performance and response time benchmarks

### 🌐 Frontend E2E Tests
- ✅ Full browser login flow testing
- ✅ Form validation and error handling
- ✅ Session persistence across page reloads
- ✅ Logout functionality
- ✅ Protected route access control
- ✅ Thai language interface support

### 🚀 Performance Tests
- ✅ API response time monitoring
- ✅ SSL certificate validation
- ✅ CORS headers verification
- ✅ Network connectivity testing

## Quick Start

### 1. Install Dependencies

```bash
# Install testing dependencies
npm install --save-dev jest node-fetch @playwright/test

# Or if using yarn
yarn add -D jest node-fetch @playwright/test
```

### 2. Environment Setup

```bash
# Set test credentials (optional - defaults provided)
export TEST_USER_EMAIL="admin@otepc.mail.go.th"
export TEST_USER_PASSWORD="Admin@@#"
```

### 3. Run Tests

```bash
# Quick API authentication test
npm run test:auth

# Full Jest test suite
npm run test:auth:full

# Browser E2E tests (requires Playwright setup)
npm run test:auth:e2e

# Complete test suite
npm run test:production
```

## Test Commands

### NPM Scripts

```bash
# Quick API test (recommended for CI/CD)
npm run test:auth

# Full API integration tests
npm run test:auth:full

# End-to-end browser tests
npm run test:auth:e2e

# Run all authentication tests
npm run test:production
```

### Direct Script Execution

```bash
# Quick test
node scripts/run-auth-tests.js --quick

# Jest tests
node scripts/run-auth-tests.js --jest

# Playwright tests
node scripts/run-auth-tests.js --playwright

# All tests
node scripts/run-auth-tests.js --all
```

## Test Configuration

### Production Environment
- **Frontend URL**: `https://jeval.otepc.go.th`
- **Strapi API**: `https://jeval.otepc.go.th/admin/api`
- **Test User**: `admin@otepc.mail.go.th`
- **Protocol**: HTTPS with SSL verification

### Test Credentials

```bash
# Default test credentials
identifier: "admin@otepc.mail.go.th"
password: "Admin@@#"

# Override with environment variables
TEST_USER_EMAIL="your-test-user@email.com"
TEST_USER_PASSWORD="your-test-password"
```

## API Test Examples

### Successful Authentication Test

```javascript
// Test Strapi authentication endpoint
const response = await fetch('https://jeval.otepc.go.th/admin/api/auth/local', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8'
  },
  body: JSON.stringify({
    identifier: 'admin@otepc.mail.go.th',
    password: 'Admin@@#'
  })
});

// Expected response
{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@otepc.mail.go.th",
    "username": "admin",
    "role": {
      "name": "Administrator"
    }
  }
}
```

### Protected Endpoint Test

```javascript
// Test protected endpoint with JWT
const response = await fetch('https://jeval.otepc.go.th/admin/api/users/me', {
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Accept': 'application/json'
  }
});

// Expected: 200 OK with user data
```

## E2E Test Examples

### Login Flow Test

```javascript
// Navigate and login
await page.goto('https://jeval.otepc.go.th/login');
await page.fill('input[type="email"]', 'admin@otepc.mail.go.th');
await page.fill('input[type="password"]', 'Admin@@#');
await page.click('button[type="submit"]');

// Verify successful login
await expect(page.locator('text=Dashboard')).toBeVisible();
```

## Expected Test Results

### ✅ Successful Authentication

```
📊 Response Time: 850ms
📈 Status Code: 200
🔑 JWT Token Length: 255
👤 User ID: 1
📧 User Email: admin@otepc.mail.go.th
🔐 User Role: Administrator
```

### ❌ Failed Authentication

```
📈 Status Code: 400
📋 Error: Invalid identifier or password
```

### 🔒 Protected Endpoint Access

```
📈 /users/me Status: 200
✅ User data retrieved successfully
👤 User ID: 1
📧 Email: admin@otepc.mail.go.th
```

## Troubleshooting

### Common Issues

#### Network Connection Error
```bash
❌ Network Error: Cannot connect to the API server
```
**Solutions:**
- Check internet connectivity
- Verify domain is accessible: `ping jeval.otepc.go.th`
- Test SSL certificate: `curl -I https://jeval.otepc.go.th`

#### SSL Certificate Issues
```bash
❌ SSL Certificate verification failed
```
**Solutions:**
- Update Node.js to latest version
- Check certificate validity: `openssl s_client -connect jeval.otepc.go.th:443`
- For development: `NODE_TLS_REJECT_UNAUTHORIZED=0` (not recommended for production)

#### Authentication Failures
```bash
❌ Authentication Failed: Invalid identifier or password
```
**Solutions:**
- Verify test credentials are correct
- Check if user account is active in Strapi admin
- Ensure Strapi user permissions are properly configured

#### Playwright Browser Issues
```bash
❌ Browser not found
```
**Solutions:**
```bash
# Install Playwright browsers
npx playwright install

# Install specific browser
npx playwright install chromium
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=1 npm run test:auth

# Verbose Jest output
npm run test:auth:full -- --verbose

# Playwright debug mode
npm run test:auth:e2e -- --debug
```

## Test Files Structure

```
tests/
├── api/
│   └── strapi-auth-api.test.js     # API integration tests
├── e2e/
│   └── auth-flow.spec.js           # Browser E2E tests
└── auth/
    └── production-auth.test.js     # Production environment tests

scripts/
└── run-auth-tests.js               # Test runner script
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Authentication Tests

on: [push, pull_request]

jobs:
  auth-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run authentication tests
        run: npm run test:auth
        env:
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
```

### Docker Testing

```bash
# Run tests in Docker container
docker run -it --rm \
  -e TEST_USER_EMAIL="admin@otepc.mail.go.th" \
  -e TEST_USER_PASSWORD="Admin@@#" \
  node:18-alpine \
  npm run test:auth
```

## Security Considerations

### Test Credentials
- ⚠️ **Never commit real passwords to git**
- ✅ Use environment variables for sensitive data
- ✅ Create dedicated test accounts with limited permissions
- ✅ Rotate test credentials regularly

### Production Testing
- ⚠️ **Test against production cautiously**
- ✅ Use read-only test accounts when possible
- ✅ Monitor test frequency to avoid rate limiting
- ✅ Clean up test data after testing

## Monitoring and Alerts

### Performance Benchmarks
- **API Response Time**: < 2 seconds (good), < 5 seconds (acceptable)
- **Authentication Success Rate**: > 99%
- **SSL Certificate**: Valid and not expiring within 30 days

### Automated Monitoring

```bash
# Daily authentication health check
0 6 * * * cd /path/to/jeval && npm run test:auth > /var/log/auth-tests.log 2>&1
```

## Support

### Documentation
- [Environment Configuration Guide](ENVIRONMENT-GUIDE.md)
- [SSL Configuration Guide](SSL-CONFIGURATION.md)
- [Strapi API Documentation](https://docs.strapi.io)

### Debugging Resources
- Enable verbose logging with `DEBUG=1`
- Check network connectivity with `curl` commands
- Validate JWT tokens at [jwt.io](https://jwt.io)
- Test API endpoints with Postman or curl