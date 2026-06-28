import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for JEVAL eval-form E2E tests.
 *
 * Run:  TEST_USER=... TEST_PASS=... npx playwright test
 * Target defaults to the live prod URL; override with BASE_URL for staging/local.
 */
export default defineConfig({
    testDir: './tests/e2e',
    timeout: 90_000,
    expect: { timeout: 15_000 },
    fullyParallel: false, // the wizard is stateful; keep runs serial
    retries: 1,
    reporter: [['list']],
    use: {
        baseURL: process.env.BASE_URL || 'https://jeval.otepc.go.th',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        ignoreHTTPSErrors: true,
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ],
});
