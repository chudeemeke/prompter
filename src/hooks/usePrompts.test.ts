import { renderHook, waitFor } from '@testing-library/react';
import { usePrompts } from './usePrompts';
import type { Prompt } from '../lib/types';
import type { PromptService } from '../services/PromptService';

const createMockPrompt = (id: string): Prompt => ({
  id,
  name: `Prompt ${id}`,
  description: `Description ${id}`,
  content: `Content ${id}`,
  folder: 'Test',
  icon: '📝',
  color: '#3B82F6',
  tags: ['test'],
  variables: [],
  auto_paste: true,
  created_at: '2025-11-30T10:00:00Z',
  updated_at: '2025-11-30T10:00:00Z',
});

const createMockService = (overrides?: Partial<PromptService>): PromptService => ({
  getAllPrompts: vi.fn().mockResolvedValue([]),
  getPrompt: vi.fn().mockResolvedValue(createMockPrompt('1')),
  searchPrompts: vi.fn().mockResolvedValue([]),
  copyAndPaste: vi.fn().mockResolvedValue(undefined),
  hideAndRestore: vi.fn().mockResolvedValue(undefined),
  recordUsage: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('usePrompts', () => {
  describe('Initial Loading', () => {
    it('should start with loading state true', () => {
      const service = createMockService();
      const { result } = renderHook(() => usePrompts(service));

      expect(result.current.loading).toBe(true);
    });

    it('should start with empty prompts array', () => {
      const service = createMockService();
      const { result } = renderHook(() => usePrompts(service));

      expect(result.current.prompts).toEqual([]);
    });

    it('should start with null error', () => {
      const service = createMockService();
      const { result } = renderHook(() => usePrompts(service));

      expect(result.current.error).toBeNull();
    });

    it('should call getAllPrompts on mount', () => {
      const getAllPrompts = vi.fn().mockResolvedValue([]);
      const service = createMockService({ getAllPrompts });

      renderHook(() => usePrompts(service));

      expect(getAllPrompts).toHaveBeenCalledTimes(1);
    });

    it('should only call getAllPrompts once on mount', async () => {
      const getAllPrompts = vi.fn().mockResolvedValue([]);
      const service = createMockService({ getAllPrompts });

      const { rerender } = renderHook(() => usePrompts(service));

      await waitFor(() => expect(getAllPrompts).toHaveBeenCalledTimes(1));

      // Rerender should not trigger another call
      rerender();

      expect(getAllPrompts).toHaveBeenCalledTimes(1);
    });
  });

  describe('Successful Loading', () => {
    it('should set prompts when service resolves', async () => {
      const mockPrompts = [createMockPrompt('1'), createMockPrompt('2')];
      const service = createMockService({
        getAllPrompts: vi.fn().mockResolvedValue(mockPrompts),
      });

      const { result } = renderHook(() => usePrompts(service));

      await waitFor(() => {
        expect(result.current.prompts).toEqual(mockPrompts);
      });
    });

    it('should set loading to false after successful load', async () => {
      const service = createMockService({
        getAllPrompts: vi.fn().mockResolvedValue([]),
      });

      const { result } = renderHook(() => usePrompts(service));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should clear error after successful load', async () => {
      const service = createMockService({
        getAllPrompts: vi.fn()
          .mockRejectedValueOnce(new Error('First error'))
          .mockResolvedValueOnce([]),
      });

      const { result } = renderHook(() => usePrompts(service));

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      // Reload
      result.current.reload();

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });

    it('should handle empty prompts array', async () => {
      const service = createMockService({
        getAllPrompts: vi.fn().mockResolvedValue([]),
      });

      const { result } = renderHook(() => usePrompts(service));

      await waitFor(() => {
        expect(result.current.prompts).toEqual([]);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });

    it('should handle single prompt', async () => {
      const mockPrompt = createMockPrompt('1');
      const service = createMockService({
        getAllPrompts: vi.fn().mockResolvedValue([mockPrompt]),
      });

      const { result } = renderHook(() => usePrompts(service));

      await waitFor(() => {
        expect(result.current.prompts).toHaveLength(1);
        expect(result.current.prompts[0]).toEqual(mockPrompt);
      });
    });

    it('should handle large number of prompts', async () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) =>
        createMockPrompt(`${i}`)
      );
      const service = createMockService({
        getAllPrompts: vi.fn().mockResolvedValue(largeArray),
      });

      const { result } = renderHook(() => usePrompts(service));

      await waitFor(() => {
        expect(result.current.prompts).toHaveLength(1000);
      });
    });
  });

  describe('Error Handling', () => {
    it('should set error when service rejects with Error', async () => {
      const errorMessage = 'Failed to fetch prompts';
      const service = createMockService({
        getAllPrompts: vi.fn().mockRejectedValue(new Error(errorMessage)),
      });

      const { result } = renderHook(() => usePrompts(service));

      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
      });
    });

    it('should set loading to false after error', async () => {
      const service = createMockService({
        getAllPrompts: vi.fn().mockRejectedValue(new Error('Error')),
      });

      const { result } = renderHook(() => usePrompts(service));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should keep prompts empty after error', async () => {
      const service = createMockService({
        getAllPrompts: vi.fn().mockRejectedValue(new Error('Error')),
      });

      const { result } = renderHook(() => usePrompts(service));

      await waitFor(() => {
        expect(result.current.prompts).toEqual([]);
        expect(result.current.error).toBeTruthy();
      });
    });

    it('should handle non-Error rejection', async () => {
      const service = createMockService({
        getAllPrompts: vi.fn().mockRejectedValue('String error'),
      });

      const { result } = renderHook(() => usePrompts(service));

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to load prompts');
      });
    });

    it('should handle null rejection', async () => {
      const service = createMockService({
        getAllPrompts: vi.fn().mockRejectedValue(null),
      });

      const { result } = renderHook(() => usePrompts(service));

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to load prompts');
      });
    });

    it('should handle undefined rejection', async () => {
      const service = createMockService({
        getAllPrompts: vi.fn().mockRejectedValue(undefined),
      });

      const { result } = renderHook(() => usePrompts(service));

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to load prompts');
      });
    });

    it('should preserve previous prompts on error', async () => {
      const initialPrompts = [createMockPrompt('1')];
      const service = createMockService({
        getAllPrompts: vi.fn()
          .mockResolvedValueOnce(initialPrompts)
          .mockRejectedValueOnce(new Error('Reload failed')),
      });

      const { result } = renderHook(() => usePrompts(service));

      await waitFor(() => {
        expect(result.current.prompts).toEqual(initialPrompts);
      });

      // Reload fails
      result.current.reload();

      await waitFor(() => {
        expect(result.current.error).toBe('Reload failed');
      });

      // Prompts should still be the initial ones
      expect(result.current.prompts).toEqual(initialPrompts);
    });
  });

  describe('Reload Functionality', () => {
    it('should provide reload function', () => {
      const service = createMockService();
      const { result } = renderHook(() => usePrompts(service));

      expect(typeof result.current.reload).toBe('function');
    });

    it('should call getAllPrompts when reload is invoked', async () => {
      const getAllPrompts = vi.fn().mockResolvedValue([]);
      const service = createMockService({ getAllPrompts });

      const { result } = renderHook(() => usePrompts(service));

      await waitFor(() => expect(result.current.loading).toBe(false));

      getAllPrompts.mockClear();
      result.current.reload();

      expect(getAllPrompts).toHaveBeenCalledTimes(1);
    });

    it('should set loading to true during reload', async () => {
      const service = createMockService({
        getAllPrompts: vi.fn().mockImplementation(
          () => new Promise(resolve => setTimeout(() => resolve([]), 100))
        ),
      });

      const { result } = renderHook(() => usePrompts(service));

      await waitFor(() => expect(result.current.loading).toBe(false));

      result.current.reload();

      await waitFor(() => expect(result.current.loading).toBe(true));
    });

    it('should update prompts with new data on reload', async () => {
      const initialPrompts = [createMockPrompt('1')];
      const newPrompts = [createMockPrompt('2'), createMockPrompt('3')];

      const service = createMockService({
        getAllPrompts: vi.fn()
          .mockResolvedValueOnce(initialPrompts)
          .mockResolvedValueOnce(newPrompts),
      });

      const { result } = renderHook(() => usePrompts(service));

      await waitFor(() => {
        expect(result.current.prompts).toEqual(initialPrompts);
      });

      result.current.reload();

      await waitFor(() => {
        expect(result.current.prompts).toEqual(newPrompts);
      });
    });

    it('should handle multiple rapid reloads', async () => {
      const getAllPrompts = vi.fn().mockResolvedValue([]);
      const service = createMockService({ getAllPrompts });

      const { result } = renderHook(() => usePrompts(service));

      await waitFor(() => expect(result.current.loading).toBe(false));

      getAllPrompts.mockClear();

      // Rapid reloads
      result.current.reload();
      result.current.reload();
      result.current.reload();

      await waitFor(() => expect(result.current.loading).toBe(false));

      // Should be called 3 times
      expect(getAllPrompts).toHaveBeenCalledTimes(3);
    });

    it('should handle reload after error', async () => {
      const service = createMockService({
        getAllPrompts: vi.fn()
          .mockRejectedValueOnce(new Error('First error'))
          .mockResolvedValueOnce([createMockPrompt('1')]),
      });

      const { result } = renderHook(() => usePrompts(service));

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      result.current.reload();

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.prompts).toHaveLength(1);
      });
    });
  });

  describe('Service Dependency', () => {
    it('should work with different service implementations', async () => {
      const service1 = createMockService({
        getAllPrompts: vi.fn().mockResolvedValue([createMockPrompt('1')]),
      });

      const { result: result1 } = renderHook(() => usePrompts(service1));

      await waitFor(() => {
        expect(result1.current.prompts).toHaveLength(1);
      });

      const service2 = createMockService({
        getAllPrompts: vi.fn().mockResolvedValue([
          createMockPrompt('2'),
          createMockPrompt('3'),
        ]),
      });

      const { result: result2 } = renderHook(() => usePrompts(service2));

      await waitFor(() => {
        expect(result2.current.prompts).toHaveLength(2);
      });
    });

    it('should not call service methods other than getAllPrompts', () => {
      const service = createMockService();

      renderHook(() => usePrompts(service));

      expect(service.searchPrompts).not.toHaveBeenCalled();
      expect(service.copyAndPaste).not.toHaveBeenCalled();
      expect(service.hideAndRestore).not.toHaveBeenCalled();
      expect(service.recordUsage).not.toHaveBeenCalled();
    });
  });

  describe('Async Behavior', () => {
    it('should handle slow service responses', async () => {
      const service = createMockService({
        getAllPrompts: vi.fn().mockImplementation(
          () => new Promise(resolve =>
            setTimeout(() => resolve([createMockPrompt('1')]), 1000)
          )
        ),
      });

      const { result } = renderHook(() => usePrompts(service));

      expect(result.current.loading).toBe(true);

      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
          expect(result.current.prompts).toHaveLength(1);
        },
        { timeout: 2000 }
      );
    });

    it('should handle service timeout', async () => {
      const service = createMockService({
        getAllPrompts: vi.fn().mockImplementation(
          () => new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 100)
          )
        ),
      });

      const { result } = renderHook(() => usePrompts(service));

      await waitFor(() => {
        expect(result.current.error).toBe('Timeout');
      });
    });

    it('should handle concurrent reloads correctly', async () => {
      let resolveCount = 0;
      const service = createMockService({
        getAllPrompts: vi.fn().mockImplementation(
          () => new Promise(resolve => {
            const currentCount = ++resolveCount;
            setTimeout(() => resolve([createMockPrompt(`${currentCount}`)]), 100);
          })
        ),
      });

      const { result } = renderHook(() => usePrompts(service));

      await waitFor(() => expect(result.current.loading).toBe(false));

      // Start two concurrent reloads
      result.current.reload();
      result.current.reload();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should have prompts from one of the reloads
      expect(result.current.prompts).toHaveLength(1);
    });
  });

  describe('Memory Management', () => {
    it('should cleanup properly on unmount', async () => {
      const service = createMockService({
        getAllPrompts: vi.fn().mockResolvedValue([]),
      });

      const { unmount } = renderHook(() => usePrompts(service));

      await waitFor(() => {});

      expect(() => unmount()).not.toThrow();
    });

    it('should not update state after unmount', async () => {
      const service = createMockService({
        getAllPrompts: vi.fn().mockImplementation(
          () => new Promise(resolve => setTimeout(() => resolve([]), 1000))
        ),
      });

      const { result, unmount } = renderHook(() => usePrompts(service));

      unmount();

      // Wait for promise to resolve
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should not throw or cause issues
      expect(result.current).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle service returning non-array', async () => {
      const service = createMockService({
        getAllPrompts: vi.fn().mockResolvedValue(null as any),
      });

      const { result } = renderHook(() => usePrompts(service));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should handle gracefully
      expect(result.current.prompts).toBe(null);
    });

    it('should handle service returning undefined', async () => {
      const service = createMockService({
        getAllPrompts: vi.fn().mockResolvedValue(undefined as any),
      });

      const { result } = renderHook(() => usePrompts(service));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.prompts).toBeUndefined();
      });
    });

    it('should handle service returning malformed data', async () => {
      const service = createMockService({
        getAllPrompts: vi.fn().mockResolvedValue([{ invalid: 'data' }] as any),
      });

      const { result } = renderHook(() => usePrompts(service));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.prompts).toHaveLength(1);
      });
    });
  });

  describe('Return Value Stability', () => {
    it('should maintain reload function reference', async () => {
      const service = createMockService({
        getAllPrompts: vi.fn().mockResolvedValue([]),
      });

      const { result, rerender } = renderHook(() => usePrompts(service));

      const initialReload = result.current.reload;

      rerender();

      expect(result.current.reload).toBe(initialReload);
    });

    it('should update prompts reference when data changes', async () => {
      const service = createMockService({
        getAllPrompts: vi.fn()
          .mockResolvedValueOnce([createMockPrompt('1')])
          .mockResolvedValueOnce([createMockPrompt('2')]),
      });

      const { result } = renderHook(() => usePrompts(service));

      await waitFor(() => expect(result.current.loading).toBe(false));

      const initialPrompts = result.current.prompts;

      result.current.reload();

      await waitFor(() => {
        expect(result.current.prompts).not.toBe(initialPrompts);
      });
    });
  });
});
