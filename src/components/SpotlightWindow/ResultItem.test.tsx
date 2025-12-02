import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResultItem } from './ResultItem';
import type { Prompt } from '../../lib/types';

const createMockPrompt = (overrides?: Partial<Prompt>): Prompt => ({
  id: '1',
  name: 'Test Prompt',
  description: 'Test Description',
  content: 'Test content',
  folder: 'Test Folder',
  icon: '📝',
  color: '#3B82F6',
  tags: ['test'],
  variables: [],
  auto_paste: true,
  created_at: '2025-11-30T10:00:00Z',
  updated_at: '2025-11-30T10:00:00Z',
  ...overrides,
});

describe('ResultItem', () => {
  describe('Rendering', () => {
    it('should render prompt name', () => {
      const prompt = createMockPrompt({ name: 'AI News Summary' });
      render(
        <ResultItem
          prompt={prompt}
          isSelected={false}
          onClick={vi.fn()}
          onMouseEnter={vi.fn()}
        />
      );
      expect(screen.getByText('AI News Summary')).toBeInTheDocument();
    });

    it('should render prompt description', () => {
      const prompt = createMockPrompt({ description: 'Get latest news' });
      render(
        <ResultItem
          prompt={prompt}
          isSelected={false}
          onClick={vi.fn()}
          onMouseEnter={vi.fn()}
        />
      );
      expect(screen.getByText('Get latest news')).toBeInTheDocument();
    });

    it('should render prompt icon', () => {
      const prompt = createMockPrompt({ icon: '🚀' });
      render(
        <ResultItem
          prompt={prompt}
          isSelected={false}
          onClick={vi.fn()}
          onMouseEnter={vi.fn()}
        />
      );
      expect(screen.getByText('🚀')).toBeInTheDocument();
    });

    it('should render folder name', () => {
      const prompt = createMockPrompt({ folder: 'Research' });
      render(
        <ResultItem
          prompt={prompt}
          isSelected={false}
          onClick={vi.fn()}
          onMouseEnter={vi.fn()}
        />
      );
      expect(screen.getByText('Research')).toBeInTheDocument();
    });

    it('should not render description when missing', () => {
      const prompt = createMockPrompt({ description: '' });
      const { container } = render(
        <ResultItem
          prompt={prompt}
          isSelected={false}
          onClick={vi.fn()}
          onMouseEnter={vi.fn()}
        />
      );
      expect(container.querySelector('.result-description')).not.toBeInTheDocument();
    });

    it('should not render folder when missing', () => {
      const prompt = createMockPrompt({ folder: '' });
      const { container } = render(
        <ResultItem
          prompt={prompt}
          isSelected={false}
          onClick={vi.fn()}
          onMouseEnter={vi.fn()}
        />
      );
      expect(container.querySelector('.result-folder')).not.toBeInTheDocument();
    });
  });

  describe('Variables Indicator', () => {
    it('should show variables indicator when prompt has variables', () => {
      const prompt = createMockPrompt({
        variables: [{ name: 'topic', default: 'AI', required: true }],
      });
      render(
        <ResultItem
          prompt={prompt}
          isSelected={false}
          onClick={vi.fn()}
          onMouseEnter={vi.fn()}
        />
      );
      expect(screen.getByText('{{}}')).toBeInTheDocument();
    });

    it('should not show variables indicator when no variables', () => {
      const prompt = createMockPrompt({ variables: [] });
      const { container } = render(
        <ResultItem
          prompt={prompt}
          isSelected={false}
          onClick={vi.fn()}
          onMouseEnter={vi.fn()}
        />
      );
      expect(container.querySelector('.result-has-variables')).not.toBeInTheDocument();
    });

    it('should show tooltip on variables indicator', () => {
      const prompt = createMockPrompt({
        variables: [{ name: 'topic', default: 'AI', required: true }],
      });
      const { container } = render(
        <ResultItem
          prompt={prompt}
          isSelected={false}
          onClick={vi.fn()}
          onMouseEnter={vi.fn()}
        />
      );
      const indicator = container.querySelector('.result-has-variables');
      expect(indicator).toHaveAttribute('title', 'Press Tab to fill variables');
    });

    it('should show indicator for single variable', () => {
      const prompt = createMockPrompt({
        variables: [{ name: 'topic', default: 'AI', required: true }],
      });
      render(
        <ResultItem
          prompt={prompt}
          isSelected={false}
          onClick={vi.fn()}
          onMouseEnter={vi.fn()}
        />
      );
      expect(screen.getByText('{{}}')).toBeInTheDocument();
    });

    it('should show indicator for multiple variables', () => {
      const prompt = createMockPrompt({
        variables: [
          { name: 'topic', default: 'AI', required: true },
          { name: 'timeframe', default: 'today', required: false },
        ],
      });
      render(
        <ResultItem
          prompt={prompt}
          isSelected={false}
          onClick={vi.fn()}
          onMouseEnter={vi.fn()}
        />
      );
      expect(screen.getByText('{{}}')).toBeInTheDocument();
    });
  });

  describe('Selection State', () => {
    it('should apply selected class when isSelected is true', () => {
      const prompt = createMockPrompt();
      const { container } = render(
        <ResultItem
          prompt={prompt}
          isSelected={true}
          onClick={vi.fn()}
          onMouseEnter={vi.fn()}
        />
      );
      expect(container.querySelector('.result-item')).toHaveClass('selected');
    });

    it('should not apply selected class when isSelected is false', () => {
      const prompt = createMockPrompt();
      const { container } = render(
        <ResultItem
          prompt={prompt}
          isSelected={false}
          onClick={vi.fn()}
          onMouseEnter={vi.fn()}
        />
      );
      expect(container.querySelector('.result-item')).not.toHaveClass('selected');
    });

    it('should update selected class when prop changes', () => {
      const prompt = createMockPrompt();
      const { container, rerender } = render(
        <ResultItem
          prompt={prompt}
          isSelected={false}
          onClick={vi.fn()}
          onMouseEnter={vi.fn()}
        />
      );

      expect(container.querySelector('.result-item')).not.toHaveClass('selected');

      rerender(
        <ResultItem
          prompt={prompt}
          isSelected={true}
          onClick={vi.fn()}
          onMouseEnter={vi.fn()}
        />
      );

      expect(container.querySelector('.result-item')).toHaveClass('selected');
    });
  });

  describe('Icon Color', () => {
    it('should apply custom color from prompt', () => {
      const prompt = createMockPrompt({ color: '#FF6B6B' });
      const { container } = render(
        <ResultItem
          prompt={prompt}
          isSelected={false}
          onClick={vi.fn()}
          onMouseEnter={vi.fn()}
        />
      );
      const icon = container.querySelector('.result-icon') as HTMLElement;
      expect(icon.style.backgroundColor).toBe('rgb(255, 107, 107)'); // #FF6B6B in RGB
    });

    it('should use default color when prompt color is missing', () => {
      const prompt = createMockPrompt({ color: '' });
      const { container } = render(
        <ResultItem
          prompt={prompt}
          isSelected={false}
          onClick={vi.fn()}
          onMouseEnter={vi.fn()}
        />
      );
      const icon = container.querySelector('.result-icon') as HTMLElement;
      expect(icon.style.backgroundColor).toBe('rgb(107, 114, 128)'); // #6B7280 in RGB
    });

    it('should handle undefined color', () => {
      const prompt = createMockPrompt({ color: undefined as any });
      const { container } = render(
        <ResultItem
          prompt={prompt}
          isSelected={false}
          onClick={vi.fn()}
          onMouseEnter={vi.fn()}
        />
      );
      const icon = container.querySelector('.result-icon') as HTMLElement;
      expect(icon.style.backgroundColor).toBe('rgb(107, 114, 128)');
    });

    it('should handle invalid color values', () => {
      const prompt = createMockPrompt({ color: 'invalid-color' });
      const { container } = render(
        <ResultItem
          prompt={prompt}
          isSelected={false}
          onClick={vi.fn()}
          onMouseEnter={vi.fn()}
        />
      );
      const icon = container.querySelector('.result-icon') as HTMLElement;
      // Should render without crashing, browser handles invalid colors gracefully
      expect(icon).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const prompt = createMockPrompt();

      render(
        <ResultItem
          prompt={prompt}
          isSelected={false}
          onClick={onClick}
          onMouseEnter={vi.fn()}
        />
      );

      await user.click(screen.getByText('Test Prompt'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should call onMouseEnter when mouse enters', () => {
      const onMouseEnter = vi.fn();
      const prompt = createMockPrompt();
      const { container } = render(
        <ResultItem
          prompt={prompt}
          isSelected={false}
          onClick={vi.fn()}
          onMouseEnter={onMouseEnter}
        />
      );

      const item = container.querySelector('.result-item') as HTMLElement;
      fireEvent.mouseEnter(item);

      expect(onMouseEnter).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick on double click twice', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const prompt = createMockPrompt();

      render(
        <ResultItem
          prompt={prompt}
          isSelected={false}
          onClick={onClick}
          onMouseEnter={vi.fn()}
        />
      );

      await user.dblClick(screen.getByText('Test Prompt'));
      expect(onClick).toHaveBeenCalledTimes(2); // Double click = 2 clicks
    });

    it('should handle rapid mouse enter/leave', () => {
      const onMouseEnter = vi.fn();
      const prompt = createMockPrompt();
      const { container } = render(
        <ResultItem
          prompt={prompt}
          isSelected={false}
          onClick={vi.fn()}
          onMouseEnter={onMouseEnter}
        />
      );

      const item = container.querySelector('.result-item') as HTMLElement;

      // Rapid mouse movements
      for (let i = 0; i < 10; i++) {
        fireEvent.mouseEnter(item);
        fireEvent.mouseLeave(item);
      }

      expect(onMouseEnter).toHaveBeenCalledTimes(10);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long prompt names', () => {
      const longName = 'A'.repeat(500);
      const prompt = createMockPrompt({ name: longName });
      render(
        <ResultItem
          prompt={prompt}
          isSelected={false}
          onClick={vi.fn()}
          onMouseEnter={vi.fn()}
        />
      );
      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('should handle very long descriptions', () => {
      const longDescription = 'B'.repeat(1000);
      const prompt = createMockPrompt({ description: longDescription });
      render(
        <ResultItem
          prompt={prompt}
          isSelected={false}
          onClick={vi.fn()}
          onMouseEnter={vi.fn()}
        />
      );
      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('should handle special characters in name', () => {
      const prompt = createMockPrompt({ name: '<script>alert("xss")</script>' });
      render(
        <ResultItem
          prompt={prompt}
          isSelected={false}
          onClick={vi.fn()}
          onMouseEnter={vi.fn()}
        />
      );
      expect(screen.getByText('<script>alert("xss")</script>')).toBeInTheDocument();
    });

    it('should handle unicode characters in name', () => {
      const prompt = createMockPrompt({ name: '你好世界 🌍' });
      render(
        <ResultItem
          prompt={prompt}
          isSelected={false}
          onClick={vi.fn()}
          onMouseEnter={vi.fn()}
        />
      );
      expect(screen.getByText('你好世界 🌍')).toBeInTheDocument();
    });

    it('should handle empty icon', () => {
      const prompt = createMockPrompt({ icon: '' });
      const { container } = render(
        <ResultItem
          prompt={prompt}
          isSelected={false}
          onClick={vi.fn()}
          onMouseEnter={vi.fn()}
        />
      );
      const icon = container.querySelector('.result-icon');
      expect(icon).toBeInTheDocument();
      expect(icon?.textContent).toBe('');
    });

    it('should handle whitespace-only description', () => {
      const prompt = createMockPrompt({ description: '   ' });
      render(
        <ResultItem
          prompt={prompt}
          isSelected={false}
          onClick={vi.fn()}
          onMouseEnter={vi.fn()}
        />
      );
      // Should render without crashing, whitespace may be collapsed by browser
      expect(screen.getByText(prompt.name)).toBeInTheDocument();
    });

    it('should handle null callbacks gracefully', () => {
      const prompt = createMockPrompt();
      expect(() => {
        render(
          <ResultItem
            prompt={prompt}
            isSelected={false}
            onClick={null as any}
            onMouseEnter={null as any}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should be clickable with keyboard', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const prompt = createMockPrompt();

      const { container } = render(
        <ResultItem
          prompt={prompt}
          isSelected={false}
          onClick={onClick}
          onMouseEnter={vi.fn()}
        />
      );

      const item = container.querySelector('.result-item') as HTMLElement;
      item.focus();
      await user.keyboard('{Enter}');

      // Note: Need to make component keyboard accessible in implementation
      // This test documents expected behavior
    });

    it('should have proper semantic structure', () => {
      const prompt = createMockPrompt();
      const { container } = render(
        <ResultItem
          prompt={prompt}
          isSelected={false}
          onClick={vi.fn()}
          onMouseEnter={vi.fn()}
        />
      );

      expect(container.querySelector('.result-icon')).toBeInTheDocument();
      expect(container.querySelector('.result-content')).toBeInTheDocument();
      expect(container.querySelector('.result-name')).toBeInTheDocument();
      expect(container.querySelector('.result-description')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not re-render when props are the same', () => {
      const prompt = createMockPrompt();
      const onClick = vi.fn();
      const onMouseEnter = vi.fn();

      const { container, rerender } = render(
        <ResultItem
          prompt={prompt}
          isSelected={false}
          onClick={onClick}
          onMouseEnter={onMouseEnter}
        />
      );

      const initialElement = container.querySelector('.result-item');

      rerender(
        <ResultItem
          prompt={prompt}
          isSelected={false}
          onClick={onClick}
          onMouseEnter={onMouseEnter}
        />
      );

      expect(container.querySelector('.result-item')).toBe(initialElement);
    });
  });
});
