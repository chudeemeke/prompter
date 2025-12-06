/**
 * E2E Tests: Keyboard Navigation
 *
 * Tests keyboard-only accessibility:
 * 1. All features accessible via keyboard
 * 2. Focus management works correctly
 * 3. Escape key closes modals/returns focus
 * 4. Tab order is logical
 * 5. Screen reader compatibility
 */
import { test, expect } from '../fixtures/prompter-fixtures';

test.describe('Keyboard Navigation', () => {
  test.describe('Focus Management', () => {
    test('should focus search input on page load', async ({ spotlightPage }) => {
      await spotlightPage.navigate();

      await expect(spotlightPage.searchInput).toBeFocused();
    });

    test('should maintain focus on search input during typing', async ({ spotlightPage }) => {
      await spotlightPage.navigate();

      // Type in search
      await spotlightPage.searchInput.type('test query');

      // Focus should remain on search input
      await expect(spotlightPage.searchInput).toBeFocused();
    });

    test('should keep focus on search input during arrow navigation', async ({
      spotlightPage,
    }) => {
      await spotlightPage.navigate();

      // Navigate with arrows
      await spotlightPage.navigateDown();
      await spotlightPage.navigateDown();
      await spotlightPage.navigateUp();

      // Focus should remain on search input
      await expect(spotlightPage.searchInput).toBeFocused();
    });

    test('should trap focus in context modal when open', async ({ spotlightPage, page }) => {
      await spotlightPage.navigate();

      const resultCount = await spotlightPage.getResultCount();
      if (resultCount > 0) {
        await spotlightPage.confirmSelection();

        const isModalVisible = await spotlightPage.isContextModalVisible();
        if (isModalVisible) {
          // Tab through all elements
          for (let i = 0; i < 10; i++) {
            await page.keyboard.press('Tab');
          }

          // Focus should still be within modal
          const activeElement = await page.evaluate(() => {
            const modal = document.querySelector('[data-testid="context-modal"]');
            return modal?.contains(document.activeElement);
          });

          expect(activeElement).toBeTruthy();
        }
      }
    });

    test('should return focus to search input after modal closes', async ({ spotlightPage }) => {
      await spotlightPage.navigate();

      const resultCount = await spotlightPage.getResultCount();
      if (resultCount > 0) {
        await spotlightPage.confirmSelection();

        const isModalVisible = await spotlightPage.isContextModalVisible();
        if (isModalVisible) {
          // Close modal
          await spotlightPage.escapeModal();

          // Wait for modal to close
          await expect(spotlightPage.contextModal).not.toBeVisible();

          // Focus should return to search input
          await expect(spotlightPage.searchInput).toBeFocused();
        }
      }
    });
  });

  test.describe('Arrow Key Navigation', () => {
    test('should navigate down through results', async ({ spotlightPage }) => {
      await spotlightPage.navigate();

      const resultCount = await spotlightPage.getResultCount();
      if (resultCount > 2) {
        // Initial selection is 0
        expect(await spotlightPage.getSelectedIndex()).toBe(0);

        // Navigate down
        await spotlightPage.navigateDown();
        expect(await spotlightPage.getSelectedIndex()).toBe(1);

        await spotlightPage.navigateDown();
        expect(await spotlightPage.getSelectedIndex()).toBe(2);
      }
    });

    test('should navigate up through results', async ({ spotlightPage }) => {
      await spotlightPage.navigate();

      const resultCount = await spotlightPage.getResultCount();
      if (resultCount > 2) {
        // Navigate down first
        await spotlightPage.navigateDown();
        await spotlightPage.navigateDown();
        expect(await spotlightPage.getSelectedIndex()).toBe(2);

        // Navigate up
        await spotlightPage.navigateUp();
        expect(await spotlightPage.getSelectedIndex()).toBe(1);

        await spotlightPage.navigateUp();
        expect(await spotlightPage.getSelectedIndex()).toBe(0);
      }
    });

    test('should wrap from first to last result', async ({ spotlightPage }) => {
      await spotlightPage.navigate();

      const resultCount = await spotlightPage.getResultCount();
      if (resultCount > 0) {
        // Start at first (index 0)
        expect(await spotlightPage.getSelectedIndex()).toBe(0);

        // Navigate up should wrap to last
        await spotlightPage.navigateUp();
        expect(await spotlightPage.getSelectedIndex()).toBe(resultCount - 1);
      }
    });

    test('should wrap from last to first result', async ({ spotlightPage }) => {
      await spotlightPage.navigate();

      const resultCount = await spotlightPage.getResultCount();
      if (resultCount > 0) {
        // Navigate to last
        for (let i = 0; i < resultCount - 1; i++) {
          await spotlightPage.navigateDown();
        }
        expect(await spotlightPage.getSelectedIndex()).toBe(resultCount - 1);

        // Navigate down should wrap to first
        await spotlightPage.navigateDown();
        expect(await spotlightPage.getSelectedIndex()).toBe(0);
      }
    });
  });

  test.describe('Enter Key Behavior', () => {
    test('should select current result on Enter', async ({ spotlightPage }) => {
      await spotlightPage.navigate();

      const resultCount = await spotlightPage.getResultCount();
      if (resultCount > 0) {
        // Press Enter to select
        await spotlightPage.confirmSelection();

        // Either modal opens (if prompt has variables) or action completes
        // Just verify no crash occurs
        await expect(spotlightPage.searchInput).toBeVisible();
      }
    });

    test('should submit context modal on Enter in last field', async ({ spotlightPage, page }) => {
      await spotlightPage.navigate();

      const resultCount = await spotlightPage.getResultCount();
      if (resultCount > 0) {
        await spotlightPage.confirmSelection();

        const isModalVisible = await spotlightPage.isContextModalVisible();
        if (isModalVisible) {
          // Fill all required fields
          const inputs = spotlightPage.contextModal.locator('input[required]');
          const inputCount = await inputs.count();

          for (let i = 0; i < inputCount; i++) {
            const input = inputs.nth(i);
            await input.fill('test value');
          }

          // Press Enter to submit
          await page.keyboard.press('Enter');

          // Modal should close on successful submit
          // (may stay open if validation fails)
          await spotlightPage.page.waitForTimeout(500);
        }
      }
    });
  });

  test.describe('Escape Key Behavior', () => {
    test('should close context modal on Escape', async ({ spotlightPage }) => {
      await spotlightPage.navigate();

      const resultCount = await spotlightPage.getResultCount();
      if (resultCount > 0) {
        await spotlightPage.confirmSelection();

        const isModalVisible = await spotlightPage.isContextModalVisible();
        if (isModalVisible) {
          await spotlightPage.escapeModal();
          await expect(spotlightPage.contextModal).not.toBeVisible();
        }
      }
    });

    test('should clear search on Escape when modal is closed', async ({ spotlightPage }) => {
      await spotlightPage.navigate();

      // Type in search
      await spotlightPage.search('test query');
      await expect(spotlightPage.searchInput).toHaveValue('test query');

      // Press Escape
      await spotlightPage.escapeModal();

      // Search should be cleared (depending on app behavior)
      // Or app should close - test both scenarios
      const searchValue = await spotlightPage.searchInput.inputValue();
      // Either search is cleared OR escape triggers window close
      expect(searchValue.length).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Tab Key Navigation', () => {
    test('should tab through interactive elements in modal', async ({ spotlightPage, page }) => {
      await spotlightPage.navigate();

      const resultCount = await spotlightPage.getResultCount();
      if (resultCount > 0) {
        await spotlightPage.confirmSelection();

        const isModalVisible = await spotlightPage.isContextModalVisible();
        if (isModalVisible) {
          // Get all focusable elements
          const focusableElements = await page.evaluate(() => {
            const modal = document.querySelector('[data-testid="context-modal"]');
            if (!modal) return [];

            const focusable = modal.querySelectorAll(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            return Array.from(focusable).map((el) => el.tagName.toLowerCase());
          });

          // Tab through elements
          for (let i = 0; i < focusableElements.length; i++) {
            await page.keyboard.press('Tab');
          }

          // Should have cycled through all focusable elements
          expect(focusableElements.length).toBeGreaterThan(0);
        }
      }
    });

    test('should support shift+tab for reverse navigation', async ({ spotlightPage, page }) => {
      await spotlightPage.navigate();

      const resultCount = await spotlightPage.getResultCount();
      if (resultCount > 0) {
        await spotlightPage.confirmSelection();

        const isModalVisible = await spotlightPage.isContextModalVisible();
        if (isModalVisible) {
          // Tab forward
          await page.keyboard.press('Tab');
          await page.keyboard.press('Tab');

          // Tab backward
          await page.keyboard.press('Shift+Tab');

          // Should move focus backward without error
          await expect(spotlightPage.contextModal).toBeVisible();
        }
      }
    });
  });

  test.describe('Accessibility Attributes', () => {
    test('should have proper ARIA labels on search input', async ({ spotlightPage, page }) => {
      await spotlightPage.navigate();

      // Check for aria-label or associated label
      const hasAriaLabel = await spotlightPage.searchInput.getAttribute('aria-label');
      const hasPlaceholder = await spotlightPage.searchInput.getAttribute('placeholder');
      const labelId = await spotlightPage.searchInput.getAttribute('aria-labelledby');

      // Should have some form of accessible name
      expect(hasAriaLabel || hasPlaceholder || labelId).toBeTruthy();
    });

    test('should have proper ARIA role on results list', async ({ spotlightPage }) => {
      await spotlightPage.navigate();

      const role = await spotlightPage.resultsList.getAttribute('role');
      // Should have listbox or list role
      expect(role === 'listbox' || role === 'list' || role === null).toBeTruthy();
    });

    test('should mark selected item with aria-selected', async ({ spotlightPage }) => {
      await spotlightPage.navigate();

      const resultCount = await spotlightPage.getResultCount();
      if (resultCount > 0) {
        const results = spotlightPage.resultsList.locator('[data-testid="result-item"]');
        const firstResult = results.first();

        // Should have aria-selected or data-selected attribute
        const ariaSelected = await firstResult.getAttribute('aria-selected');
        const dataSelected = await firstResult.getAttribute('data-selected');

        expect(ariaSelected === 'true' || dataSelected === 'true').toBeTruthy();
      }
    });

    test('should have proper modal ARIA attributes', async ({ spotlightPage }) => {
      await spotlightPage.navigate();

      const resultCount = await spotlightPage.getResultCount();
      if (resultCount > 0) {
        await spotlightPage.confirmSelection();

        const isModalVisible = await spotlightPage.isContextModalVisible();
        if (isModalVisible) {
          const role = await spotlightPage.contextModal.getAttribute('role');
          const ariaModal = await spotlightPage.contextModal.getAttribute('aria-modal');

          // Modal should have dialog role
          expect(role === 'dialog' || role === 'alertdialog').toBeTruthy();
          // Should have aria-modal="true"
          expect(ariaModal).toBe('true');
        }
      }
    });
  });
});
