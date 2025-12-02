import { renderHook } from '@testing-library/react';
import { useSearch } from './useSearch';
import type { Prompt } from '../lib/types';

const createMockPrompt = (id: string, overrides?: Partial<Prompt>): Prompt => ({
  id,
  name: `Prompt ${id}`,
  description: `Description for prompt ${id}`,
  content: `Content for prompt ${id}`,
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

describe('useSearch', () => {
  describe('Empty Query', () => {
    it('should return all prompts when query is empty string', () => {
      const prompts = [createMockPrompt('1'), createMockPrompt('2')];
      const { result } = renderHook(() => useSearch(prompts, ''));
      expect(result.current).toEqual(prompts);
    });

    it('should return all prompts when query is whitespace only', () => {
      const prompts = [createMockPrompt('1'), createMockPrompt('2')];
      const { result } = renderHook(() => useSearch(prompts, '   '));
      expect(result.current).toEqual(prompts);
    });

    it('should return all prompts when query is tabs and newlines', () => {
      const prompts = [createMockPrompt('1'), createMockPrompt('2')];
      const { result } = renderHook(() => useSearch(prompts, '\t\n  '));
      expect(result.current).toEqual(prompts);
    });

    it('should return empty array when prompts is empty and query is empty', () => {
      const { result } = renderHook(() => useSearch([], ''));
      expect(result.current).toEqual([]);
    });
  });

  describe('Name Matching', () => {
    it('should filter by exact name match', () => {
      const prompts = [
        createMockPrompt('1', { name: 'AI News' }),
        createMockPrompt('2', { name: 'Email Template' }),
      ];
      const { result } = renderHook(() => useSearch(prompts, 'AI News'));
      expect(result.current).toHaveLength(1);
      expect(result.current[0].name).toBe('AI News');
    });

    it('should filter by partial name match', () => {
      const prompts = [
        createMockPrompt('1', { name: 'AI News Summary' }),
        createMockPrompt('2', { name: 'Email Template' }),
      ];
      const { result } = renderHook(() => useSearch(prompts, 'News'));
      expect(result.current).toHaveLength(1);
      expect(result.current[0].name).toBe('AI News Summary');
    });

    it('should be case-insensitive for name matching', () => {
      const prompts = [
        createMockPrompt('1', { name: 'AI News' }),
        createMockPrompt('2', { name: 'Email Template' }),
      ];
      const { result } = renderHook(() => useSearch(prompts, 'ai news'));
      expect(result.current).toHaveLength(1);
      expect(result.current[0].name).toBe('AI News');
    });

    it('should match multiple prompts with same substring in name', () => {
      const prompts = [
        createMockPrompt('1', { name: 'Code Review' }),
        createMockPrompt('2', { name: 'Code Snippet' }),
        createMockPrompt('3', { name: 'Email Template' }),
      ];
      const { result } = renderHook(() => useSearch(prompts, 'Code'));
      expect(result.current).toHaveLength(2);
    });

    it('should handle special characters in query', () => {
      const prompts = [
        createMockPrompt('1', { name: 'Test: Special' }),
        createMockPrompt('2', { name: 'Normal' }),
      ];
      const { result } = renderHook(() => useSearch(prompts, 'Test:'));
      expect(result.current).toHaveLength(1);
      expect(result.current[0].name).toBe('Test: Special');
    });

    it('should handle unicode characters in query', () => {
      const prompts = [
        createMockPrompt('1', { name: '你好世界' }),
        createMockPrompt('2', { name: 'Hello World' }),
      ];
      const { result } = renderHook(() => useSearch(prompts, '你好'));
      expect(result.current).toHaveLength(1);
      expect(result.current[0].name).toBe('你好世界');
    });
  });

  describe('Description Matching', () => {
    it('should filter by description match', () => {
      const prompts = [
        createMockPrompt('1', { description: 'Get latest AI news' }),
        createMockPrompt('2', { description: 'Send email template' }),
      ];
      const { result } = renderHook(() => useSearch(prompts, 'latest'));
      expect(result.current).toHaveLength(1);
      expect(result.current[0].description).toBe('Get latest AI news');
    });

    it('should be case-insensitive for description matching', () => {
      const prompts = [
        createMockPrompt('1', { description: 'Get Latest AI News' }),
      ];
      const { result } = renderHook(() => useSearch(prompts, 'latest'));
      expect(result.current).toHaveLength(1);
    });

    it('should handle undefined description', () => {
      const prompts = [
        createMockPrompt('1', { description: undefined as any }),
        createMockPrompt('2', { description: 'Has description' }),
      ];
      const { result } = renderHook(() => useSearch(prompts, 'description'));
      expect(result.current).toHaveLength(1);
      expect(result.current[0].description).toBe('Has description');
    });

    it('should handle empty description', () => {
      const prompts = [
        createMockPrompt('1', { description: '' }),
        createMockPrompt('2', { description: 'Has description' }),
      ];
      const { result } = renderHook(() => useSearch(prompts, 'description'));
      expect(result.current).toHaveLength(1);
    });
  });

  describe('Tag Matching', () => {
    it('should filter by tag match', () => {
      const prompts = [
        createMockPrompt('1', { tags: ['research', 'ai'] }),
        createMockPrompt('2', { tags: ['email', 'template'] }),
      ];
      const { result } = renderHook(() => useSearch(prompts, 'research'));
      expect(result.current).toHaveLength(1);
      expect(result.current[0].tags).toContain('research');
    });

    it('should be case-insensitive for tag matching', () => {
      const prompts = [
        createMockPrompt('1', { tags: ['Research', 'AI'] }),
      ];
      const { result } = renderHook(() => useSearch(prompts, 'research'));
      expect(result.current).toHaveLength(1);
    });

    it('should match partial tag strings', () => {
      const prompts = [
        createMockPrompt('1', { tags: ['research-paper'] }),
        createMockPrompt('2', { tags: ['email'] }),
      ];
      const { result } = renderHook(() => useSearch(prompts, 'research'));
      expect(result.current).toHaveLength(1);
    });

    it('should handle undefined tags', () => {
      const prompts = [
        createMockPrompt('1', { tags: undefined as any }),
        createMockPrompt('2', { tags: ['test'] }),
      ];
      const { result } = renderHook(() => useSearch(prompts, 'test'));
      expect(result.current).toHaveLength(1);
    });

    it('should handle empty tags array', () => {
      const prompts = [
        createMockPrompt('1', { tags: [] }),
        createMockPrompt('2', { tags: ['test'] }),
      ];
      const { result } = renderHook(() => useSearch(prompts, 'test'));
      expect(result.current).toHaveLength(1);
    });

    it('should match any tag in array', () => {
      const prompts = [
        createMockPrompt('1', { tags: ['one', 'two', 'three'] }),
        createMockPrompt('2', { tags: ['four', 'five'] }),
      ];
      const { result } = renderHook(() => useSearch(prompts, 'two'));
      expect(result.current).toHaveLength(1);
    });
  });

  describe('Content Matching', () => {
    it('should filter by content match', () => {
      const prompts = [
        createMockPrompt('1', { content: 'Give me latest AI news' }),
        createMockPrompt('2', { content: 'Send email to team' }),
      ];
      const { result } = renderHook(() => useSearch(prompts, 'latest AI'));
      expect(result.current).toHaveLength(1);
      expect(result.current[0].content).toContain('latest AI');
    });

    it('should be case-insensitive for content matching', () => {
      const prompts = [
        createMockPrompt('1', { content: 'Give Me Latest AI News' }),
      ];
      const { result } = renderHook(() => useSearch(prompts, 'latest ai'));
      expect(result.current).toHaveLength(1);
    });

    it('should match content with line breaks', () => {
      const prompts = [
        createMockPrompt('1', { content: 'Line 1\nLine 2\nLine 3' }),
        createMockPrompt('2', { content: 'Different content' }),
      ];
      const { result } = renderHook(() => useSearch(prompts, 'Line 2'));
      expect(result.current).toHaveLength(1);
    });
  });

  describe('Multiple Field Matching', () => {
    it('should match if query found in name OR description', () => {
      const prompts = [
        createMockPrompt('1', { name: 'AI News', description: 'Email template' }),
        createMockPrompt('2', { name: 'Code Review', description: 'AI tools' }),
      ];
      const { result } = renderHook(() => useSearch(prompts, 'AI'));
      expect(result.current).toHaveLength(2);
    });

    it('should match if query found in tags OR content', () => {
      const prompts = [
        createMockPrompt('1', { tags: ['coding'], content: 'Email content' }),
        createMockPrompt('2', { tags: ['email'], content: 'Coding tips' }),
      ];
      const { result } = renderHook(() => useSearch(prompts, 'coding'));
      expect(result.current).toHaveLength(2);
    });

    it('should not duplicate results if query matches multiple fields', () => {
      const prompts = [
        createMockPrompt('1', {
          name: 'AI News',
          description: 'AI research',
          tags: ['AI'],
          content: 'AI content',
        }),
      ];
      const { result } = renderHook(() => useSearch(prompts, 'AI'));
      expect(result.current).toHaveLength(1);
    });
  });

  describe('Relevance Sorting', () => {
    it('should prioritize name matches over other fields', () => {
      const prompts = [
        createMockPrompt('1', { name: 'Other', description: 'AI research' }),
        createMockPrompt('2', { name: 'AI News', description: 'Something else' }),
      ];
      const { result } = renderHook(() => useSearch(prompts, 'AI'));
      expect(result.current[0].name).toBe('AI News');
      expect(result.current[1].name).toBe('Other');
    });

    it('should maintain order for prompts with same match type', () => {
      const prompts = [
        createMockPrompt('1', { name: 'AI News A' }),
        createMockPrompt('2', { name: 'AI News B' }),
        createMockPrompt('3', { name: 'AI News C' }),
      ];
      const { result } = renderHook(() => useSearch(prompts, 'AI'));
      expect(result.current[0].id).toBe('1');
      expect(result.current[1].id).toBe('2');
      expect(result.current[2].id).toBe('3');
    });

    it('should group name matches together', () => {
      const prompts = [
        createMockPrompt('1', { name: 'Other', tags: ['coding'] }),
        createMockPrompt('2', { name: 'Code Review' }),
        createMockPrompt('3', { name: 'Something', content: 'coding tips' }),
        createMockPrompt('4', { name: 'Code Snippet' }),
      ];
      const { result } = renderHook(() => useSearch(prompts, 'code'));
      // Name matches should come first
      expect(result.current[0].name).toBe('Code Review');
      expect(result.current[1].name).toBe('Code Snippet');
    });
  });

  describe('Empty Results', () => {
    it('should return empty array when no matches found', () => {
      const prompts = [
        createMockPrompt('1', { name: 'AI News' }),
        createMockPrompt('2', { name: 'Email Template' }),
      ];
      const { result } = renderHook(() => useSearch(prompts, 'zzz'));
      expect(result.current).toEqual([]);
    });

    it('should return empty array when searching empty prompts list', () => {
      const { result } = renderHook(() => useSearch([], 'query'));
      expect(result.current).toEqual([]);
    });
  });

  describe('Performance and Memoization', () => {
    it('should memoize results when inputs unchanged', () => {
      const prompts = [createMockPrompt('1'), createMockPrompt('2')];
      const { result, rerender } = renderHook(
        ({ prompts, query }) => useSearch(prompts, query),
        { initialProps: { prompts, query: 'test' } }
      );

      const firstResult = result.current;

      rerender({ prompts, query: 'test' });

      expect(result.current).toBe(firstResult); // Same reference
    });

    it('should recalculate when query changes', () => {
      const prompts = [
        createMockPrompt('1', { name: 'React Tutorial' }),
        createMockPrompt('2', { name: 'Python Guide' }),
      ];
      const { result, rerender } = renderHook(
        ({ prompts, query }) => useSearch(prompts, query),
        { initialProps: { prompts, query: 'React' } }
      );

      expect(result.current).toHaveLength(1);

      rerender({ prompts, query: 'Python' });

      expect(result.current).toHaveLength(1);
      expect(result.current[0].name).toBe('Python Guide');
    });

    it('should recalculate when prompts change', () => {
      const prompts1 = [createMockPrompt('1', { name: 'First' })];
      const prompts2 = [createMockPrompt('2', { name: 'Second' })];

      const { result, rerender } = renderHook(
        ({ prompts, query }) => useSearch(prompts, query),
        { initialProps: { prompts: prompts1, query: '' } }
      );

      expect(result.current).toHaveLength(1);
      expect(result.current[0].name).toBe('First');

      rerender({ prompts: prompts2, query: '' });

      expect(result.current).toHaveLength(1);
      expect(result.current[0].name).toBe('Second');
    });

    it('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 10000 }, (_, i) =>
        createMockPrompt(`${i}`, { name: `Prompt ${i}` })
      );

      const startTime = performance.now();
      const { result } = renderHook(() => useSearch(largeDataset, 'Prompt 5000'));
      const endTime = performance.now();

      expect(result.current).toHaveLength(1);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in < 1s
    });
  });

  describe('Edge Cases', () => {
    it('should handle query with only special characters', () => {
      const prompts = [
        createMockPrompt('1', { name: '!@#$%' }),
        createMockPrompt('2', { name: 'Normal' }),
      ];
      const { result } = renderHook(() => useSearch(prompts, '!@#'));
      expect(result.current).toHaveLength(1);
    });

    it('should handle very long query strings', () => {
      const longQuery = 'a'.repeat(10000);
      const prompts = [
        createMockPrompt('1', { name: longQuery }),
        createMockPrompt('2', { name: 'Short' }),
      ];
      const { result } = renderHook(() => useSearch(prompts, longQuery));
      expect(result.current).toHaveLength(1);
    });

    it('should handle prompts with null fields gracefully', () => {
      const prompts = [
        {
          ...createMockPrompt('1'),
          description: null as any,
          tags: null as any,
        },
      ];

      expect(() => {
        renderHook(() => useSearch(prompts, 'test'));
      }).not.toThrow();
    });

    it('should trim whitespace from query for matching', () => {
      const prompts = [createMockPrompt('1', { name: 'Test' })];
      const { result } = renderHook(() => useSearch(prompts, '  Test  '));
      expect(result.current).toHaveLength(1);
    });

    it('should handle emoji in query', () => {
      const prompts = [
        createMockPrompt('1', { name: '🚀 Rocket' }),
        createMockPrompt('2', { name: 'Normal' }),
      ];
      const { result } = renderHook(() => useSearch(prompts, '🚀'));
      expect(result.current).toHaveLength(1);
    });

    it('should handle regex special characters in query', () => {
      const prompts = [
        createMockPrompt('1', { name: 'Test (special)' }),
        createMockPrompt('2', { name: 'Normal' }),
      ];
      const { result } = renderHook(() => useSearch(prompts, '(special)'));
      expect(result.current).toHaveLength(1);
    });

    it('should not mutate original prompts array', () => {
      const prompts = [
        createMockPrompt('1', { name: 'B' }),
        createMockPrompt('2', { name: 'A' }),
      ];
      const originalOrder = [...prompts];

      renderHook(() => useSearch(prompts, 'query'));

      expect(prompts).toEqual(originalOrder);
    });
  });
});
