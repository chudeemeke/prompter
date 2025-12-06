import { renderHook, act, waitFor } from '@testing-library/react';
import React, { ReactNode } from 'react';
import { useSpotlightState } from './useSpotlightState';
import type { Prompt } from '../lib/types';
import type { PromptService } from '../services/PromptService';
import { ToastProvider } from '../context';

const createMockPrompt = (id: string, overrides?: Partial<Prompt>): Prompt => ({
  id,
  name: `Test Prompt ${id}`,
  description: 'Test description',
  content: 'Test content with {{variable}}',
  folder: 'Test',
  icon: '📝',
  color: '#3B82F6',
  tags: ['test'],
  variables: [],
  auto_paste: true,
  is_favorite: false,
  created_at: '2025-11-30T10:00:00Z',
  updated_at: '2025-11-30T10:00:00Z',
  ...overrides,
});

const createMockService = (): PromptService => ({
  getAllPrompts: vi.fn().mockResolvedValue([]),
  getPrompt: vi.fn().mockResolvedValue(createMockPrompt('1')),
  createPrompt: vi.fn().mockResolvedValue(createMockPrompt('new')),
  updatePrompt: vi.fn().mockResolvedValue(createMockPrompt('1')),
  deletePrompt: vi.fn().mockResolvedValue(undefined),
  duplicatePrompt: vi.fn().mockResolvedValue(createMockPrompt('dup')),
  searchPrompts: vi.fn().mockResolvedValue([]),
  getPromptsByFolder: vi.fn().mockResolvedValue([]),
  getPromptsByTag: vi.fn().mockResolvedValue([]),
  getFavoritePrompts: vi.fn().mockResolvedValue([]),
  getFolders: vi.fn().mockResolvedValue([]),
  createFolder: vi.fn().mockResolvedValue({ id: 'f1', name: 'Test', parent_id: undefined }),
  deleteFolder: vi.fn().mockResolvedValue(undefined),
  getTags: vi.fn().mockResolvedValue([]),
  toggleFavorite: vi.fn().mockResolvedValue(true),
  getVersionHistory: vi.fn().mockResolvedValue([]),
  restoreVersion: vi.fn().mockResolvedValue(createMockPrompt('1')),
  recordUsage: vi.fn().mockResolvedValue(undefined),
  getUsageStats: vi.fn().mockResolvedValue({ prompt_id: '1', total_uses: 0, last_used: null, daily_uses: [], weekly_uses: [], monthly_uses: [] }),
  copyAndPaste: vi.fn().mockResolvedValue({
    clipboard_success: true,
    paste_attempted: true,
    paste_likely_success: true,
    message: 'Copied and pasted',
  }),
  hideAndRestore: vi.fn().mockResolvedValue(undefined),
  getConfig: vi.fn().mockResolvedValue({ hotkey: 'Ctrl+Space', theme: 'dark', auto_paste_default: true, show_in_tray: true }),
  updateConfig: vi.fn().mockResolvedValue({ hotkey: 'Ctrl+Space', theme: 'dark', auto_paste_default: true, show_in_tray: true }),
  exportPrompt: vi.fn().mockResolvedValue(''),
  importPrompt: vi.fn().mockResolvedValue(createMockPrompt('imported')),
  openEditorWindow: vi.fn().mockResolvedValue(undefined),
  openSettingsWindow: vi.fn().mockResolvedValue(undefined),
  openAnalyticsWindow: vi.fn().mockResolvedValue(undefined),
  closeWindow: vi.fn().mockResolvedValue(undefined),
  enableAutostart: vi.fn().mockResolvedValue(undefined),
  disableAutostart: vi.fn().mockResolvedValue(undefined),
  isAutostartEnabled: vi.fn().mockResolvedValue(false),
});

describe('useSpotlightState', () => {
  describe('Initial State', () => {
    it('should initialize with empty query', () => {
      const service = createMockService();
      const { result } = renderHook(() => useSpotlightState(service));

      expect(result.current.query).toBe('');
    });

    it('should initialize with selected_index of 0', () => {
      const service = createMockService();
      const { result } = renderHook(() => useSpotlightState(service));

      expect(result.current.selected_index).toBe(0);
    });

    it('should initialize with showContextModal false', () => {
      const service = createMockService();
      const { result } = renderHook(() => useSpotlightState(service));

      expect(result.current.showContextModal).toBe(false);
    });

    it('should initialize with selected_prompt null', () => {
      const service = createMockService();
      const { result } = renderHook(() => useSpotlightState(service));

      expect(result.current.selected_prompt).toBeNull();
    });
  });

  describe('Query Management', () => {
    it('should update query via setQuery', () => {
      const service = createMockService();
      const { result } = renderHook(() => useSpotlightState(service));

      act(() => {
        result.current.setQuery('test query');
      });

      expect(result.current.query).toBe('test query');
    });

    it('should allow clearing query', () => {
      const service = createMockService();
      const { result } = renderHook(() => useSpotlightState(service));

      act(() => {
        result.current.setQuery('test');
      });
      act(() => {
        result.current.setQuery('');
      });

      expect(result.current.query).toBe('');
    });
  });

  describe('Selection Management', () => {
    it('should update selected_index via setSelectedIndex', () => {
      const service = createMockService();
      const { result } = renderHook(() => useSpotlightState(service));

      act(() => {
        result.current.setSelectedIndex(5);
      });

      expect(result.current.selected_index).toBe(5);
    });

    it('should allow setting selected_index to 0', () => {
      const service = createMockService();
      const { result } = renderHook(() => useSpotlightState(service));

      act(() => {
        result.current.setSelectedIndex(5);
      });
      act(() => {
        result.current.setSelectedIndex(0);
      });

      expect(result.current.selected_index).toBe(0);
    });
  });

  describe('Move Selection', () => {
    it('should move selection down', () => {
      const service = createMockService();
      const { result } = renderHook(() => useSpotlightState(service));

      act(() => {
        result.current.moveSelection('down', 10);
      });

      expect(result.current.selected_index).toBe(1);
    });

    it('should move selection up', () => {
      const service = createMockService();
      const { result } = renderHook(() => useSpotlightState(service));

      act(() => {
        result.current.setSelectedIndex(5);
      });
      act(() => {
        result.current.moveSelection('up', 10);
      });

      expect(result.current.selected_index).toBe(4);
    });

    it('should wrap to end when moving up from 0', () => {
      const service = createMockService();
      const { result } = renderHook(() => useSpotlightState(service));

      act(() => {
        result.current.moveSelection('up', 10);
      });

      expect(result.current.selected_index).toBe(10);
    });

    it('should wrap to 0 when moving down from max', () => {
      const service = createMockService();
      const { result } = renderHook(() => useSpotlightState(service));

      act(() => {
        result.current.setSelectedIndex(10);
      });
      act(() => {
        result.current.moveSelection('down', 10);
      });

      expect(result.current.selected_index).toBe(0);
    });
  });

  describe('Prompt Selection', () => {
    it('should show context modal for prompt with variables', () => {
      const service = createMockService();
      const { result } = renderHook(() => useSpotlightState(service));

      const prompt = createMockPrompt('1', {
        variables: [{ name: 'variable', default: 'value', required: true }],
      });

      act(() => {
        result.current.selectPrompt(prompt);
      });

      expect(result.current.showContextModal).toBe(true);
      expect(result.current.selected_prompt).toBe(prompt);
    });

    it('should not show context modal for prompt without variables', async () => {
      const service = createMockService();
      const { result } = renderHook(() => useSpotlightState(service));

      const prompt = createMockPrompt('1', { variables: [] });

      act(() => {
        result.current.selectPrompt(prompt);
      });

      await waitFor(() => {
        expect(service.recordUsage).toHaveBeenCalledWith('1');
      });
      expect(result.current.showContextModal).toBe(false);
    });

    it('should handle prompt with empty variables array', async () => {
      const service = createMockService();
      const { result } = renderHook(() => useSpotlightState(service));

      const prompt = createMockPrompt('1', { variables: [] });

      act(() => {
        result.current.selectPrompt(prompt);
      });

      await waitFor(() => {
        expect(service.copyAndPaste).toHaveBeenCalled();
      });
    });
  });

  describe('Prompt Selection with Variables', () => {
    it('should substitute variables in content', async () => {
      const service = createMockService();
      const { result } = renderHook(() => useSpotlightState(service));

      const prompt = createMockPrompt('1', {
        content: 'Hello {{name}}, welcome to {{place}}!',
      });

      await act(async () => {
        await result.current.handlePromptSelection(prompt, {
          name: 'Alice',
          place: 'Wonderland',
        });
      });

      expect(service.copyAndPaste).toHaveBeenCalledWith(
        'Hello Alice, welcome to Wonderland!',
        true
      );
    });

    it('should handle multiple occurrences of same variable', async () => {
      const service = createMockService();
      const { result } = renderHook(() => useSpotlightState(service));

      const prompt = createMockPrompt('1', {
        content: '{{greeting}} {{name}}, {{greeting}} again {{name}}!',
      });

      await act(async () => {
        await result.current.handlePromptSelection(prompt, {
          greeting: 'Hello',
          name: 'Bob',
        });
      });

      expect(service.copyAndPaste).toHaveBeenCalledWith(
        'Hello Bob, Hello again Bob!',
        true
      );
    });

    it('should record usage after substitution', async () => {
      const service = createMockService();
      const { result } = renderHook(() => useSpotlightState(service));

      const prompt = createMockPrompt('test-id', { content: 'Test' });

      await act(async () => {
        await result.current.handlePromptSelection(prompt, {});
      });

      expect(service.recordUsage).toHaveBeenCalledWith('test-id');
    });

    it('should respect auto_paste setting', async () => {
      const service = createMockService();
      const { result } = renderHook(() => useSpotlightState(service));

      const prompt = createMockPrompt('1', {
        content: 'Test content',
        auto_paste: false,
      });

      await act(async () => {
        await result.current.handlePromptSelection(prompt, {});
      });

      expect(service.copyAndPaste).toHaveBeenCalledWith('Test content', false);
    });

    it('should close modal after selection', async () => {
      const service = createMockService();
      const { result } = renderHook(() => useSpotlightState(service));

      // Open modal by selecting a prompt with variables
      const promptWithVars = createMockPrompt('1', {
        variables: [{ name: 'var', default: 'val', required: true }],
      });

      act(() => {
        result.current.selectPrompt(promptWithVars);
      });

      // Modal should be open with prompt selected
      expect(result.current.showContextModal).toBe(true);
      expect(result.current.selected_prompt).toBe(promptWithVars);

      // Handle selection
      await act(async () => {
        await result.current.handlePromptSelection(promptWithVars, { var: 'value' });
      });

      // Modal should be closed and prompt cleared
      expect(result.current.showContextModal).toBe(false);
      expect(result.current.selected_prompt).toBeNull();
    });

    it('should escape regex special characters in variable names', async () => {
      const service = createMockService();
      const { result } = renderHook(() => useSpotlightState(service));

      // Variable name with regex special characters
      const prompt = createMockPrompt('1', {
        content: 'Hello {{name.*+?^${}()|[]\\test}}!',
      });

      await act(async () => {
        await result.current.handlePromptSelection(prompt, {
          'name.*+?^${}()|[]\\test': 'Safe Value',
        });
      });

      // Should properly substitute without regex injection
      expect(service.copyAndPaste).toHaveBeenCalledWith(
        'Hello Safe Value!',
        true
      );
    });
  });

  describe('Window Management', () => {
    it('should call hideAndRestore when closing window', async () => {
      const service = createMockService();
      const { result } = renderHook(() => useSpotlightState(service));

      await act(async () => {
        await result.current.closeWindow();
      });

      expect(service.hideAndRestore).toHaveBeenCalled();
    });
  });

  describe('Modal Control', () => {
    it('should allow manually setting showContextModal', () => {
      const service = createMockService();
      const { result } = renderHook(() => useSpotlightState(service));

      act(() => {
        result.current.setShowContextModal(true);
      });

      expect(result.current.showContextModal).toBe(true);
    });

    it('should allow manually closing modal', () => {
      const service = createMockService();
      const { result } = renderHook(() => useSpotlightState(service));

      act(() => {
        result.current.setShowContextModal(true);
      });
      act(() => {
        result.current.setShowContextModal(false);
      });

      expect(result.current.showContextModal).toBe(false);
    });
  });

  describe('Function Stability', () => {
    it('should maintain stable selectPrompt reference', () => {
      const service = createMockService();
      const { result, rerender } = renderHook(() => useSpotlightState(service));

      const initialSelectPrompt = result.current.selectPrompt;
      rerender();

      expect(result.current.selectPrompt).toBe(initialSelectPrompt);
    });

    it('should maintain stable handlePromptSelection reference', () => {
      const service = createMockService();
      const { result, rerender } = renderHook(() => useSpotlightState(service));

      const initial = result.current.handlePromptSelection;
      rerender();

      expect(result.current.handlePromptSelection).toBe(initial);
    });

    it('should maintain stable closeWindow reference', () => {
      const service = createMockService();
      const { result, rerender } = renderHook(() => useSpotlightState(service));

      const initial = result.current.closeWindow;
      rerender();

      expect(result.current.closeWindow).toBe(initial);
    });

    it('should maintain stable moveSelection reference', () => {
      const service = createMockService();
      const { result, rerender } = renderHook(() => useSpotlightState(service));

      const initial = result.current.moveSelection;
      rerender();

      expect(result.current.moveSelection).toBe(initial);
    });
  });

  describe('Edge Cases', () => {
    it('should handle prompt with no variables property', async () => {
      const service = createMockService();
      const { result } = renderHook(() => useSpotlightState(service));

      const prompt = createMockPrompt('1');
      delete (prompt as any).variables;

      await act(async () => {
        await result.current.selectPrompt(prompt);
      });

      await waitFor(() => {
        expect(service.copyAndPaste).toHaveBeenCalled();
      });
    });

    it('should handle content with no variables', async () => {
      const service = createMockService();
      const { result } = renderHook(() => useSpotlightState(service));

      const prompt = createMockPrompt('1', {
        content: 'Plain text with no variables',
      });

      await act(async () => {
        await result.current.handlePromptSelection(prompt, {});
      });

      expect(service.copyAndPaste).toHaveBeenCalledWith(
        'Plain text with no variables',
        true
      );
    });

    it('should handle empty variables object', async () => {
      const service = createMockService();
      const { result } = renderHook(() => useSpotlightState(service));

      const prompt = createMockPrompt('1', {
        content: 'Test {{variable}}',
      });

      await act(async () => {
        await result.current.handlePromptSelection(prompt, {});
      });

      expect(service.copyAndPaste).toHaveBeenCalledWith('Test {{variable}}', true);
    });
  });

  describe('Toast Notifications', () => {
    // Wrapper to provide toast context for tests
    const wrapper = ({ children }: { children: ReactNode }) =>
      React.createElement(ToastProvider, null, children);

    it('should work without toast provider (safe mode)', async () => {
      const service = createMockService();
      service.copyAndPaste = vi.fn().mockResolvedValue({
        clipboard_success: true,
        paste_attempted: true,
        paste_likely_success: true,
        message: 'Copied and pasted',
      });
      const { result } = renderHook(() => useSpotlightState(service));

      const prompt = createMockPrompt('1', { content: 'Test' });

      // Should not throw even without toast provider
      await act(async () => {
        await result.current.handlePromptSelection(prompt, {});
      });

      expect(service.copyAndPaste).toHaveBeenCalled();
    });

    it('should show error toast when clipboard fails', async () => {
      const service = createMockService();
      service.copyAndPaste = vi.fn().mockResolvedValue({
        clipboard_success: false,
        paste_attempted: false,
        paste_likely_success: false,
        message: 'Clipboard failed',
      });
      const { result } = renderHook(() => useSpotlightState(service), { wrapper });

      const prompt = createMockPrompt('1', { content: 'Test' });

      await act(async () => {
        await result.current.handlePromptSelection(prompt, {});
      });

      // Modal should be closed and service should have been called
      expect(result.current.showContextModal).toBe(false);
      expect(service.copyAndPaste).toHaveBeenCalled();
    });

    it('should show success toast when paste likely succeeded', async () => {
      const service = createMockService();
      service.copyAndPaste = vi.fn().mockResolvedValue({
        clipboard_success: true,
        paste_attempted: true,
        paste_likely_success: true,
        message: 'Copied and pasted',
      });
      const { result } = renderHook(() => useSpotlightState(service), { wrapper });

      const prompt = createMockPrompt('1', { content: 'Test' });

      await act(async () => {
        await result.current.handlePromptSelection(prompt, {});
      });

      expect(result.current.showContextModal).toBe(false);
      expect(service.copyAndPaste).toHaveBeenCalled();
    });

    it('should show info toast when paste was attempted but uncertain', async () => {
      const service = createMockService();
      service.copyAndPaste = vi.fn().mockResolvedValue({
        clipboard_success: true,
        paste_attempted: true,
        paste_likely_success: false,
        message: 'Copied but paste uncertain',
      });
      const { result } = renderHook(() => useSpotlightState(service), { wrapper });

      const prompt = createMockPrompt('1', { content: 'Test' });

      await act(async () => {
        await result.current.handlePromptSelection(prompt, {});
      });

      expect(result.current.showContextModal).toBe(false);
      expect(service.copyAndPaste).toHaveBeenCalled();
    });

    it('should show success toast when auto-paste is disabled', async () => {
      const service = createMockService();
      service.copyAndPaste = vi.fn().mockResolvedValue({
        clipboard_success: true,
        paste_attempted: false,
        paste_likely_success: false,
        message: 'Copied to clipboard',
      });
      const { result } = renderHook(() => useSpotlightState(service), { wrapper });

      const prompt = createMockPrompt('1', { content: 'Test', auto_paste: false });

      await act(async () => {
        await result.current.handlePromptSelection(prompt, {});
      });

      expect(result.current.showContextModal).toBe(false);
      expect(service.copyAndPaste).toHaveBeenCalledWith('Test', false);
    });

    it('should close modal on error and not throw', async () => {
      const service = createMockService();
      service.copyAndPaste = vi.fn().mockRejectedValue(new Error('Paste failed'));

      const { result } = renderHook(() => useSpotlightState(service), { wrapper });

      const prompt = createMockPrompt('1', {
        variables: [{ name: 'var', default: 'val', required: true }],
      });

      // Open modal
      act(() => {
        result.current.selectPrompt(prompt);
      });
      expect(result.current.showContextModal).toBe(true);

      // Handle selection that fails - should not throw
      await act(async () => {
        await result.current.handlePromptSelection(prompt, { var: 'value' });
      });

      // Modal should be closed even after error
      expect(result.current.showContextModal).toBe(false);
      expect(result.current.selected_prompt).toBeNull();
    });

    it('should work with toast provider on success', async () => {
      const service = createMockService();
      const { result } = renderHook(() => useSpotlightState(service), { wrapper });

      const prompt = createMockPrompt('1', {
        name: 'Test Prompt',
        content: 'Test content',
        auto_paste: true,
      });

      await act(async () => {
        await result.current.handlePromptSelection(prompt, {});
      });

      // Service calls should succeed
      expect(service.recordUsage).toHaveBeenCalledWith('1');
      expect(service.copyAndPaste).toHaveBeenCalledWith('Test content', true);
    });

    it('should work with toast provider on error', async () => {
      const service = createMockService();
      service.copyAndPaste = vi.fn().mockRejectedValue(new Error('Copy failed'));

      const { result } = renderHook(() => useSpotlightState(service), { wrapper });

      const prompt = createMockPrompt('1', { content: 'Test' });

      // Should not throw, error handled gracefully with toast
      await act(async () => {
        await result.current.handlePromptSelection(prompt, {});
      });

      // Modal should be closed
      expect(result.current.showContextModal).toBe(false);
    });

    it('should show correct message for auto_paste enabled', async () => {
      const service = createMockService();
      const { result } = renderHook(() => useSpotlightState(service), { wrapper });

      const prompt = createMockPrompt('1', {
        name: 'My Prompt',
        content: 'Test',
        auto_paste: true,
      });

      await act(async () => {
        await result.current.handlePromptSelection(prompt, {});
      });

      // Success path completed
      expect(service.copyAndPaste).toHaveBeenCalledWith('Test', true);
    });

    it('should show correct message for auto_paste disabled', async () => {
      const service = createMockService();
      const { result } = renderHook(() => useSpotlightState(service), { wrapper });

      const prompt = createMockPrompt('1', {
        name: 'My Prompt',
        content: 'Test',
        auto_paste: false,
      });

      await act(async () => {
        await result.current.handlePromptSelection(prompt, {});
      });

      // Success path completed with auto_paste false
      expect(service.copyAndPaste).toHaveBeenCalledWith('Test', false);
    });
  });
});
