import { renderHook, act, waitFor } from '@testing-library/react';
import { useSpotlightState } from './useSpotlightState';
import type { Prompt } from '../lib/types';
import type { PromptService } from '../services/PromptService';

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
  created_at: '2025-11-30T10:00:00Z',
  updated_at: '2025-11-30T10:00:00Z',
  ...overrides,
});

const createMockService = (): PromptService => ({
  getAllPrompts: vi.fn().mockResolvedValue([]),
  getPrompt: vi.fn().mockResolvedValue(createMockPrompt('1')),
  searchPrompts: vi.fn().mockResolvedValue([]),
  copyAndPaste: vi.fn().mockResolvedValue(undefined),
  hideAndRestore: vi.fn().mockResolvedValue(undefined),
  recordUsage: vi.fn().mockResolvedValue(undefined),
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
});
