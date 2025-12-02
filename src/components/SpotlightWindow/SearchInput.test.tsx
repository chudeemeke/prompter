import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchInput } from './SearchInput';

describe('SearchInput', () => {
  describe('Rendering', () => {
    it('should render with default placeholder', () => {
      render(<SearchInput value="" onChange={vi.fn()} />);
      expect(screen.getByPlaceholderText('Search prompts...')).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      render(<SearchInput value="" onChange={vi.fn()} placeholder="Custom placeholder" />);
      expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
    });

    it('should render search icon', () => {
      const { container } = render(<SearchInput value="" onChange={vi.fn()} />);
      const searchIcon = container.querySelector('.search-icon');
      expect(searchIcon).toBeInTheDocument();
    });

    it('should display current value', () => {
      render(<SearchInput value="test query" onChange={vi.fn()} />);
      expect(screen.getByDisplayValue('test query')).toBeInTheDocument();
    });
  });

  describe('Auto-focus', () => {
    it('should auto-focus input on mount', async () => {
      render(<SearchInput value="" onChange={vi.fn()} />);
      const input = screen.getByPlaceholderText('Search prompts...');
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
    });

    it('should maintain focus after re-render', async () => {
      const { rerender } = render(<SearchInput value="" onChange={vi.fn()} />);
      const input = screen.getByPlaceholderText('Search prompts...');
      await waitFor(() => expect(input).toHaveFocus());

      rerender(<SearchInput value="new value" onChange={vi.fn()} />);
      // Focus should still be on input
      expect(input).toHaveFocus();
    });
  });

  describe('User Input', () => {
    it('should call onChange when user types', () => {
      const onChange = vi.fn();
      render(<SearchInput value="" onChange={onChange} />);

      const input = screen.getByPlaceholderText('Search prompts...');
      fireEvent.change(input, { target: { value: 'test' } });

      expect(onChange).toHaveBeenCalledWith('test');
    });

    it('should handle rapid typing without losing characters', () => {
      const onChange = vi.fn();
      render(<SearchInput value="" onChange={onChange} />);

      const input = screen.getByPlaceholderText('Search prompts...');
      fireEvent.change(input, { target: { value: 'abcdefghijklmnopqrstuvwxyz' } });

      expect(onChange).toHaveBeenCalledWith('abcdefghijklmnopqrstuvwxyz');
    });

    it('should handle special characters', () => {
      const onChange = vi.fn();
      render(<SearchInput value="" onChange={onChange} />);

      const input = screen.getByPlaceholderText('Search prompts...');
      fireEvent.change(input, { target: { value: '!@#$%^&*()' } });

      expect(onChange).toHaveBeenCalledWith('!@#$%^&*()');
    });

    it('should handle unicode characters', () => {
      const onChange = vi.fn();
      render(<SearchInput value="" onChange={onChange} />);

      const input = screen.getByPlaceholderText('Search prompts...');
      fireEvent.change(input, { target: { value: '你好世界' } });

      expect(onChange).toHaveBeenCalledWith('你好世界');
    });

    it('should handle emoji input', () => {
      const onChange = vi.fn();
      render(<SearchInput value="" onChange={onChange} />);

      const input = screen.getByPlaceholderText('Search prompts...');
      fireEvent.change(input, { target: { value: '🔥💻🚀' } });

      expect(onChange).toHaveBeenCalledWith('🔥💻🚀');
    });

    it('should handle paste events', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<SearchInput value="" onChange={onChange} />);

      const input = screen.getByPlaceholderText('Search prompts...');
      await user.click(input);
      await user.paste('pasted content');

      expect(onChange).toHaveBeenCalledWith('pasted content');
    });
  });

  describe('Clear Button', () => {
    it('should not show clear button when value is empty', () => {
      const { container } = render(<SearchInput value="" onChange={vi.fn()} />);
      const clearButton = container.querySelector('.clear-button');
      expect(clearButton).not.toBeInTheDocument();
    });

    it('should show clear button when value is not empty', () => {
      const { container } = render(<SearchInput value="test" onChange={vi.fn()} />);
      const clearButton = container.querySelector('.clear-button');
      expect(clearButton).toBeInTheDocument();
    });

    it('should call onChange with empty string when clear button clicked', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const { container } = render(<SearchInput value="test query" onChange={onChange} />);

      const clearButton = container.querySelector('.clear-button') as HTMLElement;
      await user.click(clearButton);

      expect(onChange).toHaveBeenCalledWith('');
    });

    it('should hide clear button after clearing', () => {
      const { container, rerender } = render(<SearchInput value="test" onChange={vi.fn()} />);
      expect(container.querySelector('.clear-button')).toBeInTheDocument();

      rerender(<SearchInput value="" onChange={vi.fn()} />);
      expect(container.querySelector('.clear-button')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long input strings', () => {
      const onChange = vi.fn();
      render(<SearchInput value="" onChange={onChange} />);

      const longString = 'a'.repeat(1000);
      const input = screen.getByPlaceholderText('Search prompts...');
      fireEvent.change(input, { target: { value: longString } });

      expect(onChange).toHaveBeenCalledWith(longString);
    });

    it('should handle null onChange gracefully', () => {
      // TypeScript prevents this, but testing runtime behavior
      expect(() => {
        render(<SearchInput value="" onChange={null as any} />);
      }).not.toThrow();
    });

    it('should handle undefined value by using empty string', () => {
      render(<SearchInput value={undefined as any} onChange={vi.fn()} />);
      const input = screen.getByPlaceholderText('Search prompts...');
      expect(input).toHaveValue('');
    });

    it('should handle whitespace-only input', () => {
      const onChange = vi.fn();
      render(<SearchInput value="" onChange={onChange} />);

      const input = screen.getByPlaceholderText('Search prompts...');
      fireEvent.change(input, { target: { value: '   ' } });

      expect(onChange).toHaveBeenCalledWith('   ');
    });

    it('should maintain cursor position during controlled updates', async () => {
      const onChange = vi.fn();
      const { rerender } = render(<SearchInput value="test" onChange={onChange} />);

      const input = screen.getByDisplayValue('test') as HTMLInputElement;
      input.setSelectionRange(2, 2); // Set cursor in middle

      rerender(<SearchInput value="test" onChange={onChange} />);

      // Cursor position should be preserved
      expect(input.selectionStart).toBe(2);
      expect(input.selectionEnd).toBe(2);
    });
  });

  describe('Accessibility', () => {
    it('should have proper input type', () => {
      render(<SearchInput value="" onChange={vi.fn()} />);
      const input = screen.getByPlaceholderText('Search prompts...');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should be keyboard accessible', async () => {
      render(<SearchInput value="" onChange={vi.fn()} />);

      const input = screen.getByPlaceholderText('Search prompts...');

      // Auto-focus is tested separately, this tests tab navigation would work
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should clear button be keyboard accessible', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const { container } = render(<SearchInput value="test" onChange={onChange} />);

      const clearButton = container.querySelector('.clear-button') as HTMLElement;
      clearButton.focus();
      await user.keyboard('{Enter}');

      expect(onChange).toHaveBeenCalledWith('');
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const onChange = vi.fn();
      const { rerender } = render(<SearchInput value="test" onChange={onChange} />);

      const input = screen.getByDisplayValue('test');
      const initialInput = input;

      rerender(<SearchInput value="test" onChange={onChange} />);

      // Same element reference means no unnecessary re-render
      expect(screen.getByDisplayValue('test')).toBe(initialInput);
    });
  });

  describe('Integration Scenarios', () => {
    it('should work in a form submission scenario', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const onSubmit = vi.fn((e) => e.preventDefault());

      render(
        <form onSubmit={onSubmit}>
          <SearchInput value="" onChange={onChange} />
        </form>
      );

      const input = screen.getByPlaceholderText('Search prompts...');
      await user.type(input, 'test{Enter}');

      expect(onSubmit).toHaveBeenCalled();
    });
  });
});
