import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration for Prompter
 *
 * This configuration supports two testing modes:
 * 1. Development mode: Tests against Vite dev server (npm run dev)
 * 2. Preview mode: Tests against built app (npm run build && npm run preview)
 *
 * For full Tauri desktop app testing, use tauri-driver with WebDriver protocol.
 * See: https://tauri.app/v1/guides/testing/webdriver/
 */
export default defineConfig({
  // Test directory
  testDir: './e2e/tests',

  // Test matching patterns
  testMatch: '**/*.spec.ts',

  // Run tests in parallel
  fullyParallel: true,

  // Fail build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,

  // Retry failed tests (useful for flaky E2E tests)
  retries: process.env.CI ? 2 : 0,

  // Number of parallel workers
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'e2e/reports/html' }],
    ['json', { outputFile: 'e2e/reports/results.json' }],
    ['list'],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for tests
    baseURL: 'http://localhost:1420',

    // Collect trace when retrying failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video recording
    video: 'on-first-retry',

    // Default timeout for actions
    actionTimeout: 10000,

    // Navigation timeout
    navigationTimeout: 30000,
  },

  // Configure projects for different scenarios
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Tauri uses Chromium-based WebView on Windows
    // This project simulates the Tauri WebView environment
    {
      name: 'tauri-webview',
      use: {
        ...devices['Desktop Chrome'],
        // Tauri WebView specific viewport
        viewport: { width: 700, height: 500 },
        // Disable animations for consistent tests
        reducedMotion: 'reduce',
      },
    },
  ],

  // Global setup and teardown
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',

  // Web server configuration
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:1420',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },

  // Test timeout
  timeout: 30000,

  // Expect timeout
  expect: {
    timeout: 5000,
  },

  // Output directory for test artifacts
  outputDir: 'e2e/test-results',
});
