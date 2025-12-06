/**
 * Playwright Global Setup
 *
 * Runs once before all tests. Use for:
 * - Environment validation
 * - Database seeding
 * - Authentication setup
 * - Test data preparation
 */
import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0].use?.baseURL || 'http://localhost:1420';

  console.log('\n[E2E Setup] Starting global setup...');
  console.log(`[E2E Setup] Base URL: ${baseURL}`);

  // Validate the dev server is accessible
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for the app to be ready
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    console.log('[E2E Setup] Application is accessible');

    // Take a screenshot of the initial state for debugging
    await page.screenshot({ path: 'e2e/reports/setup-screenshot.png' });
    console.log('[E2E Setup] Initial screenshot captured');
  } catch (error) {
    console.error('[E2E Setup] Failed to connect to application:', error);
    throw new Error(
      `E2E Setup failed: Could not connect to ${baseURL}. ` +
        'Make sure the dev server is running (npm run dev)'
    );
  } finally {
    await browser.close();
  }

  console.log('[E2E Setup] Global setup complete\n');
}

export default globalSetup;
