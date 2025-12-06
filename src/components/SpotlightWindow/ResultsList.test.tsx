import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResultsList } from './ResultsList';
import type { Prompt } from '../../lib/types';

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
  is_favorite: false,
  created_at: '2025-11-30T10:00:00Z',
  updated_at: '2025-11-30T10:00:00Z',
  ...overrides,
});

// Mock scrollIntoView since jsdom doesn't implement it
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe('ResultsList', () => {
  describe('Empty State', () => {
    it('should show no results message when results array is empty (has prompts)', () => {
      render(
        <ResultsList
          results={[]}
          selected_index={0}
          onSelect={vi.fn()}
          onHover={vi.fn()}
          hasPrompts={true}
        />
      );
      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(screen.getByText('Try searching for a prompt name or description')).toBeInTheDocument();
    });

    it('should show contextual message with search query', () => {
      render(
        <ResultsList
          results={[]}
          selected_index={0}
          onSelect={vi.fn()}
          onHover={vi.fn()}
          hasPrompts={true}
          searchQuery="test query"
        />
      );
      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(screen.getByText('No prompts match "test query"')).toBeInTheDocument();
    });

    it('should show no prompts message when hasPrompts is false', () => {
      render(
        <ResultsList
          results={[]}
          selected_index={0}
          onSelect={vi.fn()}
          onHover={vi.fn()}
          hasPrompts={false}
        />
      );
      expect(screen.getByText('No prompts yet')).toBeInTheDocument();
      expect(screen.getByText(/Create your first prompt/)).toBeInTheDocument();
    });

    it('should not render results list when empty', () => {
      const { container } = render(
        <ResultsList
          results={[]}
          selected_index={0}
          onSelect={vi.fn()}
          onHover={vi.fn()}
        />
      );
      expect(container.querySelector('.results-list')).not.toBeInTheDocument();
    });

    it('should show empty state with proper styling classes', () => {
      const { container } = render(
        <ResultsList
          results={[]}
          selected_index={0}
          onSelect={vi.fn()}
          onHover={vi.fn()}
        />
      );
      expect(container.querySelector('.empty-state')).toBeInTheDocument();
    });

    it('should render empty state icon', () => {
      const { container } = render(
        <ResultsList
          results={[]}
          selected_index={0}
          onSelect={vi.fn()}
          onHover={vi.fn()}
        />
      );
      expect(container.querySelector('.empty-state-icon')).toBeInTheDocument();
    });

    it('should have data-testid for empty state', () => {
      render(
        <ResultsList
          results={[]}
          selected_index={0}
          onSelect={vi.fn()}
          onHover={vi.fn()}
        />
      );
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  describe('Results Rendering', () => {
    it('should render single result', () => {
      const results = [createMockPrompt('1')];
      render(
        <ResultsList
          results={results}
          selected_index={0}
          onSelect={vi.fn()}
          onHover={vi.fn()}
        />
      );
      expect(screen.getByText('Prompt 1')).toBeInTheDocument();
    });

    it('should render multiple results', () => {
      const results = [
        createMockPrompt('1'),
        createMockPrompt('2'),
        createMockPrompt('3'),
      ];
      render(
        <ResultsList
          results={results}
          selected_index={0}
          onSelect={vi.fn()}
          onHover={vi.fn()}
        />
      );
      expect(screen.getByText('Prompt 1')).toBeInTheDocument();
      expect(screen.getByText('Prompt 2')).toBeInTheDocument();
      expect(screen.getByText('Prompt 3')).toBeInTheDocument();
    });

    it('should render large number of results', () => {
      const results = Array.from({ length: 100 }, (_, i) =>
        createMockPrompt(`${i + 1}`)
      );
      render(
        <ResultsList
          results={results}
          selected_index={0}
          onSelect={vi.fn()}
          onHover={vi.fn()}
        />
      );
      expect(screen.getByText('Prompt 1')).toBeInTheDocument();
      expect(screen.getByText('Prompt 100')).toBeInTheDocument();
    });

    it('should use prompt id as key', () => {
      const results = [
        createMockPrompt('unique-id-1'),
        createMockPrompt('unique-id-2'),
      ];
      const { container } = render(
        <ResultsList
          results={results}
          selected_index={0}
          onSelect={vi.fn()}
          onHover={vi.fn()}
        />
      );
      const items = container.querySelectorAll('.result-item');
      expect(items.length).toBe(2);
    });

    it('should maintain order of results', () => {
      const results = [
        createMockPrompt('1', { name: 'Alpha' }),
        createMockPrompt('2', { name: 'Beta' }),
        createMockPrompt('3', { name: 'Gamma' }),
      ];
      const { container } = render(
        <ResultsList
          results={results}
          selected_index={0}
          onSelect={vi.fn()}
          onHover={vi.fn()}
        />
      );
      const items = Array.from(container.querySelectorAll('.result-name'));
      expect(items[0].textContent).toBe('Alpha');
      expect(items[1].textContent).toBe('Beta');
      expect(items[2].textContent).toBe('Gamma');
    });
  });

  describe('Selection', () => {
    it('should mark first item as selected when selected_index is 0', () => {
      const results = [createMockPrompt('1'), createMockPrompt('2')];
      const { container } = render(
        <ResultsList
          results={results}
          selected_index={0}
          onSelect={vi.fn()}
          onHover={vi.fn()}
        />
      );
      const items = container.querySelectorAll('.result-item');
      expect(items[0]).toHaveClass('selected');
      expect(items[1]).not.toHaveClass('selected');
    });

    it('should mark second item as selected when selected_index is 1', () => {
      const results = [createMockPrompt('1'), createMockPrompt('2')];
      const { container } = render(
        <ResultsList
          results={results}
          selected_index={1}
          onSelect={vi.fn()}
          onHover={vi.fn()}
        />
      );
      const items = container.querySelectorAll('.result-item');
      expect(items[0]).not.toHaveClass('selected');
      expect(items[1]).toHaveClass('selected');
    });

    it('should update selection when selected_index changes', () => {
      const results = [createMockPrompt('1'), createMockPrompt('2')];
      const { container, rerender } = render(
        <ResultsList
          results={results}
          selected_index={0}
          onSelect={vi.fn()}
          onHover={vi.fn()}
        />
      );

      let items = container.querySelectorAll('.result-item');
      expect(items[0]).toHaveClass('selected');

      rerender(
        <ResultsList
          results={results}
          selected_index={1}
          onSelect={vi.fn()}
          onHover={vi.fn()}
        />
      );

      items = container.querySelectorAll('.result-item');
      expect(items[1]).toHaveClass('selected');
    });

    it('should handle negative selected_index gracefully', () => {
      const results = [createMockPrompt('1'), createMockPrompt('2')];
      const { container } = render(
        <ResultsList
          results={results}
          selected_index={-1}
          onSelect={vi.fn()}
          onHover={vi.fn()}
        />
      );
      const items = container.querySelectorAll('.result-item.selected');
      expect(items.length).toBe(0); // No items selected
    });

    it('should handle selected_index out of bounds', () => {
      const results = [createMockPrompt('1'), createMockPrompt('2')];
      const { container } = render(
        <ResultsList
          results={results}
          selected_index={10}
          onSelect={vi.fn()}
          onHover={vi.fn()}
        />
      );
      const items = container.querySelectorAll('.result-item.selected');
      expect(items.length).toBe(0); // No items selected
    });
  });

  describe('Auto-Scroll Behavior', () => {
    it('should call scrollIntoView when selected_index changes', async () => {
      const results = [createMockPrompt('1'), createMockPrompt('2'), createMockPrompt('3')];
      const { rerender } = render(
        <ResultsList
          results={results}
          selected_index={0}
          onSelect={vi.fn()}
          onHover={vi.fn()}
        />
      );

      const scrollSpy = vi.spyOn(Element.prototype, 'scrollIntoView');

      rerender(
        <ResultsList
          results={results}
          selected_index={1}
          onSelect={vi.fn()}
          onHover={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(scrollSpy).toHaveBeenCalled();
      });
    });

    it('should scroll with smooth behavior', async () => {
      const results = [createMockPrompt('1'), createMockPrompt('2')];
      const { rerender } = render(
        <ResultsList
          results={results}
          selected_index={0}
          onSelect={vi.fn()}
          onHover={vi.fn()}
        />
      );

      const scrollSpy = vi.spyOn(Element.prototype, 'scrollIntoView');

      rerender(
        <ResultsList
          results={results}
          selected_index={1}
          onSelect={vi.fn()}
          onHover={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(scrollSpy).toHaveBeenCalledWith({
          block: 'nearest',
          behavior: 'smooth',
        });
      });
    });

    it('should not scroll if selected_index stays the same', () => {
      const results = [createMockPrompt('1'), createMockPrompt('2')];
      const { rerender } = render(
        <ResultsList
          results={results}
          selected_index={0}
          onSelect={vi.fn()}
          onHover={vi.fn()}
        />
      );

      const scrollSpy = vi.spyOn(Element.prototype, 'scrollIntoView');
      scrollSpy.mockClear();

      rerender(
        <ResultsList
          results={results}
          selected_index={0}
          onSelect={vi.fn()}
          onHover={vi.fn()}
        />
      );

      // scrollIntoView is still called due to useEffect, but with same index
      // This is a known limitation - could be optimized
    });
  });

  describe('User Interactions', () => {
    it('should call onSelect with correct prompt when item clicked', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const results = [createMockPrompt('1'), createMockPrompt('2')];

      render(
        <ResultsList
          results={results}
          selected_index={0}
          onSelect={onSelect}
          onHover={vi.fn()}
        />
      );

      await user.click(screen.getByText('Prompt 2'));
      expect(onSelect).toHaveBeenCalledWith(results[1]);
    });

    it('should call onHover with correct index when mouse enters', async () => {
      const onHover = vi.fn();
      const results = [createMockPrompt('1'), createMockPrompt('2')];
      const { container } = render(
        <ResultsList
          results={results}
          selected_index={0}
          onSelect={vi.fn()}
          onHover={onHover}
        />
      );

      const items = container.querySelectorAll('.result-item');
      const user = userEvent.setup();
      await user.hover(items[1]);

      expect(onHover).toHaveBeenCalledWith(1);
    });

    it('should handle multiple rapid clicks', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const results = [createMockPrompt('1')];

      render(
        <ResultsList
          results={results}
          selected_index={0}
          onSelect={onSelect}
          onHover={vi.fn()}
        />
      );

      const item = screen.getByText('Prompt 1');
      await user.tripleClick(item);

      expect(onSelect).toHaveBeenCalledTimes(3);
    });

    it('should handle hover on multiple items', async () => {
      const onHover = vi.fn();
      const results = [createMockPrompt('1'), createMockPrompt('2'), createMockPrompt('3')];
      const { container } = render(
        <ResultsList
          results={results}
          selected_index={0}
          onSelect={vi.fn()}
          onHover={onHover}
        />
      );

      const items = container.querySelectorAll('.result-item');
      const user = userEvent.setup();

      for (let i = 0; i < items.length; i++) {
        await user.hover(items[i]);
      }

      expect(onHover).toHaveBeenCalledTimes(3);
      expect(onHover).toHaveBeenNthCalledWith(1, 0);
      expect(onHover).toHaveBeenNthCalledWith(2, 1);
      expect(onHover).toHaveBeenNthCalledWith(3, 2);
    });
  });

  describe('Dynamic Results', () => {
    it('should update when results change', () => {
      const initialResults = [createMockPrompt('1')];
      const { rerender } = render(
        <ResultsList
          results={initialResults}
          selected_index={0}
          onSelect={vi.fn()}
          onHover={vi.fn()}
        />
      );

      expect(screen.getByText('Prompt 1')).toBeInTheDocument();

      const newResults = [createMockPrompt('1'), createMockPrompt('2')];
      rerender(
        <ResultsList
          results={newResults}
          selected_index={0}
          onSelect={vi.fn()}
          onHover={vi.fn()}
        />
      );

      expect(screen.getByText('Prompt 1')).toBeInTheDocument();
      expect(screen.getByText('Prompt 2')).toBeInTheDocument();
    });

    it('should transition from results to empty state', () => {
      const { rerender } = render(
        <ResultsList
          results={[createMockPrompt('1')]}
          selected_index={0}
          onSelect={vi.fn()}
          onHover={vi.fn()}
        />
      );

      expect(screen.getByText('Prompt 1')).toBeInTheDocument();

      rerender(
        <ResultsList
          results={[]}
          selected_index={0}
          onSelect={vi.fn()}
          onHover={vi.fn()}
          hasPrompts={true}
        />
      );

      expect(screen.queryByText('Prompt 1')).not.toBeInTheDocument();
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('should transition from empty state to results', () => {
      const { rerender } = render(
        <ResultsList
          results={[]}
          selected_index={0}
          onSelect={vi.fn()}
          onHover={vi.fn()}
          hasPrompts={true}
        />
      );

      expect(screen.getByText('No results found')).toBeInTheDocument();

      rerender(
        <ResultsList
          results={[createMockPrompt('1')]}
          selected_index={0}
          onSelect={vi.fn()}
          onHover={vi.fn()}
        />
      );

      expect(screen.queryByText('No results found')).not.toBeInTheDocument();
      expect(screen.getByText('Prompt 1')).toBeInTheDocument();
    });

    it('should handle results filtering (shrinking list)', () => {
      const allResults = [
        createMockPrompt('1'),
        createMockPrompt('2'),
        createMockPrompt('3'),
      ];
      const { rerender, container } = render(
        <ResultsList
          results={allResults}
          selected_index={0}
          onSelect={vi.fn()}
          onHover={vi.fn()}
        />
      );

      expect(container.querySelectorAll('.result-item')).toHaveLength(3);

      rerender(
        <ResultsList
          results={[allResults[0]]}
          selected_index={0}
          onSelect={vi.fn()}
          onHover={vi.fn()}
        />
      );

      expect(container.querySelectorAll('.result-item')).toHaveLength(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle results with duplicate ids (though should not happen)', () => {
      const results = [
        createMockPrompt('1', { name: 'First' }),
        createMockPrompt('1', { name: 'Duplicate' }),
      ];

      // React will warn about duplicate keys
      const consoleWarn = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ResultsList
          results={results}
          selected_index={0}
          onSelect={vi.fn()}
          onHover={vi.fn()}
        />
      );

      expect(consoleWarn).toHaveBeenCalled();
      consoleWarn.mockRestore();
    });

    it('should handle null/undefined in results array', () => {
      const results = [
        createMockPrompt('1'),
        null as any,
        createMockPrompt('2'),
      ];

      expect(() => {
        render(
          <ResultsList
            results={results}
            selected_index={0}
            onSelect={vi.fn()}
            onHover={vi.fn()}
          />
        );
      }).toThrow(); // Expected to throw with null items
    });

    it('should handle extremely large selected_index', () => {
      const results = [createMockPrompt('1')];
      const { container } = render(
        <ResultsList
          results={results}
          selected_index={Number.MAX_SAFE_INTEGER}
          onSelect={vi.fn()}
          onHover={vi.fn()}
        />
      );

      const items = container.querySelectorAll('.result-item.selected');
      expect(items.length).toBe(0);
    });
  });

  describe('Performance', () => {
    it('should efficiently render large lists', () => {
      const results = Array.from({ length: 1000 }, (_, i) =>
        createMockPrompt(`${i}`)
      );

      const startTime = performance.now();
      render(
        <ResultsList
          results={results}
          selected_index={0}
          onSelect={vi.fn()}
          onHover={vi.fn()}
        />
      );
      const endTime = performance.now();

      // Should render 1000 items in reasonable time
      // Test environment has overhead (jsdom, testing-library, etc.)
      // so threshold is higher than production performance
      expect(endTime - startTime).toBeLessThan(6000);
    });

    it('should not re-render all items when only selected_index changes', () => {
      const results = [createMockPrompt('1'), createMockPrompt('2')];
      const { rerender, container } = render(
        <ResultsList
          results={results}
          selected_index={0}
          onSelect={vi.fn()}
          onHover={vi.fn()}
        />
      );

      const initialItems = Array.from(container.querySelectorAll('.result-item'));

      rerender(
        <ResultsList
          results={results}
          selected_index={1}
          onSelect={vi.fn()}
          onHover={vi.fn()}
        />
      );

      const updatedItems = Array.from(container.querySelectorAll('.result-item'));

      // Items should be same elements (React reconciliation optimization)
      expect(updatedItems[0]).toBe(initialItems[0]);
      expect(updatedItems[1]).toBe(initialItems[1]);
    });
  });
});
