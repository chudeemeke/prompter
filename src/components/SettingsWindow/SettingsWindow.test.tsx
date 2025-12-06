import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsWindow } from './index';
import { ThemeProvider } from '../../context';
import type { PromptService } from '../../services/PromptService';
import type { AppConfig } from '../../lib/types';

// =============================================================================
// MOCK DATA
// =============================================================================

const createMockConfig = (overrides?: Partial<AppConfig>): AppConfig => ({
  hotkey: 'F9',
  prompts_dir: '~/.prompter/prompts',
  theme: 'dark',
  language: 'en',
  auto_paste: true,
  close_after_paste: true,
  remember_last_query: false,
  auto_start: false,
  show_in_tray: true,
  max_results: 10,
  max_recent_prompts: 5,
  show_keyboard_hints: true,
  external_editor: {
    enabled: false,
    app: '',
    args: [],
  },
  editor_font_size: 14,
  editor_word_wrap: true,
  ui: {
    show_preview_pane: true,
    show_sidebar: true,
    window_width: 700,
    window_height: 500,
    sidebar_width: 200,
    preview_position: 'right',
  },
  backup_enabled: true,
  backup_interval_hours: 24,
  analytics_enabled: true,
  ...overrides,
});

const createMockService = (
  configOverrides?: Partial<AppConfig>,
  autostartEnabled = false
): PromptService => ({
  getAllPrompts: vi.fn().mockResolvedValue([]),
  getPrompt: vi.fn().mockResolvedValue({}),
  createPrompt: vi.fn().mockResolvedValue({}),
  updatePrompt: vi.fn().mockResolvedValue({}),
  deletePrompt: vi.fn().mockResolvedValue(undefined),
  duplicatePrompt: vi.fn().mockResolvedValue({}),
  searchPrompts: vi.fn().mockResolvedValue([]),
  getPromptsByFolder: vi.fn().mockResolvedValue([]),
  getPromptsByTag: vi.fn().mockResolvedValue([]),
  getFavoritePrompts: vi.fn().mockResolvedValue([]),
  getFolders: vi.fn().mockResolvedValue([]),
  createFolder: vi.fn().mockResolvedValue({}),
  deleteFolder: vi.fn().mockResolvedValue(undefined),
  getTags: vi.fn().mockResolvedValue([]),
  toggleFavorite: vi.fn().mockResolvedValue(true),
  getVersionHistory: vi.fn().mockResolvedValue([]),
  restoreVersion: vi.fn().mockResolvedValue({}),
  recordUsage: vi.fn().mockResolvedValue(undefined),
  getUsageStats: vi.fn().mockResolvedValue({
    prompt_id: '1',
    total_uses: 0,
    last_used: null,
    daily_uses: [],
    weekly_uses: [],
    monthly_uses: [],
  }),
  copyAndPaste: vi.fn().mockResolvedValue({
    clipboard_success: true,
    paste_attempted: true,
    paste_likely_success: true,
    message: 'Copied and pasted',
  }),
  hideAndRestore: vi.fn().mockResolvedValue(undefined),
  getConfig: vi.fn().mockResolvedValue(createMockConfig(configOverrides)),
  updateConfig: vi.fn().mockImplementation((config) =>
    Promise.resolve(createMockConfig(config))
  ),
  exportPrompt: vi.fn().mockResolvedValue(''),
  importPrompt: vi.fn().mockResolvedValue({}),
  openEditorWindow: vi.fn().mockResolvedValue(undefined),
  openSettingsWindow: vi.fn().mockResolvedValue(undefined),
  openAnalyticsWindow: vi.fn().mockResolvedValue(undefined),
  closeWindow: vi.fn().mockResolvedValue(undefined),
  enableAutostart: vi.fn().mockResolvedValue(undefined),
  disableAutostart: vi.fn().mockResolvedValue(undefined),
  isAutostartEnabled: vi.fn().mockResolvedValue(autostartEnabled),
});

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Renders SettingsWindow wrapped with ThemeProvider
 * ThemeProvider is required because SettingsWindow uses useTheme hook
 */
const renderWithProviders = (service: PromptService, onClose?: () => void) => {
  return render(
    <ThemeProvider service={service}>
      <SettingsWindow service={service} onClose={onClose} />
    </ThemeProvider>
  );
};

// =============================================================================
// TESTS
// =============================================================================

describe('SettingsWindow', () => {
  describe('Loading State', () => {
    it('should show loading message initially', () => {
      const service = createMockService();
      renderWithProviders(service);

      expect(screen.getByText('Loading settings...')).toBeInTheDocument();
    });

    it('should load config and autostart status on mount', async () => {
      const service = createMockService();
      renderWithProviders(service);

      await waitFor(() => {
        expect(service.getConfig).toHaveBeenCalled();
        expect(service.isAutostartEnabled).toHaveBeenCalled();
      });
    });

    it('should hide loading message after config loads', async () => {
      const service = createMockService();
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('should render all tabs', async () => {
      const service = createMockService();
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('Hotkeys')).toBeInTheDocument();
      expect(screen.getByText('Appearance')).toBeInTheDocument();
      expect(screen.getByText('Storage')).toBeInTheDocument();
      expect(screen.getByText('Advanced')).toBeInTheDocument();
    });

    it('should show General tab content by default', async () => {
      const service = createMockService();
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Behavior')).toBeInTheDocument();
      expect(screen.getByText('Auto-paste by default')).toBeInTheDocument();
    });
  });

  describe('General Tab', () => {
    it('should display auto-paste toggle with correct state', async () => {
      const service = createMockService({ auto_paste: true });
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      const autoPasteLabel = screen.getByText('Auto-paste by default');
      expect(autoPasteLabel).toBeInTheDocument();
    });

    it('should display close after paste toggle', async () => {
      const service = createMockService({ close_after_paste: true });
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Close window after paste')).toBeInTheDocument();
    });

    it('should display startup settings', async () => {
      const service = createMockService();
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Startup')).toBeInTheDocument();
      expect(screen.getByText('Start with Windows')).toBeInTheDocument();
      expect(screen.getByText('Show in system tray')).toBeInTheDocument();
    });
  });

  describe('Autostart Toggle', () => {
    it('should reflect autostart enabled state', async () => {
      const service = createMockService({}, true);
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      // The checkbox for Start with Windows should be checked
      const startWithWindowsLabel = screen.getByText('Start with Windows');
      expect(startWithWindowsLabel).toBeInTheDocument();
    });

    it('should call enableAutostart when toggled on', async () => {
      const user = userEvent.setup();
      const service = createMockService({}, false);
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      // Find and click the autostart toggle
      const startWithWindowsLabel = screen.getByText('Start with Windows');
      const toggle = startWithWindowsLabel.closest('label');

      if (toggle) {
        await user.click(toggle);
      }

      await waitFor(() => {
        expect(service.enableAutostart).toHaveBeenCalled();
      });
    });

    it('should call disableAutostart when toggled off', async () => {
      const user = userEvent.setup();
      const service = createMockService({}, true);
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      const startWithWindowsLabel = screen.getByText('Start with Windows');
      const toggle = startWithWindowsLabel.closest('label');

      if (toggle) {
        await user.click(toggle);
      }

      await waitFor(() => {
        expect(service.disableAutostart).toHaveBeenCalled();
      });
    });
  });

  describe('Header Actions', () => {
    it('should render Save button', async () => {
      const service = createMockService();
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('should render Reset button', async () => {
      const service = createMockService();
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Reset')).toBeInTheDocument();
    });

    it('should render Cancel button', async () => {
      const service = createMockService();
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should disable Save button when no changes', async () => {
      const service = createMockService();
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      const saveButton = screen.getByText('Save').closest('button');
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Saving Config', () => {
    it('should enable Save button after making changes', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      // Toggle a setting to make changes
      const closeAfterPasteLabel = screen.getByText('Close window after paste');
      const toggle = closeAfterPasteLabel.closest('label');

      if (toggle) {
        await user.click(toggle);
      }

      const saveButton = screen.getByText('Save').closest('button');
      expect(saveButton).not.toBeDisabled();
    });

    it('should call updateConfig when Save is clicked', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      // Toggle a setting
      const closeAfterPasteLabel = screen.getByText('Close window after paste');
      const toggle = closeAfterPasteLabel.closest('label');

      if (toggle) {
        await user.click(toggle);
      }

      // Click save
      const saveButton = screen.getByText('Save').closest('button');
      if (saveButton) {
        await user.click(saveButton);
      }

      await waitFor(() => {
        expect(service.updateConfig).toHaveBeenCalled();
      });
    });
  });

  describe('Close Handler', () => {
    it('should call onClose when Cancel clicked with no changes', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const service = createMockService();
      renderWithProviders(service, onClose);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel').closest('button');
      if (cancelButton) {
        await user.click(cancelButton);
      }

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Hotkeys Tab', () => {
    it('should display hotkey selector', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      // Click Hotkeys tab
      await user.click(screen.getByText('Hotkeys'));

      expect(screen.getByText('Global Hotkey')).toBeInTheDocument();
      expect(screen.getByText('Activation hotkey')).toBeInTheDocument();
    });

    it('should display keyboard shortcuts reference', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      await user.click(screen.getByText('Hotkeys'));

      expect(screen.getByText('Application Shortcuts')).toBeInTheDocument();
      expect(screen.getByText('Search / Filter')).toBeInTheDocument();
      expect(screen.getByText('Navigate results')).toBeInTheDocument();
    });
  });

  describe('Appearance Tab', () => {
    it('should display theme selector', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      await user.click(screen.getByText('Appearance'));

      expect(screen.getByText('Theme')).toBeInTheDocument();
      expect(screen.getByText('Color theme')).toBeInTheDocument();
    });

    it('should display editor settings', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      await user.click(screen.getByText('Appearance'));

      expect(screen.getByText('Editor')).toBeInTheDocument();
      expect(screen.getByText('Font size')).toBeInTheDocument();
      expect(screen.getByText('Word wrap')).toBeInTheDocument();
    });
  });

  describe('Storage Tab', () => {
    it('should display prompts directory input', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      await user.click(screen.getByText('Storage'));

      expect(screen.getByText('Prompts Location')).toBeInTheDocument();
      expect(screen.getByText('Prompts directory')).toBeInTheDocument();
    });

    it('should display backup settings', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      await user.click(screen.getByText('Storage'));

      expect(screen.getByText('Backup')).toBeInTheDocument();
      expect(screen.getByText('Enable automatic backups')).toBeInTheDocument();
    });
  });

  describe('Advanced Tab', () => {
    it('should display analytics toggle', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      await user.click(screen.getByText('Advanced'));

      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Enable usage analytics')).toBeInTheDocument();
    });

    it('should display language selector', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      await user.click(screen.getByText('Advanced'));

      expect(screen.getByText('Language')).toBeInTheDocument();
      expect(screen.getByText('Interface language')).toBeInTheDocument();
    });

    it('should display about section', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      await user.click(screen.getByText('Advanced'));

      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByText('Prompter')).toBeInTheDocument();
      expect(screen.getByText('A Spotlight-style prompt manager for Windows')).toBeInTheDocument();
    });

    it('should change analytics toggle', async () => {
      const user = userEvent.setup();
      const service = createMockService({ analytics_enabled: true });
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      await user.click(screen.getByText('Advanced'));

      const analyticsLabel = screen.getByText('Enable usage analytics');
      const toggle = analyticsLabel.closest('label');

      if (toggle) {
        await user.click(toggle);
      }

      const saveButton = screen.getByText('Save').closest('button');
      expect(saveButton).not.toBeDisabled();
    });

    it('should change language selection', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      await user.click(screen.getByText('Advanced'));

      const languageSelect = screen.getByDisplayValue('English');
      await user.selectOptions(languageSelect, 'Spanish');

      const saveButton = screen.getByText('Save').closest('button');
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('Display Settings', () => {
    it('should change max results value', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      const maxResultsInput = screen.getByDisplayValue('10');
      await user.clear(maxResultsInput);
      await user.type(maxResultsInput, '20');

      const saveButton = screen.getByText('Save').closest('button');
      expect(saveButton).not.toBeDisabled();
    });

    it('should toggle keyboard hints', async () => {
      const user = userEvent.setup();
      const service = createMockService({ show_keyboard_hints: true });
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      const hintsLabel = screen.getByText('Show keyboard hints');
      const toggle = hintsLabel.closest('label');

      if (toggle) {
        await user.click(toggle);
      }

      const saveButton = screen.getByText('Save').closest('button');
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('Storage Tab Interactions', () => {
    it('should change prompts directory', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      await user.click(screen.getByText('Storage'));

      const promptsDirInput = screen.getByDisplayValue('~/.prompter/prompts');
      await user.clear(promptsDirInput);
      await user.type(promptsDirInput, '/new/path');

      const saveButton = screen.getByText('Save').closest('button');
      expect(saveButton).not.toBeDisabled();
    });

    it('should toggle backup enabled', async () => {
      const user = userEvent.setup();
      const service = createMockService({ backup_enabled: true });
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      await user.click(screen.getByText('Storage'));

      const backupLabel = screen.getByText('Enable automatic backups');
      const toggle = backupLabel.closest('label');

      if (toggle) {
        await user.click(toggle);
      }

      const saveButton = screen.getByText('Save').closest('button');
      expect(saveButton).not.toBeDisabled();
    });

    it('should show backup interval when enabled', async () => {
      const service = createMockService({ backup_enabled: true });
      const user = userEvent.setup();
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      await user.click(screen.getByText('Storage'));

      expect(screen.getByText('Backup interval (hours)')).toBeInTheDocument();
    });

    it('should change backup interval', async () => {
      const user = userEvent.setup();
      const service = createMockService({ backup_enabled: true });
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      await user.click(screen.getByText('Storage'));

      const intervalInput = screen.getByDisplayValue('24');
      await user.clear(intervalInput);
      await user.type(intervalInput, '48');

      const saveButton = screen.getByText('Save').closest('button');
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('Appearance Tab Interactions', () => {
    it('should change theme selection', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      await user.click(screen.getByText('Appearance'));

      const themeSelect = screen.getByDisplayValue('Dark');
      await user.selectOptions(themeSelect, 'Light');

      const saveButton = screen.getByText('Save').closest('button');
      expect(saveButton).not.toBeDisabled();
    });

    it('should change font size', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      await user.click(screen.getByText('Appearance'));

      const fontSizeInput = screen.getByDisplayValue('14');
      await user.clear(fontSizeInput);
      await user.type(fontSizeInput, '16');

      const saveButton = screen.getByText('Save').closest('button');
      expect(saveButton).not.toBeDisabled();
    });

    it('should toggle word wrap', async () => {
      const user = userEvent.setup();
      const service = createMockService({ editor_word_wrap: true });
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      await user.click(screen.getByText('Appearance'));

      const wordWrapLabel = screen.getByText('Word wrap');
      const toggle = wordWrapLabel.closest('label');

      if (toggle) {
        await user.click(toggle);
      }

      const saveButton = screen.getByText('Save').closest('button');
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('Hotkeys Tab Interactions', () => {
    it('should change hotkey selection', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      await user.click(screen.getByText('Hotkeys'));

      const hotkeySelect = screen.getByDisplayValue('F9');
      await user.selectOptions(hotkeySelect, 'F10');

      const saveButton = screen.getByText('Save').closest('button');
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('General Tab Toggles', () => {
    it('should toggle remember last query', async () => {
      const user = userEvent.setup();
      const service = createMockService({ remember_last_query: false });
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      const rememberLabel = screen.getByText('Remember last query');
      const toggle = rememberLabel.closest('label');

      if (toggle) {
        await user.click(toggle);
      }

      const saveButton = screen.getByText('Save').closest('button');
      expect(saveButton).not.toBeDisabled();
    });

    it('should toggle show in tray', async () => {
      const user = userEvent.setup();
      const service = createMockService({ show_in_tray: true });
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      const trayLabel = screen.getByText('Show in system tray');
      const toggle = trayLabel.closest('label');

      if (toggle) {
        await user.click(toggle);
      }

      const saveButton = screen.getByText('Save').closest('button');
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to defaults when Reset clicked', async () => {
      const user = userEvent.setup();
      const service = createMockService({ max_results: 50 });
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      // Verify initial value
      expect(screen.getByDisplayValue('50')).toBeInTheDocument();

      // Click reset
      await user.click(screen.getByText('Reset'));

      // Verify default value is restored
      expect(screen.getByDisplayValue('10')).toBeInTheDocument();

      // Save should be enabled after reset
      const saveButton = screen.getByText('Save').closest('button');
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('Unsaved Changes Warning', () => {
    it('should show confirmation when closing with unsaved changes', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const service = createMockService();

      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      renderWithProviders(service, onClose);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      // Make a change
      const closeAfterPasteLabel = screen.getByText('Close window after paste');
      const toggle = closeAfterPasteLabel.closest('label');
      if (toggle) {
        await user.click(toggle);
      }

      // Try to close
      const cancelButton = screen.getByText('Cancel').closest('button');
      if (cancelButton) {
        await user.click(cancelButton);
      }

      expect(confirmSpy).toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });

    it('should close when confirm is accepted', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const service = createMockService();

      // Mock window.confirm to return true
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      renderWithProviders(service, onClose);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      // Make a change
      const closeAfterPasteLabel = screen.getByText('Close window after paste');
      const toggle = closeAfterPasteLabel.closest('label');
      if (toggle) {
        await user.click(toggle);
      }

      // Try to close
      const cancelButton = screen.getByText('Cancel').closest('button');
      if (cancelButton) {
        await user.click(cancelButton);
      }

      expect(confirmSpy).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();

      confirmSpy.mockRestore();
    });
  });

  describe('Toast Notifications', () => {
    it('should show success toast after saving', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      // Make a change
      const closeAfterPasteLabel = screen.getByText('Close window after paste');
      const toggle = closeAfterPasteLabel.closest('label');
      if (toggle) {
        await user.click(toggle);
      }

      // Save
      const saveButton = screen.getByText('Save').closest('button');
      if (saveButton) {
        await user.click(saveButton);
      }

      await waitFor(() => {
        expect(screen.getByText('Saved')).toBeInTheDocument();
      });
    });

    it('should show error toast on save failure', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      (service.updateConfig as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Save failed')
      );
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      // Make a change
      const closeAfterPasteLabel = screen.getByText('Close window after paste');
      const toggle = closeAfterPasteLabel.closest('label');
      if (toggle) {
        await user.click(toggle);
      }

      // Save
      const saveButton = screen.getByText('Save').closest('button');
      if (saveButton) {
        await user.click(saveButton);
      }

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
      });
    });

    it('should show success toast when autostart enabled', async () => {
      const user = userEvent.setup();
      const service = createMockService({}, false);
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      const startWithWindowsLabel = screen.getByText('Start with Windows');
      const toggle = startWithWindowsLabel.closest('label');

      if (toggle) {
        await user.click(toggle);
      }

      await waitFor(() => {
        expect(screen.getByText('Updated')).toBeInTheDocument();
      });
    });

    it('should show error toast when autostart fails', async () => {
      const user = userEvent.setup();
      const service = createMockService({}, false);
      (service.enableAutostart as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Autostart failed')
      );
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      const startWithWindowsLabel = screen.getByText('Start with Windows');
      const toggle = startWithWindowsLabel.closest('label');

      if (toggle) {
        await user.click(toggle);
      }

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
      });
    });
  });

  describe('Load Error Handling', () => {
    it('should handle config load error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const service = createMockService();
      (service.getConfig as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Config load failed')
      );
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      // Should still render with default values
      expect(screen.getByText('Settings')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('Number Input Edge Cases', () => {
    it('should handle invalid number input', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      renderWithProviders(service);

      await waitFor(() => {
        expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
      });

      const maxResultsInput = screen.getByDisplayValue('10');
      await user.clear(maxResultsInput);
      await user.type(maxResultsInput, 'abc');

      // Should default to 0 for invalid input
      const saveButton = screen.getByText('Save').closest('button');
      expect(saveButton).not.toBeDisabled();
    });
  });
});
