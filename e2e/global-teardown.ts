/**
 * Playwright Global Teardown
 *
 * Runs once after all tests. Use for:
 * - Cleanup of test data
 * - Closing external connections
 * - Final reporting
 */
import { FullConfig } from '@playwright/test';

async function globalTeardown(_config: FullConfig): Promise<void> {
  console.log('\n[E2E Teardown] Starting global teardown...');

  // Add any cleanup logic here
  // For example:
  // - Clean up test prompts created during tests
  // - Reset application state
  // - Close any open connections

  console.log('[E2E Teardown] Global teardown complete\n');
}

export default globalTeardown;
