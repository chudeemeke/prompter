/**
 * Prompter E2E Test Fixtures
 *
 * Custom test fixtures for Prompter-specific testing scenarios.
 * Extends Playwright's base test with app-specific helpers.
 */
import { test as base, expect, Page, Locator } from '@playwright/test';

// Test data types
export interface TestPrompt {
  name: string;
  description: string;
  content: string;
  folder?: string;
  tags?: string[];
  variables?: Array<{ name: string; default?: string; required?: boolean }>;
}

// Page Object Model for SpotlightWindow
export class SpotlightPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly resultsList: Locator;
  readonly contextModal: Locator;
  readonly emptyState: Locator;
  readonly loadingIndicator: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use data-testid for reliable selection, with aria-label for accessibility
    this.searchInput = page.locator('[data-testid="search-input"]');
    this.resultsList = page.locator('[data-testid="results-list"]');
    this.contextModal = page.locator('[data-testid="context-modal"]');
    this.emptyState = page.locator('[data-testid="empty-state"]');
    this.loadingIndicator = page.locator('[data-testid="loading"]');
  }

  async navigate(): Promise<void> {
    await this.page.goto('/');
    await this.waitForReady();
  }

  async waitForReady(): Promise<void> {
    // Wait for the app to be fully loaded
    await this.searchInput.waitFor({ state: 'visible' });
    // Wait for initial data load
    await this.page.waitForFunction(() => {
      const loading = document.querySelector('[data-testid="loading"]');
      return !loading || loading.getAttribute('aria-hidden') === 'true';
    });
  }

  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    // Wait for search debounce and results
    await this.page.waitForTimeout(200);
  }

  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
  }

  async selectResultByIndex(index: number): Promise<void> {
    const results = this.resultsList.locator('[data-testid="result-item"]');
    await results.nth(index).click();
  }

  async selectResultByName(name: string): Promise<void> {
    const result = this.resultsList.locator(`[data-testid="result-item"]:has-text("${name}")`);
    await result.click();
  }

  async navigateDown(): Promise<void> {
    await this.searchInput.press('ArrowDown');
  }

  async navigateUp(): Promise<void> {
    await this.searchInput.press('ArrowUp');
  }

  async confirmSelection(): Promise<void> {
    await this.searchInput.press('Enter');
  }

  async escapeModal(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }

  async getResultCount(): Promise<number> {
    const results = this.resultsList.locator('[data-testid="result-item"]');
    return results.count();
  }

  async getSelectedIndex(): Promise<number> {
    const results = this.resultsList.locator('[data-testid="result-item"]');
    const count = await results.count();

    for (let i = 0; i < count; i++) {
      const isSelected = await results.nth(i).getAttribute('data-selected');
      if (isSelected === 'true') {
        return i;
      }
    }

    return -1;
  }

  async getResultNames(): Promise<string[]> {
    const results = this.resultsList.locator('[data-testid="result-item"]');
    const count = await results.count();
    const names: string[] = [];

    for (let i = 0; i < count; i++) {
      const nameElement = results.nth(i).locator('[data-testid="result-name"]');
      const text = await nameElement.textContent();
      if (text) {
        names.push(text);
      }
    }

    return names;
  }

  async isContextModalVisible(): Promise<boolean> {
    return this.contextModal.isVisible();
  }

  async fillVariable(variableName: string, value: string): Promise<void> {
    const input = this.contextModal.locator(`input[name="${variableName}"]`);
    await input.fill(value);
  }

  async submitContextModal(): Promise<void> {
    const submitButton = this.contextModal.locator('button[type="submit"]');
    await submitButton.click();
  }

  async cancelContextModal(): Promise<void> {
    const cancelButton = this.contextModal.locator('button:has-text("Cancel")');
    await cancelButton.click();
  }
}

// Extend Playwright test with our custom fixtures
type PrompterFixtures = {
  spotlightPage: SpotlightPage;
  testPrompts: TestPrompt[];
};

export const test = base.extend<PrompterFixtures>({
  spotlightPage: async ({ page }, use) => {
    const spotlightPage = new SpotlightPage(page);
    await use(spotlightPage);
  },

  testPrompts: [
    {
      name: 'Code Review',
      description: 'Template for code review feedback',
      content: 'Please review this {{language}} code:\n\n{{code}}\n\nFocus on:\n- Code quality\n- Performance\n- Security',
      folder: 'Coding',
      tags: ['development', 'review'],
      variables: [
        { name: 'language', default: 'TypeScript', required: true },
        { name: 'code', required: true },
      ],
    },
    {
      name: 'Meeting Summary',
      description: 'Summarize meeting notes',
      content: 'Summarize the following meeting notes:\n\n{{notes}}',
      folder: 'Writing',
      tags: ['productivity'],
      variables: [{ name: 'notes', required: true }],
    },
    {
      name: 'Quick Reply',
      description: 'Generate a quick email reply',
      content: 'Draft a {{tone}} reply to this email:\n\n{{email}}',
      folder: 'Writing',
      tags: ['email', 'communication'],
      variables: [
        { name: 'tone', default: 'professional', required: false },
        { name: 'email', required: true },
      ],
    },
  ],
});

export { expect };
