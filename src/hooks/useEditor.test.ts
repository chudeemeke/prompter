import { renderHook, act, waitFor } from '@testing-library/react';
import { useEditor } from './useEditor';
import type { PromptService } from '../services/PromptService';
import type { Prompt, AppConfig } from '../lib/types';

// =============================================================================
// MOCK SETUP
// =============================================================================

const mockPrompt: Prompt = {
  id: 'test-prompt-1',
  name: 'Test Prompt',
  description: 'A test prompt',
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
    getFolders: vi.fn().mockResolvedValue([]),
    createFolder: vi.fn().mockResolvedValue({ id: 'new-folder', name: 'New', prompt_count: 0 }),
    deleteFolder: vi.fn().mockResolvedValue(undefined),
    getTags: vi.fn().mockResolvedValue([]),
    toggleFavorite: vi.fn().mockResolvedValue(true),
    getVersionHistory: vi.fn().mockResolvedValue([]),
    restoreVersion: vi.fn().mockResolvedValue(mockPrompt),
    recordUsage: vi.fn().mockResolvedValue(undefined),
    getUsageStats: vi.fn().mockResolvedValue({ prompt_id: 'test', total_uses: 0, last_used: null, daily_uses: [], weekly_uses: [], monthly_uses: [] }),
    copyAndPaste: vi.fn().mockResolvedValue({ clipboard_success: true, paste_attempted: true, paste_likely_success: true, message: 'Copied and pasted' }),
    hideAndRestore: vi.fn().mockResolvedValue(undefined),
    getConfig: vi.fn().mockResolvedValue({} as AppConfig),
    updateConfig: vi.fn().mockResolvedValue({} as AppConfig),
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

// =============================================================================
// TESTS
// =============================================================================

describe('useEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with create mode by default', () => {
      const service = createMockService();
      const { result } = renderHook(() => useEditor({ service }));

      expect(result.current.mode).toBe('create');
      expect(result.current.prompt).toBeNull();
      expect(result.current.isDirty).toBe(false);
      expect(result.current.isSaving).toBe(false);
      expect(result.current.activeTab).toBe('content');
    });

    it('should initialize with default draft values', () => {
      const service = createMockService();
      const { result } = renderHook(() => useEditor({ service }));

      expect(result.current.draft).toEqual({
        name: '',
        description: '',
        content: '',
        folder: '',
        icon: 'file-text',
        color: '#3B82F6',
        tags: [],
        variables: [],
        auto_paste: true,
      });
    });

    it('should initialize with edit mode when promptId provided', () => {
      const service = createMockService();
      const { result } = renderHook(() =>
        useEditor({ service, promptId: 'test-prompt-1', mode: 'edit' })
      );

      expect(result.current.mode).toBe('edit');
    });
  });

  describe('Loading Existing Prompt', () => {
    it('should load prompt data when promptId provided', async () => {
      const service = createMockService();
      const { result } = renderHook(() =>
        useEditor({ service, promptId: 'test-prompt-1', mode: 'edit' })
      );

      await waitFor(() => {
        expect(service.getPrompt).toHaveBeenCalledWith('test-prompt-1');
      });

      await waitFor(() => {
        expect(result.current.draft.name).toBe('Test Prompt');
        expect(result.current.draft.content).toBe('Hello {{name}}, welcome to {{place}}!');
        expect(result.current.draft.variables).toHaveLength(2);
      });
    });

    it('should set error when loading fails', async () => {
      const service = createMockService({
        getPrompt: vi.fn().mockRejectedValue(new Error('Not found')),
      });

      const { result } = renderHook(() =>
        useEditor({ service, promptId: 'invalid-id', mode: 'edit' })
      );

      await waitFor(() => {
        expect(result.current.errors).toHaveLength(1);
        expect(result.current.errors[0].field).toBe('general');
      });
    });

    it('should not load prompt in create mode', () => {
      const service = createMockService();
      renderHook(() => useEditor({ service, mode: 'create' }));

      expect(service.getPrompt).not.toHaveBeenCalled();
    });
  });

  describe('Updating Draft', () => {
    it('should update field and mark as dirty', () => {
      const service = createMockService();
      const { result } = renderHook(() => useEditor({ service }));

      act(() => {
        result.current.updateField('name', 'New Name');
      });

      expect(result.current.draft.name).toBe('New Name');
      expect(result.current.isDirty).toBe(true);
    });

    it('should update draft with partial updates', () => {
      const service = createMockService();
      const { result } = renderHook(() => useEditor({ service }));

      act(() => {
        result.current.updateDraft({ name: 'Test', description: 'Desc' });
      });

      expect(result.current.draft.name).toBe('Test');
      expect(result.current.draft.description).toBe('Desc');
    });

    it('should clear errors when draft is updated', async () => {
      const service = createMockService();
      const { result } = renderHook(() => useEditor({ service }));

      // Try to save with empty name to get error
      await act(async () => {
        await result.current.save();
      });

      expect(result.current.hasErrors).toBe(true);

      // Update name should clear errors
      act(() => {
        result.current.updateField('name', 'Valid Name');
      });

      expect(result.current.errors).toHaveLength(0);
    });
  });

  describe('Variable Management', () => {
    it('should add new variable', () => {
      const service = createMockService();
      const { result } = renderHook(() => useEditor({ service }));

      act(() => {
        result.current.addVariable();
      });

      expect(result.current.draft.variables).toHaveLength(1);
      expect(result.current.draft.variables[0]).toEqual({
        name: '',
        default: '',
        required: false,
      });
    });

    it('should update variable at index', () => {
      const service = createMockService();
      const { result } = renderHook(() => useEditor({ service }));

      act(() => {
        result.current.addVariable();
      });

      act(() => {
        result.current.updateVariable(0, { name: 'test_var', required: true });
      });

      expect(result.current.draft.variables[0].name).toBe('test_var');
      expect(result.current.draft.variables[0].required).toBe(true);
    });

    it('should remove variable at index', () => {
      const service = createMockService();
      const { result } = renderHook(() => useEditor({ service }));

      // Use updateDraft directly to set two variables atomically
      act(() => {
        result.current.updateDraft({
          variables: [
            { name: 'var1', default: '', required: false },
            { name: 'var2', default: '', required: false },
          ],
        });
      });

      expect(result.current.draft.variables).toHaveLength(2);

      act(() => {
        result.current.removeVariable(0);
      });

      expect(result.current.draft.variables).toHaveLength(1);
      expect(result.current.draft.variables[0].name).toBe('var2');
    });
  });

  describe('Validation', () => {
    it('should require name', async () => {
      const service = createMockService();
      const { result } = renderHook(() => useEditor({ service }));

      act(() => {
        result.current.updateField('content', 'Some content');
      });

      await act(async () => {
        await result.current.save();
      });

      expect(result.current.hasErrors).toBe(true);
      expect(result.current.getFieldError('name')).toBe('Name is required');
    });

    it('should require content', async () => {
      const service = createMockService();
      const { result } = renderHook(() => useEditor({ service }));

      act(() => {
        result.current.updateField('name', 'Test Name');
      });

      await act(async () => {
        await result.current.save();
      });

      expect(result.current.hasErrors).toBe(true);
      expect(result.current.getFieldError('content')).toBe('Content is required');
    });

    it('should validate name length', async () => {
      const service = createMockService();
      const { result } = renderHook(() => useEditor({ service }));

      act(() => {
        result.current.updateField('name', 'a'.repeat(101));
        result.current.updateField('content', 'Some content');
      });

      await act(async () => {
        await result.current.save();
      });

      expect(result.current.getFieldError('name')).toBe('Name must be 100 characters or less');
    });

    it('should validate duplicate variable names', async () => {
      const service = createMockService();
      const { result } = renderHook(() => useEditor({ service }));

      // Set up name and content first
      act(() => {
        result.current.updateField('name', 'Test');
        result.current.updateField('content', 'Content');
      });

      // Then set variables with duplicates using updateDraft for atomic update
      act(() => {
        result.current.updateDraft({
          variables: [
            { name: 'same_name', default: '', required: false },
            { name: 'same_name', default: '', required: false },
          ],
        });
      });

      await act(async () => {
        await result.current.save();
      });

      // Error message format is "Duplicate variable name: same_name"
      const errorMsg = result.current.getFieldError('variables');
      expect(errorMsg).toBeTruthy();
      expect(errorMsg).toMatch(/duplicate/i);
    });

    it('should validate empty variable names', async () => {
      const service = createMockService();
      const { result } = renderHook(() => useEditor({ service }));

      act(() => {
        result.current.updateField('name', 'Test');
        result.current.updateField('content', 'Content');
        result.current.addVariable();
      });

      await act(async () => {
        await result.current.save();
      });

      expect(result.current.getFieldError('variables')).toBe('Variable name is required');
    });
  });

  describe('Saving', () => {
    it('should create new prompt in create mode', async () => {
      const service = createMockService();
      const onSave = vi.fn();
      const { result } = renderHook(() =>
        useEditor({ service, mode: 'create', onSave })
      );

      act(() => {
        result.current.updateField('name', 'New Prompt');
        result.current.updateField('content', 'Hello world');
      });

      await act(async () => {
        const success = await result.current.save();
        expect(success).toBe(true);
      });

      expect(service.createPrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Prompt',
          content: 'Hello world',
        })
      );
      expect(onSave).toHaveBeenCalled();
    });

    it('should update existing prompt in edit mode', async () => {
      const service = createMockService();
      const { result } = renderHook(() =>
        useEditor({ service, promptId: 'test-prompt-1', mode: 'edit' })
      );

      await waitFor(() => {
        expect(result.current.draft.name).toBe('Test Prompt');
      });

      act(() => {
        result.current.updateField('name', 'Updated Name');
      });

      await act(async () => {
        await result.current.save();
      });

      expect(service.updatePrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-prompt-1',
          name: 'Updated Name',
        })
      );
    });

    it('should handle save errors', async () => {
      const service = createMockService({
        createPrompt: vi.fn().mockRejectedValue(new Error('Save failed')),
      });
      const { result } = renderHook(() => useEditor({ service }));

      act(() => {
        result.current.updateField('name', 'Test');
        result.current.updateField('content', 'Content');
      });

      await act(async () => {
        const success = await result.current.save();
        expect(success).toBe(false);
      });

      expect(result.current.getFieldError('general')).toContain('Save failed');
    });

    it('should set isSaving during save', async () => {
      let resolvePromise: (value: Prompt) => void;
      const service = createMockService({
        createPrompt: vi.fn().mockImplementation(() =>
          new Promise((resolve) => { resolvePromise = resolve; })
        ),
      });
      const { result } = renderHook(() => useEditor({ service }));

      act(() => {
        result.current.updateField('name', 'Test');
        result.current.updateField('content', 'Content');
      });

      // Start save without awaiting
      let savePromise: Promise<boolean>;
      act(() => {
        savePromise = result.current.save();
      });

      // Check isSaving is true
      expect(result.current.isSaving).toBe(true);

      // Resolve the save
      await act(async () => {
        resolvePromise!(mockPrompt);
        await savePromise!;
      });

      expect(result.current.isSaving).toBe(false);
    });

    it('should reset isDirty after successful save', async () => {
      const service = createMockService();
      const { result } = renderHook(() => useEditor({ service }));

      act(() => {
        result.current.updateField('name', 'Test');
        result.current.updateField('content', 'Content');
      });

      expect(result.current.isDirty).toBe(true);

      await act(async () => {
        await result.current.save();
      });

      expect(result.current.isDirty).toBe(false);
    });
  });

  describe('Discarding Changes', () => {
    it('should reset to original prompt in edit mode', async () => {
      const service = createMockService();
      const { result } = renderHook(() =>
        useEditor({ service, promptId: 'test-prompt-1', mode: 'edit' })
      );

      await waitFor(() => {
        expect(result.current.draft.name).toBe('Test Prompt');
      });

      act(() => {
        result.current.updateField('name', 'Changed Name');
      });

      expect(result.current.draft.name).toBe('Changed Name');

      act(() => {
        result.current.discard();
      });

      expect(result.current.draft.name).toBe('Test Prompt');
      expect(result.current.isDirty).toBe(false);
    });

    it('should reset to defaults in create mode', () => {
      const service = createMockService();
      const { result } = renderHook(() => useEditor({ service }));

      act(() => {
        result.current.updateField('name', 'Test');
        result.current.updateField('content', 'Content');
      });

      act(() => {
        result.current.discard();
      });

      expect(result.current.draft.name).toBe('');
      expect(result.current.draft.content).toBe('');
    });
  });

  describe('Tab Management', () => {
    it('should change active tab', () => {
      const service = createMockService();
      const { result } = renderHook(() => useEditor({ service }));

      expect(result.current.activeTab).toBe('content');

      act(() => {
        result.current.setActiveTab('variables');
      });

      expect(result.current.activeTab).toBe('variables');

      act(() => {
        result.current.setActiveTab('metadata');
      });

      expect(result.current.activeTab).toBe('metadata');
    });
  });

  describe('Computed Properties', () => {
    it('should compute hasErrors correctly', () => {
      const service = createMockService();
      const { result } = renderHook(() => useEditor({ service }));

      expect(result.current.hasErrors).toBe(false);
    });

    it('should compute canSave correctly', async () => {
      const service = createMockService();
      const { result } = renderHook(() => useEditor({ service }));

      // Not dirty - can't save
      expect(result.current.canSave).toBe(false);

      act(() => {
        result.current.updateField('name', 'Test');
      });

      // Now dirty - can save
      expect(result.current.canSave).toBe(true);
    });

    it('should return field error correctly', async () => {
      const service = createMockService();
      const { result } = renderHook(() => useEditor({ service }));

      await act(async () => {
        await result.current.save();
      });

      expect(result.current.getFieldError('name')).toBe('Name is required');
      expect(result.current.getFieldError('nonexistent')).toBeUndefined();
    });
  });

  describe('Close Handler', () => {
    it('should call onClose when not dirty', () => {
      const service = createMockService();
      const onClose = vi.fn();
      const { result } = renderHook(() => useEditor({ service, onClose }));

      const closed = result.current.close();

      expect(closed).toBe(true);
      expect(onClose).toHaveBeenCalled();
    });

    it('should return false when dirty', () => {
      const service = createMockService();
      const onClose = vi.fn();
      const { result } = renderHook(() => useEditor({ service, onClose }));

      act(() => {
        result.current.updateField('name', 'Changed');
      });

      const closed = result.current.close();

      expect(closed).toBe(false);
      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
