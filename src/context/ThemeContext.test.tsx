import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { ThemeProvider, useTheme, getSystemTheme, applyThemeToDocument } from './ThemeContext';
import type { PromptService } from '../services/PromptService';
import type { AppConfig } from '../lib/types';

// =============================================================================
// MOCKS
// =============================================================================

const createMockService = (config: Partial<AppConfig> = {}): PromptService => ({
  // Core CRUD
  getAllPrompts: vi.fn(),
  getPrompt: vi.fn(),
  createPrompt: vi.fn(),
  updatePrompt: vi.fn(),
  deletePrompt: vi.fn(),
  duplicatePrompt: vi.fn(),

  // Search & Filtering
  searchPrompts: vi.fn(),
  getPromptsByFolder: vi.fn(),
  getPromptsByTag: vi.fn(),
  getFavoritePrompts: vi.fn(),

  // Organization
  getFolders: vi.fn(),
  createFolder: vi.fn(),
  deleteFolder: vi.fn(),
  getTags: vi.fn(),
  toggleFavorite: vi.fn(),

  // Version History
  getVersionHistory: vi.fn(),
  restoreVersion: vi.fn(),

  // Usage & Analytics
  recordUsage: vi.fn(),
  getUsageStats: vi.fn(),

  // Clipboard & Window
  copyAndPaste: vi.fn(),
  hideAndRestore: vi.fn(),

  // Settings
  getConfig: vi.fn().mockResolvedValue({ theme: 'dark', ...config }),
  updateConfig: vi.fn().mockResolvedValue(undefined),

  // Import/Export
  exportPrompt: vi.fn(),
  importPrompt: vi.fn(),

  // Window Management
  openEditorWindow: vi.fn(),
  openSettingsWindow: vi.fn(),
  openAnalyticsWindow: vi.fn(),
  closeWindow: vi.fn(),

  // Autostart
  enableAutostart: vi.fn(),
  disableAutostart: vi.fn(),
  isAutostartEnabled: vi.fn(),
});

// Test component to access context
function TestComponent() {
  const { theme, effectiveTheme, loading } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="effective-theme">{effectiveTheme}</span>
      <span data-testid="loading">{loading.toString()}</span>
    </div>
  );
}

function TestComponentWithSetTheme() {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setTheme('system')}>Set System</button>
    </div>
  );
}

// =============================================================================
// TESTS
// =============================================================================

describe('ThemeContext', () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    // Save original matchMedia
    originalMatchMedia = window.matchMedia;

    // Mock matchMedia
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    // Clear any dark class from document
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = '';
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.clearAllMocks();
  });

  describe('getSystemTheme', () => {
    it('should return dark when system prefers dark', () => {
      window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      expect(getSystemTheme()).toBe('dark');
    });

    it('should return light when system prefers light', () => {
      window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      expect(getSystemTheme()).toBe('light');
    });
  });

  describe('applyThemeToDocument', () => {
    it('should add dark class and color-scheme for dark theme', () => {
      applyThemeToDocument('dark');

      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.style.colorScheme).toBe('dark');
    });

    it('should remove dark class and set light color-scheme for light theme', () => {
      // First set dark
      document.documentElement.classList.add('dark');

      applyThemeToDocument('light');

      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(document.documentElement.style.colorScheme).toBe('light');
    });
  });

  describe('ThemeProvider', () => {
    it('should load theme from config on mount', async () => {
      const mockService = createMockService({ theme: 'light' });

      render(
        <ThemeProvider service={mockService}>
          <TestComponent />
        </ThemeProvider>
      );

      // Initially loading
      expect(screen.getByTestId('loading').textContent).toBe('true');

      // Wait for config to load
      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('theme').textContent).toBe('light');
      expect(mockService.getConfig).toHaveBeenCalled();
    });

    it('should default to dark theme on config load error', async () => {
      const mockService = createMockService();
      mockService.getConfig = vi.fn().mockRejectedValue(new Error('Failed'));

      render(
        <ThemeProvider service={mockService}>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('theme').textContent).toBe('dark');
    });

    it('should compute effective theme for system preference', async () => {
      const mockService = createMockService({ theme: 'system' });

      // System prefers dark
      window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      render(
        <ThemeProvider service={mockService}>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('theme').textContent).toBe('system');
      expect(screen.getByTestId('effective-theme').textContent).toBe('dark');
    });

    it('should apply dark class to document when theme is dark', async () => {
      const mockService = createMockService({ theme: 'dark' });

      render(
        <ThemeProvider service={mockService}>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });
    });

    it('should remove dark class from document when theme is light', async () => {
      const mockService = createMockService({ theme: 'light' });

      // Start with dark class
      document.documentElement.classList.add('dark');

      render(
        <ThemeProvider service={mockService}>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(false);
      });
    });
  });

  describe('System Theme Changes', () => {
    it('should update document theme when system theme changes', async () => {
      const mockService = createMockService({ theme: 'system' });

      // Track the event listener callback
      let changeCallback: (() => void) | null = null;

      window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: true, // Initially dark
        addEventListener: vi.fn((event, cb) => {
          if (event === 'change') {
            changeCallback = cb;
          }
        }),
        removeEventListener: vi.fn(),
      }));

      render(
        <ThemeProvider service={mockService}>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      // Should have registered the change listener
      expect(changeCallback).not.toBeNull();

      // Simulate system theme change by calling the callback
      // and updating what matchMedia returns
      window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: false, // Now light
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      // Trigger the change callback
      act(() => {
        changeCallback!();
      });

      // Document should update to light theme
      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(false);
      });
    });
  });

  describe('setTheme', () => {
    it('should update theme and persist to config', async () => {
      const mockService = createMockService({ theme: 'dark' });

      render(
        <ThemeProvider service={mockService}>
          <TestComponentWithSetTheme />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('theme').textContent).toBe('dark');
      });

      // Click to set light theme
      await act(async () => {
        screen.getByText('Set Light').click();
      });

      expect(screen.getByTestId('theme').textContent).toBe('light');
      expect(mockService.updateConfig).toHaveBeenCalledWith(
        expect.objectContaining({ theme: 'light' })
      );
    });

    it('should apply theme to document immediately', async () => {
      const mockService = createMockService({ theme: 'dark' });

      render(
        <ThemeProvider service={mockService}>
          <TestComponentWithSetTheme />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });

      // Click to set light theme
      await act(async () => {
        screen.getByText('Set Light').click();
      });

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should continue working even if persist fails', async () => {
      const mockService = createMockService({ theme: 'dark' });
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Make updateConfig fail
      mockService.updateConfig = vi.fn().mockRejectedValue(new Error('Persist failed'));

      render(
        <ThemeProvider service={mockService}>
          <TestComponentWithSetTheme />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('theme').textContent).toBe('dark');
      });

      // Click to set light theme (should still work even though persist fails)
      await act(async () => {
        screen.getByText('Set Light').click();
      });

      // UI should still update
      expect(screen.getByTestId('theme').textContent).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);

      // Error should have been logged
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });

  describe('useTheme hook', () => {
    it('should throw error when used outside provider', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useTheme must be used within a ThemeProvider');

      consoleError.mockRestore();
    });
  });
});
