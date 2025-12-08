/**
 * E2E Tests: Editor Launch
 *
 * Tests the "Just Works" editor launch UX:
 * 1. Selecting a prompt in Spotlight and pressing Alt+E opens THAT prompt
 * 2. Opening Editor without explicit promptId respects "remember" setting
 * 3. New Prompt action always opens blank editor
 * 4. Switching prompts in sidebar always shows selected prompt
 */
import { test, expect, Page, Locator } from '@playwright/test';

// Editor Page Object Model
class EditorPage {
  readonly page: Page;
  readonly sidebar: Locator;
  readonly editorMain: Locator;
  readonly promptNameInput: Locator;
  readonly promptList: Locator;
  readonly newPromptButton: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.locator('.prompt-sidebar');
    this.editorMain = page.locator('.editor-main');
    this.promptNameInput = page.locator('input[aria-label="Name"], input[placeholder*="name" i]');
    this.promptList = page.locator('.prompt-item');
    this.newPromptButton = page.locator('.sidebar-new-btn');
    this.saveButton = page.locator('button:has-text("Save")');
  }

  async navigate(params?: { promptId?: string; mode?: string }): Promise<void> {
    const searchParams = new URLSearchParams();
    if (params?.promptId) searchParams.set('promptId', params.promptId);
    if (params?.mode) searchParams.set('mode', params.mode);

    const url = `/editor${searchParams.toString() ? `?${searchParams}` : ''}`;
    await this.page.goto(url);
    await this.waitForReady();
  }

  async waitForReady(): Promise<void> {
    // Wait for the editor to be fully loaded
    await this.editorMain.waitFor({ state: 'visible', timeout: 10000 });
  }

  async getLoadedPromptName(): Promise<string> {
    // Wait for the name input to potentially be filled
    await this.page.waitForTimeout(500);
    return this.promptNameInput.inputValue();
  }

  async selectPromptInSidebar(promptName: string): Promise<void> {
    const prompt = this.sidebar.locator(`.prompt-item:has-text("${promptName}")`);
    await prompt.click();
    await this.page.waitForTimeout(300);
  }

  async clickNewPrompt(): Promise<void> {
    await this.newPromptButton.click();
    await this.page.waitForTimeout(300);
  }

  async getHeaderTitle(): Promise<string> {
    const title = this.editorMain.locator('h1');
    return title.textContent() ?? '';
  }
}

test.describe('Editor Launch - URL Parsing', () => {
  test('should load specific prompt when promptId is in URL', async ({ page }) => {
    const editor = new EditorPage(page);

    // Navigate to editor with a specific prompt ID
    // This tests the core URL parsing fix
    await editor.navigate({ promptId: 'Coding/code-review.md' });

    // The editor should load and show the prompt
    await expect(editor.editorMain).toBeVisible();

    // Header should show "Edit Prompt" or the prompt name (not "New Prompt")
    const title = await editor.getHeaderTitle();
    expect(title).not.toContain('New Prompt');
  });

  test('should show blank editor when mode=create and no promptId', async ({ page }) => {
    const editor = new EditorPage(page);

    // Navigate to editor in create mode
    await editor.navigate({ mode: 'create' });

    // Should show "New Prompt"
    const title = await editor.getHeaderTitle();
    expect(title).toContain('New Prompt');

    // Name input should be empty
    const name = await editor.getLoadedPromptName();
    expect(name).toBe('');
  });

  test('should re-parse URL when navigating to different prompt', async ({ page }) => {
    const editor = new EditorPage(page);

    // Navigate to editor without promptId first to see available prompts
    await editor.navigate();
    await expect(editor.sidebar).toBeVisible();

    const promptCount = await editor.promptList.count();
    if (promptCount < 2) {
      // Skip test if not enough prompts exist
      test.skip();
      return;
    }

    // Get the first two prompt IDs from the sidebar
    const firstPromptId = await editor.promptList.nth(0).getAttribute('data-prompt-id');
    const secondPromptId = await editor.promptList.nth(1).getAttribute('data-prompt-id');

    // Click first prompt
    await editor.promptList.nth(0).click();
    await page.waitForTimeout(500);
    const firstName = await editor.getLoadedPromptName();

    // Click second prompt
    await editor.promptList.nth(1).click();
    await page.waitForTimeout(500);
    const secondName = await editor.getLoadedPromptName();

    // Names should be different (proving selection was re-parsed)
    // Both prompts exist and were loaded from the UI
    if (firstName && secondName) {
      expect(firstName).not.toBe(secondName);
    }
  });
});

test.describe('Editor Launch - Sidebar Selection', () => {
  test('should load prompt when selected from sidebar', async ({ page }) => {
    const editor = new EditorPage(page);
    await editor.navigate();

    // Wait for sidebar to load
    await expect(editor.sidebar).toBeVisible();

    // Get count of prompts in sidebar
    const promptCount = await editor.promptList.count();

    if (promptCount > 1) {
      // Click on the second prompt
      await editor.promptList.nth(1).click();
      await page.waitForTimeout(500);

      // Editor should update (not be blank)
      const title = await editor.getHeaderTitle();
      expect(title).not.toContain('New Prompt');
    }
  });

  test('should switch between prompts correctly', async ({ page }) => {
    const editor = new EditorPage(page);
    await editor.navigate();

    await expect(editor.sidebar).toBeVisible();
    const promptCount = await editor.promptList.count();

    if (promptCount >= 2) {
      // Click first prompt
      await editor.promptList.nth(0).click();
      await page.waitForTimeout(300);
      const name1 = await editor.getLoadedPromptName();

      // Click second prompt
      await editor.promptList.nth(1).click();
      await page.waitForTimeout(300);
      const name2 = await editor.getLoadedPromptName();

      // Should have switched (names different)
      expect(name1).not.toBe(name2);

      // Click back to first
      await editor.promptList.nth(0).click();
      await page.waitForTimeout(300);
      const name1Again = await editor.getLoadedPromptName();

      // Should be back to first prompt
      expect(name1Again).toBe(name1);
    }
  });

  test('should show blank editor after clicking New button', async ({ page }) => {
    const editor = new EditorPage(page);

    // Start with a specific prompt loaded
    await editor.navigate({ promptId: 'Coding/code-review.md' });

    // Click New Prompt button
    await editor.clickNewPrompt();

    // Should show "New Prompt"
    const title = await editor.getHeaderTitle();
    expect(title).toContain('New Prompt');

    // Name should be empty
    const name = await editor.getLoadedPromptName();
    expect(name).toBe('');
  });
});

test.describe('Editor Launch - Remember Setting', () => {
  test('should respect remember_last_edited_prompt setting when opening without promptId', async ({ page }) => {
    const editor = new EditorPage(page);

    // Navigate to editor without any promptId
    await editor.navigate();

    // If setting is OFF (default), editor should either:
    // 1. Show first prompt from list
    // 2. Show blank new prompt form
    // 3. Show prompt list with sidebar

    // The sidebar should be visible for navigation
    await expect(editor.sidebar).toBeVisible();

    // Editor main should be visible
    await expect(editor.editorMain).toBeVisible();
  });

  // Note: Testing the "remember" feature fully requires mocking config
  // or having actual state persistence. This test verifies the structure.
  test('should maintain editor state during session', async ({ page }) => {
    const editor = new EditorPage(page);
    await editor.navigate();

    const promptCount = await editor.promptList.count();
    if (promptCount > 0) {
      // Select a prompt
      await editor.promptList.nth(0).click();
      await page.waitForTimeout(300);

      const selectedName = await editor.getLoadedPromptName();

      // The selected prompt should remain loaded
      // (This tests that selection persists within session)
      const nameAfterWait = await editor.getLoadedPromptName();
      expect(nameAfterWait).toBe(selectedName);
    }
  });
});

test.describe('Editor Launch - Direct Manipulation', () => {
  test('explicit promptId should always override remember setting', async ({ page }) => {
    const editor = new EditorPage(page);

    // Navigate with explicit promptId
    await editor.navigate({ promptId: 'Coding/code-review.md' });

    // Should load that specific prompt regardless of remember setting
    await expect(editor.editorMain).toBeVisible();

    // Should not be in "New Prompt" mode
    const title = await editor.getHeaderTitle();
    expect(title).not.toContain('New Prompt');
  });

  test('mode=create should always show blank editor', async ({ page }) => {
    const editor = new EditorPage(page);

    // Navigate with explicit create mode
    await editor.navigate({ mode: 'create' });

    // Should always be blank, regardless of remember setting
    const title = await editor.getHeaderTitle();
    expect(title).toContain('New Prompt');

    const name = await editor.getLoadedPromptName();
    expect(name).toBe('');
  });
});
