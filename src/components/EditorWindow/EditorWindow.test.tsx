import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditorWindow } from './index';
import type { PromptService } from '../../services/PromptService';
import type { Prompt, AppConfig } from '../../lib/types';
import { ThemeProvider } from '../../context';

// =============================================================================
// MOCK SETUP
// =============================================================================

const mockPrompt: Prompt = {
  id: 'test-prompt-1',
  name: 'Test Prompt',
  description: 'A test prompt for testing',
  content: 'Hello {{name}}, welcome to {{place}}!',
  folder: 'test-folder',
  icon: 'file-text',
  color: '#3B82F6',
  tags: ['test', 'example'],
  variables: [
    { name: 'name', default: 'World', required: true },
    { name: 'place', default: 'Prompter', required: false },
  ],
  auto_paste: true,
  is_favorite: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const defaultConfig: AppConfig = {
  hotkey: 'F9',
  prompts_dir: '~/.prompter/prompts',
  theme: 'dark',
  language: 'en',
  auto_paste: true,
  close_after_paste: true,
  remember_last_query: false,
  remember_last_edited_prompt: false,
  last_edited_prompt_id: undefined,
  auto_start: false,
  show_in_tray: true,
  max_results: 10,
  max_recent_prompts: 5,
  show_keyboard_hints: true,
  external_editor: { enabled: false, app: 'vscode', args: [] },
  editor_font_size: 14,
  editor_word_wrap: true,
  ui: {
    show_preview_pane: false,
    show_sidebar: true,
    window_width: 700,
    window_height: 500,
    sidebar_width: 250,
    preview_position: 'right',
  },
  backup_enabled: false,
  backup_interval_hours: 24,
  analytics_enabled: false,
};

function createMockService(overrides: Partial<PromptService> = {}): PromptService {
  return {
    getAllPrompts: vi.fn().mockResolvedValue([mockPrompt]),
    getPrompt: vi.fn().mockResolvedValue(mockPrompt),
    createPrompt: vi.fn().mockImplementation((input) =>
      Promise.resolve({ ...mockPrompt, ...input, id: 'new-prompt-id' })
    ),
    updatePrompt: vi.fn().mockImplementation((input) =>
      Promise.resolve({ ...mockPrompt, ...input })
    ),
    deletePrompt: vi.fn().mockResolvedValue(undefined),
    duplicatePrompt: vi.fn().mockResolvedValue({ ...mockPrompt, id: 'dup-id', name: 'Test Prompt (Copy)' }),
    searchPrompts: vi.fn().mockResolvedValue([]),
    getPromptsByFolder: vi.fn().mockResolvedValue([]),
    getPromptsByTag: vi.fn().mockResolvedValue([]),
    getFavoritePrompts: vi.fn().mockResolvedValue([]),
    getFolders: vi.fn().mockResolvedValue([
      { id: 'test-folder', name: 'Test Folder', prompt_count: 1, created_at: '2024-01-01' },
    ]),
    createFolder: vi.fn().mockResolvedValue({ id: 'new-folder', name: 'New', prompt_count: 0 }),
    deleteFolder: vi.fn().mockResolvedValue(undefined),
    getTags: vi.fn().mockResolvedValue([]),
    toggleFavorite: vi.fn().mockResolvedValue(true),
    getVersionHistory: vi.fn().mockResolvedValue([]),
    restoreVersion: vi.fn().mockResolvedValue(mockPrompt),
    recordUsage: vi.fn().mockResolvedValue(undefined),
    getUsageStats: vi.fn().mockResolvedValue({ prompt_id: 'test', total_uses: 0, last_used: null, daily_uses: [], weekly_uses: [], monthly_uses: [] }),
    copyAndPaste: vi.fn().mockResolvedValue({ clipboard_success: true, paste_attempted: true, paste_likely_success: true, message: 'Copied' }),
    hideAndRestore: vi.fn().mockResolvedValue(undefined),
    getConfig: vi.fn().mockResolvedValue(defaultConfig),
    updateConfig: vi.fn().mockResolvedValue(defaultConfig),
    exportPrompt: vi.fn().mockResolvedValue(''),
    importPrompt: vi.fn().mockResolvedValue(mockPrompt),
    openEditorWindow: vi.fn().mockResolvedValue(undefined),
    openSettingsWindow: vi.fn().mockResolvedValue(undefined),
    openAnalyticsWindow: vi.fn().mockResolvedValue(undefined),
    closeWindow: vi.fn().mockResolvedValue(undefined),
    enableAutostart: vi.fn().mockResolvedValue(undefined),
    disableAutostart: vi.fn().mockResolvedValue(undefined),
    isAutostartEnabled: vi.fn().mockResolvedValue(false),
    ...overrides,
  };
}

const renderWithProviders = (
  service: PromptService,
  props: Partial<Parameters<typeof EditorWindow>[0]> = {}
) => {
  return render(
    <ThemeProvider service={service}>
      <EditorWindow service={service} {...props} />
    </ThemeProvider>
  );
};

// =============================================================================
// TESTS
// =============================================================================

describe('EditorWindow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render in create mode by default', () => {
      const service = createMockService();
      renderWithProviders(service);

      expect(screen.getByText('New Prompt')).toBeInTheDocument();
      expect(screen.getByText('Create a new prompt template')).toBeInTheDocument();
    });

    it('should render header with title and action buttons', () => {
      const service = createMockService();
      renderWithProviders(service);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('should render tabs for Content, Variables, and Settings', () => {
      const service = createMockService();
      renderWithProviders(service);

      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.getByText('Variables')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should show Content tab by default', () => {
      const service = createMockService();
      renderWithProviders(service);

      expect(screen.getByPlaceholderText('Enter prompt name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Enter your prompt template/)).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    it('should load and display existing prompt', async () => {
      const service = createMockService();
      renderWithProviders(service, { promptId: 'test-prompt-1', mode: 'edit' });

      await waitFor(() => {
        expect(service.getPrompt).toHaveBeenCalledWith('test-prompt-1');
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Prompt')).toBeInTheDocument();
      });
    });

    it('should show Duplicate button in edit mode', async () => {
      const service = createMockService();
      renderWithProviders(service, { promptId: 'test-prompt-1', mode: 'edit' });

      await waitFor(() => {
        expect(screen.getByText('Duplicate')).toBeInTheDocument();
      });
    });

    it('should show "All changes saved" when not dirty', async () => {
      const service = createMockService();
      renderWithProviders(service, { promptId: 'test-prompt-1', mode: 'edit' });

      await waitFor(() => {
        expect(screen.getByText('All changes saved')).toBeInTheDocument();
      });
    });
  });

  describe('Content Tab', () => {
    it('should update name field', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      renderWithProviders(service);

      const nameInput = screen.getByPlaceholderText('Enter prompt name');
      await user.clear(nameInput);
      await user.type(nameInput, 'My New Prompt');

      expect(nameInput).toHaveValue('My New Prompt');
    });

    it('should update description field', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      renderWithProviders(service);

      const descInput = screen.getByPlaceholderText(/Brief description/);
      await user.type(descInput, 'A test description');

      expect(descInput).toHaveValue('A test description');
    });

    it('should update content field', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      renderWithProviders(service);

      const contentInput = screen.getByPlaceholderText(/Enter your prompt template/);
      // Use clear+type with simple text since userEvent interprets braces
      await user.type(contentInput, 'Hello world!');

      expect(contentInput).toHaveValue('Hello world!');
    });

    it('should show variable syntax hint', () => {
      const service = createMockService();
      renderWithProviders(service);

      expect(screen.getByText(/Use.*variable_name.*syntax/)).toBeInTheDocument();
    });
  });

  describe('Variables Tab', () => {
    it('should switch to Variables tab', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      renderWithProviders(service);

      await user.click(screen.getByText('Variables'));

      expect(screen.getByText('No variables defined')).toBeInTheDocument();
      expect(screen.getByText('Add Variable')).toBeInTheDocument();
    });

    it('should add new variable', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      renderWithProviders(service);

      await user.click(screen.getByText('Variables'));
      await user.click(screen.getByText('Add Variable'));

      expect(screen.getByPlaceholderText('e.g., language')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Optional default')).toBeInTheDocument();
    });

    it('should remove variable', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      renderWithProviders(service);

      await user.click(screen.getByText('Variables'));
      await user.click(screen.getByText('Add Variable'));

      expect(screen.getByPlaceholderText('e.g., language')).toBeInTheDocument();

      const removeButton = screen.getByLabelText('Remove variable');
      await user.click(removeButton);

      expect(screen.getByText('No variables defined')).toBeInTheDocument();
    });
  });

  describe('Settings Tab', () => {
    it('should switch to Settings tab', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      renderWithProviders(service);

      await user.click(screen.getByText('Settings'));

      expect(screen.getByText('Folder')).toBeInTheDocument();
      expect(screen.getByText('Auto-paste')).toBeInTheDocument();
    });

    it('should display folder selector', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      renderWithProviders(service);

      await user.click(screen.getByText('Settings'));

      expect(screen.getByText('No folder')).toBeInTheDocument();
    });

    it('should toggle auto-paste checkbox', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      renderWithProviders(service);

      await user.click(screen.getByText('Settings'));

      const checkbox = screen.getByRole('checkbox', { name: /auto-paste/i });
      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });
  });

  describe('Saving', () => {
    it('should disable Save button when no changes', () => {
      const service = createMockService();
      renderWithProviders(service);

      const saveButton = screen.getByText('Save').closest('button');
      // Button is disabled via disabled attribute or disabled class
      expect(saveButton).toHaveAttribute('disabled');
    });

    it('should enable Save button when changes made', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      renderWithProviders(service);

      const nameInput = screen.getByPlaceholderText('Enter prompt name');
      await user.type(nameInput, 'Test');

      const saveButton = screen.getByText('Save').closest('button');
      expect(saveButton).not.toBeDisabled();
    });

    it('should show validation error for empty name', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      renderWithProviders(service);

      // Type content but no name
      const contentInput = screen.getByPlaceholderText(/Enter your prompt template/);
      await user.type(contentInput, 'Some content');

      const saveButton = screen.getByText('Save').closest('button');
      await user.click(saveButton!);

      // Error message is shown via toast or inline error
      await waitFor(() => {
        // Check for error text in toast or error message
        expect(screen.queryByText(/Name is required/i) || screen.queryByText(/Validation Error/i)).toBeTruthy();
      });
    });

    it('should call createPrompt on successful save in create mode', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      renderWithProviders(service);

      const nameInput = screen.getByPlaceholderText('Enter prompt name');
      await user.type(nameInput, 'New Prompt');

      const contentInput = screen.getByPlaceholderText(/Enter your prompt template/);
      await user.type(contentInput, 'Hello world');

      const saveButton = screen.getByText('Save').closest('button');
      await user.click(saveButton!);

      await waitFor(() => {
        expect(service.createPrompt).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'New Prompt',
            content: 'Hello world',
          })
        );
      });
    });

    it('should show success toast after saving', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      renderWithProviders(service);

      const nameInput = screen.getByPlaceholderText('Enter prompt name');
      await user.type(nameInput, 'New Prompt');

      const contentInput = screen.getByPlaceholderText(/Enter your prompt template/);
      await user.type(contentInput, 'Hello world');

      const saveButton = screen.getByText('Save').closest('button');
      await user.click(saveButton!);

      await waitFor(() => {
        expect(screen.getByText('Saved')).toBeInTheDocument();
      });
    });
  });

  describe('Discard Dialog', () => {
    it('should show discard dialog when closing with unsaved changes', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      const onClose = vi.fn();
      renderWithProviders(service, { onClose });

      const nameInput = screen.getByPlaceholderText('Enter prompt name');
      await user.type(nameInput, 'Test');

      await user.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(screen.getByText('Discard changes?')).toBeInTheDocument();
      });
    });

    it('should close without dialog when no changes', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      const onClose = vi.fn();
      renderWithProviders(service, { onClose });

      await user.click(screen.getByText('Cancel'));

      expect(onClose).toHaveBeenCalled();
      expect(screen.queryByText('Discard changes?')).not.toBeInTheDocument();
    });

    it('should close when confirming discard', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      const onClose = vi.fn();
      renderWithProviders(service, { onClose });

      const nameInput = screen.getByPlaceholderText('Enter prompt name');
      await user.type(nameInput, 'Test');

      await user.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(screen.getByText('Discard changes?')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Discard'));

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Duplicate', () => {
    it('should duplicate prompt when clicking Duplicate', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      renderWithProviders(service, { promptId: 'test-prompt-1', mode: 'edit' });

      await waitFor(() => {
        expect(screen.getByText('Duplicate')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Duplicate'));

      await waitFor(() => {
        expect(service.duplicatePrompt).toHaveBeenCalledWith('test-prompt-1');
      });
    });

    it('should show success toast after duplicating', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      renderWithProviders(service, { promptId: 'test-prompt-1', mode: 'edit' });

      await waitFor(() => {
        expect(screen.getByText('Duplicate')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Duplicate'));

      await waitFor(() => {
        expect(screen.getByText('Duplicated')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error banner for general errors', async () => {
      const service = createMockService({
        getPrompt: vi.fn().mockRejectedValue(new Error('Failed to load')),
      });
      renderWithProviders(service, { promptId: 'invalid-id', mode: 'edit' });

      await waitFor(() => {
        expect(screen.getByText(/Failed to load prompt/)).toBeInTheDocument();
      });
    });

    it('should show error toast when save fails', async () => {
      const user = userEvent.setup();
      const service = createMockService({
        createPrompt: vi.fn().mockRejectedValue(new Error('Network error')),
      });
      renderWithProviders(service);

      const nameInput = screen.getByPlaceholderText('Enter prompt name');
      await user.type(nameInput, 'Test');

      const contentInput = screen.getByPlaceholderText(/Enter your prompt template/);
      await user.type(contentInput, 'Content');

      await user.click(screen.getByText('Save'));

      // Error could be shown as toast or banner
      await waitFor(() => {
        const errorMessages = screen.queryAllByText(/error|fail|network/i);
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible form labels', () => {
      const service = createMockService();
      renderWithProviders(service);

      // Labels are associated with inputs via htmlFor/id
      // The Input component creates IDs like "input-name", "input-description"
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Prompt Content')).toBeInTheDocument();

      // Verify labels have associated inputs
      const nameLabel = screen.getByText('Name').closest('label');
      const descLabel = screen.getByText('Description').closest('label');
      const contentLabel = screen.getByText('Prompt Content').closest('label');

      expect(nameLabel).toHaveAttribute('for', 'input-name');
      expect(descLabel).toHaveAttribute('for', 'input-description');
      expect(contentLabel).toHaveAttribute('for', 'textarea-prompt-content');
    });

    it('should have keyboard accessible tabs', async () => {
      const user = userEvent.setup();
      const service = createMockService();
      renderWithProviders(service);

      // Tab through and select Variables tab with keyboard
      const variablesTab = screen.getByText('Variables');
      variablesTab.focus();
      await user.keyboard('{Enter}');

      expect(screen.getByText('No variables defined')).toBeInTheDocument();
    });
  });
});
