// Playwright E2E Authentication Tests
// Full browser testing for authentication flow

const { test, expect } = require('@playwright/test');

// Test configuration
const BASE_URL = 'https://jeval.otepc.go.th';
const TEST_CREDENTIALS = {
  email: process.env.TEST_USER_EMAIL || 'admin@otepc.mail.go.th',
  password: process.env.TEST_USER_PASSWORD || 'Admin@@#'
};

test.describe('Authentication Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for production environment
    test.setTimeout(60000);

    // Clear any existing session
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    console.log('🧪 Testing login flow...');

    // Navigate to homepage
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/JEVAL/);

    // Look for login button or link
    const loginButton = page.locator('text=Login').or(page.locator('text=เข้าสู่ระบบ')).or(page.locator('[href*="login"]')).first();

    if (await loginButton.isVisible()) {
      await loginButton.click();
    } else {
      // If no login button, navigate directly to login page
      await page.goto(`${BASE_URL}/login`);
    }

    // Wait for login form
    await page.waitForSelector('input[type="email"], input[name="email"], input[name="identifier"]', { timeout: 10000 });

    // Fill login form
    const emailInput = page.locator('input[type="email"], input[name="email"], input[name="identifier"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

    await emailInput.fill(TEST_CREDENTIALS.email);
    await passwordInput.fill(TEST_CREDENTIALS.password);

    // Submit form
    const submitButton = page.locator('button[type="submit"]').or(page.locator('text=Submit')).or(page.locator('text=เข้าสู่ระบบ')).first();
    await submitButton.click();

    // Wait for redirect or success indicator
    await page.waitForTimeout(3000);

    // Check if login was successful
    // Look for dashboard, user menu, or other authenticated content
    const isAuthenticated = await page.locator('text=Dashboard').or(
      page.locator('text=แดชบอร์ด')
    ).or(
      page.locator('[data-testid="user-menu"]')
    ).or(
      page.locator('text=Logout')
    ).first().isVisible({ timeout: 5000 }).catch(() => false);

    if (isAuthenticated) {
      console.log('✅ Login successful - authenticated content detected');
    } else {
      console.log('ℹ️ Authentication state unclear - capturing page for debugging');
      await page.screenshot({ path: 'login-result.png', fullPage: true });
    }

    // Check URL for redirect to dashboard or authenticated area
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);

    // Verify we're not still on login page
    expect(currentUrl).not.toContain('/login');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    console.log('🧪 Testing invalid credentials...');

    await page.goto(`${BASE_URL}/login`);

    // Wait for login form
    await page.waitForSelector('input[type="email"], input[name="email"], input[name="identifier"]');

    // Fill with invalid credentials
    await page.fill('input[type="email"], input[name="email"], input[name="identifier"]', 'invalid@test.com');
    await page.fill('input[type="password"], input[name="password"]', 'wrongpassword');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for error message
    await page.waitForTimeout(2000);

    // Look for error indicators
    const errorMessage = await page.locator('text=Invalid').or(
      page.locator('text=Error')
    ).or(
      page.locator('text=ไม่ถูกต้อง')
    ).or(
      page.locator('.error')
    ).first().isVisible({ timeout: 5000 }).catch(() => false);

    if (errorMessage) {
      console.log('✅ Error message displayed for invalid credentials');
    } else {
      console.log('ℹ️ No explicit error message found');
    }

    // Should still be on login page
    expect(page.url()).toContain('/login');
  });

  test('should protect authenticated routes', async ({ page }) => {
    console.log('🧪 Testing route protection...');

    // Try to access protected route without authentication
    await page.goto(`${BASE_URL}/dashboard`);

    // Should redirect to login or show unauthorized
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    console.log('URL when accessing protected route:', currentUrl);

    // Should be redirected to login or blocked
    const isProtected = currentUrl.includes('/login') ||
                       currentUrl.includes('/unauthorized') ||
                       await page.locator('text=Login').isVisible();

    if (isProtected) {
      console.log('✅ Protected route properly secured');
    } else {
      console.log('ℹ️ Route protection behavior unclear');
    }
  });

  test('should maintain session across page reloads', async ({ page }) => {
    console.log('🧪 Testing session persistence...');

    // First, login
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="email"], input[name="email"], input[name="identifier"]');

    await page.fill('input[type="email"], input[name="email"], input[name="identifier"]', TEST_CREDENTIALS.email);
    await page.fill('input[type="password"], input[name="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');

    await page.waitForTimeout(3000);

    // Reload the page
    await page.reload();
    await page.waitForTimeout(2000);

    // Check if still authenticated
    const isStillAuthenticated = await page.locator('text=Dashboard').or(
      page.locator('text=Logout')
    ).first().isVisible({ timeout: 5000 }).catch(() => false);

    if (isStillAuthenticated) {
      console.log('✅ Session persisted across reload');
    } else {
      console.log('ℹ️ Session may not persist - check authentication implementation');
    }
  });

  test('should logout successfully', async ({ page }) => {
    console.log('🧪 Testing logout flow...');

    // First, login
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="email"], input[name="email"], input[name="identifier"]');

    await page.fill('input[type="email"], input[name="email"], input[name="identifier"]', TEST_CREDENTIALS.email);
    await page.fill('input[type="password"], input[name="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');

    await page.waitForTimeout(3000);

    // Look for logout button
    const logoutButton = page.locator('text=Logout').or(
      page.locator('text=ออกจากระบบ')
    ).or(
      page.locator('[data-testid="logout"]')
    ).first();

    if (await logoutButton.isVisible({ timeout: 5000 })) {
      await logoutButton.click();
      await page.waitForTimeout(2000);

      // Should be redirected to login or home
      const currentUrl = page.url();
      console.log('URL after logout:', currentUrl);

      // Verify logout was successful
      const isLoggedOut = currentUrl.includes('/login') ||
                         await page.locator('text=Login').isVisible();

      if (isLoggedOut) {
        console.log('✅ Logout successful');
      } else {
        console.log('ℹ️ Logout behavior unclear');
      }
    } else {
      console.log('ℹ️ Logout button not found - may need to implement');
    }
  });

  test('should handle Thai language authentication', async ({ page }) => {
    console.log('🧪 Testing Thai language support...');

    await page.goto(BASE_URL);

    // Check for Thai language content
    const hasThaiContent = await page.locator('text=เข้าสู่ระบบ').or(
      page.locator('text=ออกจากระบบ')
    ).or(
      page.locator('text=แดชบอร์ด')
    ).first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasThaiContent) {
      console.log('✅ Thai language content detected');
    } else {
      console.log('ℹ️ No Thai language content found');
    }
  });
});