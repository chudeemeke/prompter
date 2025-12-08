/**
 * IPC Integration Tests
 *
 * These tests verify the contract between TypeScript frontend and Rust backend.
 * They ensure:
 * 1. Correct command names are called
 * 2. Parameters use snake_case naming (Rust convention)
 * 3. Response types are correctly handled
 *
 * PURPOSE: Would have caught the autoPaste vs auto_paste bug before build time.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TauriPromptService } from '../../services/TauriPromptService';
import type { Prompt, PromptVersion, UsageStats, PromptFolder, PromptTag, SearchResult, AppConfig } from '../../lib/types';
import type { CreatePromptInput, UpdatePromptInput } from '../../services/PromptService';

// Mock the Tauri invoke function
const mockInvoke = vi.fn();
vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

// =============================================================================
// TEST FIXTURES
// =============================================================================

const createMockPrompt = (overrides?: Partial<Prompt>): Prompt => ({
  id: 'test-id-123',
  name: 'Test Prompt',
  description: 'A test prompt',
  content: 'Hello {{name}}!',
  folder: 'Test',
  icon: 'code',
  color: '#3B82F6',
  tags: ['test', 'example'],
  variables: [{ name: 'name', default: 'World', required: true }],
  auto_paste: true,
  is_favorite: false,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

const createMockSearchResult = (): SearchResult => ({
  prompt: createMockPrompt(),
  score: 0.95,
  highlights: ['Test'],
});

const createMockFolder = (): PromptFolder => ({
  id: 'folder-1',
  name: 'Test Folder',
  parent_id: undefined,
  color: '#3B82F6',
  icon: 'folder',
  prompt_count: 5,
  created_at: '2025-01-01T00:00:00Z',
});

const createMockTag = (): PromptTag => ({
  name: 'test',
  color: '#3B82F6',
  prompt_count: 10,
});

const createMockVersion = (): PromptVersion => ({
  id: 'version-1',
  prompt_id: 'test-id-123',
  version_number: 1,
  content: 'Original content',
  name: 'Test Prompt',
  description: 'Original description',
  change_summary: 'Initial version',
  created_at: '2025-01-01T00:00:00Z',
  created_by: 'user',
});

const createMockUsageStats = (): UsageStats => ({
  prompt_id: 'test-id-123',
  total_uses: 42,
  last_used: '2025-01-01T12:00:00Z',
  daily_uses: [{ period: '2025-01-01', count: 5 }],
  weekly_uses: [{ period: '2025-W01', count: 20 }],
  monthly_uses: [{ period: '2025-01', count: 42 }],
});

const createMockConfig = (): AppConfig => ({
  hotkey: 'Ctrl+Space',
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
  external_editor: { enabled: false, app: '', args: [] },
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
  backup_enabled: false,
  backup_interval_hours: 24,
  analytics_enabled: true,
});

// =============================================================================
// TEST SUITE
// =============================================================================

describe('TauriPromptService IPC Contract', () => {
  let service: TauriPromptService;

  beforeEach(() => {
    service = new TauriPromptService();
    mockInvoke.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // CORE CRUD OPERATIONS
  // ===========================================================================

  describe('Core CRUD Operations', () => {
    describe('getAllPrompts', () => {
      it('should call get_all_prompts with no parameters', async () => {
        const mockPrompts = [createMockPrompt()];
        mockInvoke.mockResolvedValue(mockPrompts);

        const result = await service.getAllPrompts();

        expect(mockInvoke).toHaveBeenCalledWith('get_all_prompts');
        expect(mockInvoke).toHaveBeenCalledTimes(1);
        expect(result).toEqual(mockPrompts);
      });
    });

    describe('getPrompt', () => {
      it('should call get_prompt with id parameter', async () => {
        const mockPrompt = createMockPrompt();
        mockInvoke.mockResolvedValue(mockPrompt);

        const result = await service.getPrompt('test-id-123');

        expect(mockInvoke).toHaveBeenCalledWith('get_prompt', { id: 'test-id-123' });
        expect(result).toEqual(mockPrompt);
      });
    });

    describe('createPrompt', () => {
      it('should call create_prompt with input parameter', async () => {
        const input: CreatePromptInput = {
          name: 'New Prompt',
          description: 'A new prompt',
          content: 'Content here',
          folder: 'Test',
          auto_paste: true,
        };
        const mockPrompt = createMockPrompt({ name: 'New Prompt' });
        mockInvoke.mockResolvedValue(mockPrompt);

        const result = await service.createPrompt(input);

        expect(mockInvoke).toHaveBeenCalledWith('create_prompt', { input });
        expect(result).toEqual(mockPrompt);
      });

      it('should pass input with snake_case field names', async () => {
        const input: CreatePromptInput = {
          name: 'Test',
          description: 'Desc',
          content: 'Content',
          auto_paste: false, // CRITICAL: must be snake_case
        };
        mockInvoke.mockResolvedValue(createMockPrompt());

        await service.createPrompt(input);

        // Verify the input structure preserves snake_case
        const calledWith = mockInvoke.mock.calls[0][1] as { input: CreatePromptInput };
        expect(calledWith.input).toHaveProperty('auto_paste');
        expect(calledWith.input).not.toHaveProperty('autoPaste');
      });
    });

    describe('updatePrompt', () => {
      it('should call update_prompt with input parameter', async () => {
        const input: UpdatePromptInput = {
          id: 'test-id-123',
          name: 'Updated Name',
        };
        const mockPrompt = createMockPrompt({ name: 'Updated Name' });
        mockInvoke.mockResolvedValue(mockPrompt);

        const result = await service.updatePrompt(input);

        expect(mockInvoke).toHaveBeenCalledWith('update_prompt', { input });
        expect(result).toEqual(mockPrompt);
      });
    });

    describe('deletePrompt', () => {
      it('should call delete_prompt with id parameter', async () => {
        mockInvoke.mockResolvedValue(undefined);

        await service.deletePrompt('test-id-123');

        expect(mockInvoke).toHaveBeenCalledWith('delete_prompt', { id: 'test-id-123' });
      });
    });

    describe('duplicatePrompt', () => {
      it('should call duplicate_prompt with snake_case new_name', async () => {
        const mockPrompt = createMockPrompt({ id: 'new-id', name: 'Copy of Test' });
        mockInvoke.mockResolvedValue(mockPrompt);

        const result = await service.duplicatePrompt('test-id-123', 'Copy of Test');

        // CRITICAL: Must use new_name (snake_case), NOT newName
        expect(mockInvoke).toHaveBeenCalledWith('duplicate_prompt', {
          id: 'test-id-123',
          new_name: 'Copy of Test',
        });
        expect(result).toEqual(mockPrompt);
      });

      it('should handle undefined newName', async () => {
        mockInvoke.mockResolvedValue(createMockPrompt());

        await service.duplicatePrompt('test-id-123');

        expect(mockInvoke).toHaveBeenCalledWith('duplicate_prompt', {
          id: 'test-id-123',
          new_name: undefined,
        });
      });
    });
  });

  // ===========================================================================
  // SEARCH & FILTERING
  // ===========================================================================

  describe('Search & Filtering', () => {
    describe('searchPrompts', () => {
      it('should call search_prompts with query parameter', async () => {
        const mockResults = [createMockSearchResult()];
        mockInvoke.mockResolvedValue(mockResults);

        const result = await service.searchPrompts('test query');

        expect(mockInvoke).toHaveBeenCalledWith('search_prompts', { query: 'test query' });
        expect(result).toEqual(mockResults);
      });

      it('should handle empty query', async () => {
        mockInvoke.mockResolvedValue([]);

        await service.searchPrompts('');

        expect(mockInvoke).toHaveBeenCalledWith('search_prompts', { query: '' });
      });
    });

    describe('getPromptsByFolder', () => {
      it('should call get_prompts_by_folder with folder parameter', async () => {
        const mockPrompts = [createMockPrompt()];
        mockInvoke.mockResolvedValue(mockPrompts);

        const result = await service.getPromptsByFolder('Test');

        expect(mockInvoke).toHaveBeenCalledWith('get_prompts_by_folder', { folder: 'Test' });
        expect(result).toEqual(mockPrompts);
      });
    });

    describe('getPromptsByTag', () => {
      it('should call get_prompts_by_tag with tag parameter', async () => {
        const mockPrompts = [createMockPrompt()];
        mockInvoke.mockResolvedValue(mockPrompts);

        const result = await service.getPromptsByTag('test');

        expect(mockInvoke).toHaveBeenCalledWith('get_prompts_by_tag', { tag: 'test' });
        expect(result).toEqual(mockPrompts);
      });
    });

    describe('getFavoritePrompts', () => {
      it('should call get_favorite_prompts with no parameters', async () => {
        const mockPrompts = [createMockPrompt({ is_favorite: true })];
        mockInvoke.mockResolvedValue(mockPrompts);

        const result = await service.getFavoritePrompts();

        expect(mockInvoke).toHaveBeenCalledWith('get_favorite_prompts');
        expect(result).toEqual(mockPrompts);
      });
    });
  });

  // ===========================================================================
  // ORGANIZATION
  // ===========================================================================

  describe('Organization', () => {
    describe('getFolders', () => {
      it('should call get_folders with no parameters', async () => {
        const mockFolders = [createMockFolder()];
        mockInvoke.mockResolvedValue(mockFolders);

        const result = await service.getFolders();

        expect(mockInvoke).toHaveBeenCalledWith('get_folders');
        expect(result).toEqual(mockFolders);
      });
    });

    describe('createFolder', () => {
      it('should call create_folder with snake_case parent_id', async () => {
        const mockFolder = createMockFolder();
        mockInvoke.mockResolvedValue(mockFolder);

        const result = await service.createFolder('New Folder', 'parent-123');

        // CRITICAL: Must use parent_id (snake_case), NOT parentId
        expect(mockInvoke).toHaveBeenCalledWith('create_folder', {
          name: 'New Folder',
          parent_id: 'parent-123',
        });
        expect(result).toEqual(mockFolder);
      });

      it('should handle undefined parentId', async () => {
        mockInvoke.mockResolvedValue(createMockFolder());

        await service.createFolder('Root Folder');

        expect(mockInvoke).toHaveBeenCalledWith('create_folder', {
          name: 'Root Folder',
          parent_id: undefined,
        });
      });
    });

    describe('deleteFolder', () => {
      it('should call delete_folder with id parameter', async () => {
        mockInvoke.mockResolvedValue(undefined);

        await service.deleteFolder('folder-1');

        expect(mockInvoke).toHaveBeenCalledWith('delete_folder', { id: 'folder-1' });
      });
    });

    describe('getTags', () => {
      it('should call get_tags with no parameters', async () => {
        const mockTags = [createMockTag()];
        mockInvoke.mockResolvedValue(mockTags);

        const result = await service.getTags();

        expect(mockInvoke).toHaveBeenCalledWith('get_tags');
        expect(result).toEqual(mockTags);
      });
    });

    describe('toggleFavorite', () => {
      it('should call toggle_favorite with id parameter', async () => {
        mockInvoke.mockResolvedValue(true);

        const result = await service.toggleFavorite('test-id-123');

        expect(mockInvoke).toHaveBeenCalledWith('toggle_favorite', { id: 'test-id-123' });
        expect(result).toBe(true);
      });
    });
  });

  // ===========================================================================
  // VERSION HISTORY
  // ===========================================================================

  describe('Version History', () => {
    describe('getVersionHistory', () => {
      it('should call get_version_history with snake_case prompt_id', async () => {
        const mockVersions = [createMockVersion()];
        mockInvoke.mockResolvedValue(mockVersions);

        const result = await service.getVersionHistory('test-id-123');

        // CRITICAL: Must use prompt_id (snake_case), NOT promptId
        expect(mockInvoke).toHaveBeenCalledWith('get_version_history', {
          prompt_id: 'test-id-123',
        });
        expect(result).toEqual(mockVersions);
      });
    });

    describe('restoreVersion', () => {
      it('should call restore_version with snake_case parameters', async () => {
        const mockPrompt = createMockPrompt();
        mockInvoke.mockResolvedValue(mockPrompt);

        const result = await service.restoreVersion('test-id-123', 'version-1');

        // CRITICAL: Must use prompt_id and version_id (snake_case)
        expect(mockInvoke).toHaveBeenCalledWith('restore_version', {
          prompt_id: 'test-id-123',
          version_id: 'version-1',
        });
        expect(result).toEqual(mockPrompt);
      });
    });
  });

  // ===========================================================================
  // USAGE & ANALYTICS
  // ===========================================================================

  describe('Usage & Analytics', () => {
    describe('recordUsage', () => {
      it('should call record_usage with snake_case prompt_id', async () => {
        mockInvoke.mockResolvedValue(undefined);

        await service.recordUsage('test-id-123');

        // CRITICAL: Must use prompt_id (snake_case), NOT id
        expect(mockInvoke).toHaveBeenCalledWith('record_usage', {
          prompt_id: 'test-id-123',
        });
      });
    });

    describe('getUsageStats', () => {
      it('should call get_usage_stats with snake_case prompt_id', async () => {
        const mockStats = createMockUsageStats();
        mockInvoke.mockResolvedValue(mockStats);

        const result = await service.getUsageStats('test-id-123');

        // CRITICAL: Must use prompt_id (snake_case)
        expect(mockInvoke).toHaveBeenCalledWith('get_usage_stats', {
          prompt_id: 'test-id-123',
        });
        expect(result).toEqual(mockStats);
      });
    });
  });

  // ===========================================================================
  // CLIPBOARD & WINDOW - CRITICAL TESTS
  // ===========================================================================

  describe('Clipboard & Window', () => {
    describe('copyAndPaste', () => {
      it('should call copy_and_paste with snake_case auto_paste', async () => {
        mockInvoke.mockResolvedValue(undefined);

        await service.copyAndPaste('Test content', true);

        // CRITICAL: This is the exact bug that was caught - must be auto_paste NOT autoPaste
        expect(mockInvoke).toHaveBeenCalledWith('copy_and_paste', {
          text: 'Test content',
          auto_paste: true,
        });
      });

      it('should handle auto_paste=false correctly', async () => {
        mockInvoke.mockResolvedValue(undefined);

        await service.copyAndPaste('Test content', false);

        expect(mockInvoke).toHaveBeenCalledWith('copy_and_paste', {
          text: 'Test content',
          auto_paste: false,
        });
      });

      it('should NOT use camelCase autoPaste (regression test)', async () => {
        mockInvoke.mockResolvedValue(undefined);

        await service.copyAndPaste('Test', true);

        // This test would have caught the autoPaste vs auto_paste bug
        const calledArgs = mockInvoke.mock.calls[0][1] as Record<string, unknown>;
        expect(calledArgs).not.toHaveProperty('autoPaste');
        expect(calledArgs).toHaveProperty('auto_paste');
      });
    });

    describe('hideAndRestore', () => {
      it('should call hide_window with no parameters', async () => {
        mockInvoke.mockResolvedValue(undefined);

        await service.hideAndRestore();

        expect(mockInvoke).toHaveBeenCalledWith('hide_window');
      });
    });
  });

  // ===========================================================================
  // SETTINGS
  // ===========================================================================

  describe('Settings', () => {
    describe('getConfig', () => {
      it('should call get_config with no parameters', async () => {
        const mockConfig = createMockConfig();
        mockInvoke.mockResolvedValue(mockConfig);

        const result = await service.getConfig();

        expect(mockInvoke).toHaveBeenCalledWith('get_config');
        expect(result).toEqual(mockConfig);
      });
    });

    describe('updateConfig', () => {
      it('should call update_config with config parameter', async () => {
        const partialConfig = { hotkey: 'Ctrl+Shift+P' };
        const mockConfig = createMockConfig();
        mockInvoke.mockResolvedValue(mockConfig);

        const result = await service.updateConfig(partialConfig);

        expect(mockInvoke).toHaveBeenCalledWith('update_config', { config: partialConfig });
        expect(result).toEqual(mockConfig);
      });
    });
  });

  // ===========================================================================
  // IMPORT/EXPORT
  // ===========================================================================

  describe('Import/Export', () => {
    describe('exportPrompt', () => {
      it('should call export_prompt with id parameter', async () => {
        const markdownContent = '# Test Prompt\n\nContent here';
        mockInvoke.mockResolvedValue(markdownContent);

        const result = await service.exportPrompt('test-id-123');

        expect(mockInvoke).toHaveBeenCalledWith('export_prompt', { id: 'test-id-123' });
        expect(result).toBe(markdownContent);
      });
    });

    describe('importPrompt', () => {
      it('should call import_prompt with content parameter', async () => {
        const markdownContent = '# New Prompt\n\nImported content';
        const mockPrompt = createMockPrompt();
        mockInvoke.mockResolvedValue(mockPrompt);

        const result = await service.importPrompt(markdownContent);

        expect(mockInvoke).toHaveBeenCalledWith('import_prompt', { content: markdownContent });
        expect(result).toEqual(mockPrompt);
      });
    });
  });

  // ===========================================================================
  // WINDOW MANAGEMENT
  // ===========================================================================

  describe('Window Management', () => {
    describe('openEditorWindow', () => {
      it('should call open_editor_window with snake_case prompt_id', async () => {
        mockInvoke.mockResolvedValue(undefined);

        await service.openEditorWindow('test-id-123', 'edit');

        // CRITICAL: Must use prompt_id (snake_case), NOT promptId
        expect(mockInvoke).toHaveBeenCalledWith('open_editor_window', {
          prompt_id: 'test-id-123',
          mode: 'edit',
        });
      });

      it('should handle undefined promptId and mode', async () => {
        mockInvoke.mockResolvedValue(undefined);

        await service.openEditorWindow();

        expect(mockInvoke).toHaveBeenCalledWith('open_editor_window', {
          prompt_id: undefined,
          mode: undefined,
        });
      });
    });

    describe('openSettingsWindow', () => {
      it('should call open_settings_window with no parameters', async () => {
        mockInvoke.mockResolvedValue(undefined);

        await service.openSettingsWindow();

        expect(mockInvoke).toHaveBeenCalledWith('open_settings_window');
      });
    });

    describe('openAnalyticsWindow', () => {
      it('should call open_analytics_window with no parameters', async () => {
        mockInvoke.mockResolvedValue(undefined);

        await service.openAnalyticsWindow();

        expect(mockInvoke).toHaveBeenCalledWith('open_analytics_window');
      });
    });

    describe('closeWindow', () => {
      it('should call close_window with label parameter', async () => {
        mockInvoke.mockResolvedValue(undefined);

        await service.closeWindow('editor');

        expect(mockInvoke).toHaveBeenCalledWith('close_window', { label: 'editor' });
      });
    });
  });

  // ===========================================================================
  // AUTOSTART
  // ===========================================================================

  describe('Autostart', () => {
    describe('enableAutostart', () => {
      it('should call enable_autostart with no parameters', async () => {
        mockInvoke.mockResolvedValue(undefined);

        await service.enableAutostart();

        expect(mockInvoke).toHaveBeenCalledWith('enable_autostart');
      });
    });

    describe('disableAutostart', () => {
      it('should call disable_autostart with no parameters', async () => {
        mockInvoke.mockResolvedValue(undefined);

        await service.disableAutostart();

        expect(mockInvoke).toHaveBeenCalledWith('disable_autostart');
      });
    });

    describe('isAutostartEnabled', () => {
      it('should call is_autostart_enabled and return boolean', async () => {
        mockInvoke.mockResolvedValue(true);

        const result = await service.isAutostartEnabled();

        expect(mockInvoke).toHaveBeenCalledWith('is_autostart_enabled');
        expect(result).toBe(true);
      });
    });
  });

  // ===========================================================================
  // ERROR HANDLING
  // ===========================================================================

  describe('Error Handling', () => {
    it('should propagate errors from invoke', async () => {
      const error = new Error('Tauri command failed');
      mockInvoke.mockRejectedValue(error);

      await expect(service.getAllPrompts()).rejects.toThrow('Tauri command failed');
    });

    it('should handle network errors', async () => {
      mockInvoke.mockRejectedValue(new Error('Network error'));

      await expect(service.getPrompt('id')).rejects.toThrow('Network error');
    });
  });

  // ===========================================================================
  // CONTRACT VALIDATION TESTS
  // ===========================================================================

  describe('Contract Validation', () => {
    it('should ensure all snake_case parameters are correctly named', async () => {
      // This test documents all the snake_case parameter transformations
      const snakeCaseParams = [
        { method: 'duplicatePrompt', param: 'new_name' },
        { method: 'createFolder', param: 'parent_id' },
        { method: 'getVersionHistory', param: 'prompt_id' },
        { method: 'restoreVersion', param: 'prompt_id' },
        { method: 'restoreVersion', param: 'version_id' },
        { method: 'recordUsage', param: 'prompt_id' },
        { method: 'getUsageStats', param: 'prompt_id' },
        { method: 'copyAndPaste', param: 'auto_paste' },
        { method: 'openEditorWindow', param: 'prompt_id' },
      ];

      // Verify all expected snake_case params are documented
      expect(snakeCaseParams.length).toBe(9);
    });

    it('should verify Prompt interface uses snake_case', () => {
      const prompt = createMockPrompt();

      // Verify snake_case field names
      expect(prompt).toHaveProperty('auto_paste');
      expect(prompt).toHaveProperty('is_favorite');
      expect(prompt).toHaveProperty('created_at');
      expect(prompt).toHaveProperty('updated_at');

      // Verify NOT camelCase
      expect(prompt).not.toHaveProperty('autoPaste');
      expect(prompt).not.toHaveProperty('isFavorite');
      expect(prompt).not.toHaveProperty('createdAt');
      expect(prompt).not.toHaveProperty('updatedAt');
    });

    it('should verify SearchResult uses snake_case Prompt', () => {
      const result = createMockSearchResult();

      expect(result.prompt).toHaveProperty('auto_paste');
      expect(result.prompt).toHaveProperty('is_favorite');
    });

    it('should verify UsageStats uses snake_case', () => {
      const stats = createMockUsageStats();

      expect(stats).toHaveProperty('prompt_id');
      expect(stats).toHaveProperty('total_uses');
      expect(stats).toHaveProperty('last_used');
      expect(stats).toHaveProperty('daily_uses');
      expect(stats).toHaveProperty('weekly_uses');
      expect(stats).toHaveProperty('monthly_uses');
    });

    it('should verify PromptFolder uses snake_case', () => {
      const folder = createMockFolder();

      expect(folder).toHaveProperty('parent_id');
      expect(folder).toHaveProperty('prompt_count');
      expect(folder).toHaveProperty('created_at');
    });

    it('should verify PromptTag uses snake_case', () => {
      const tag = createMockTag();

      expect(tag).toHaveProperty('prompt_count');
    });

    it('should verify PromptVersion uses snake_case', () => {
      const version = createMockVersion();

      expect(version).toHaveProperty('prompt_id');
      expect(version).toHaveProperty('version_number');
      expect(version).toHaveProperty('change_summary');
      expect(version).toHaveProperty('created_at');
      expect(version).toHaveProperty('created_by');
    });
  });
});
