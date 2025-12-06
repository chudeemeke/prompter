import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContextModal } from './ContextModal';
import type { Prompt } from '../../lib/types';

const createMockPrompt = (overrides?: Partial<Prompt>): Prompt => ({
  id: '1',
  name: 'Test Prompt',
  description: 'Test Description',
  content: 'Test content with {{variable}}',
  folder: 'Test',
  icon: '📝',
  color: '#3B82F6',
  tags: ['test'],
  variables: [
    { name: 'variable', default: 'default value', required: true },
  ],
  auto_paste: true,
  is_favorite: false,
  created_at: '2025-11-30T10:00:00Z',
  updated_at: '2025-11-30T10:00:00Z',
  ...overrides,
});

describe('ContextModal', () => {
  describe('Rendering', () => {
    it('should render modal with prompt name', () => {
      const prompt = createMockPrompt({ name: 'AI News Summary' });
      render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      expect(screen.getByText(/Fill in variables for "AI News Summary"/)).toBeInTheDocument();
    });

    it('should render variable fields', () => {
      const prompt = createMockPrompt({
        variables: [
          { name: 'topic', default: 'AI', required: true },
          { name: 'timeframe', default: 'today', required: false },
        ],
      });
      render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      expect(screen.getByText('topic')).toBeInTheDocument();
      expect(screen.getByText('timeframe')).toBeInTheDocument();
    });

    it('should render required indicator for required variables', () => {
      const prompt = createMockPrompt({
        variables: [{ name: 'required-var', default: '', required: true }],
      });
      const { container } = render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      expect(container.querySelector('.required')).toBeInTheDocument();
    });

    it('should not render required indicator for optional variables', () => {
      const prompt = createMockPrompt({
        variables: [{ name: 'optional-var', default: '', required: false }],
      });
      const { container } = render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      const labels = container.querySelectorAll('label');
      let hasRequiredIndicator = false;
      labels.forEach(label => {
        if (label.textContent?.includes('optional-var') && label.querySelector('.required')) {
          hasRequiredIndicator = true;
        }
      });
      expect(hasRequiredIndicator).toBe(false);
    });

    it('should render cancel and confirm buttons', () => {
      const prompt = createMockPrompt();
      render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Use Prompt')).toBeInTheDocument();
    });

    it('should render overlay', () => {
      const prompt = createMockPrompt();
      const { container } = render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      expect(container.querySelector('.context-modal-overlay')).toBeInTheDocument();
    });

    it('should render modal content container', () => {
      const prompt = createMockPrompt();
      const { container } = render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      expect(container.querySelector('.context-modal')).toBeInTheDocument();
    });
  });

  describe('Default Values', () => {
    it('should pre-fill inputs with default values', () => {
      const prompt = createMockPrompt({
        variables: [
          { name: 'topic', default: 'AI', required: true },
          { name: 'timeframe', default: 'today', required: false },
        ],
      });
      render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      expect(screen.getByDisplayValue('AI')).toBeInTheDocument();
      expect(screen.getByDisplayValue('today')).toBeInTheDocument();
    });

    it('should handle empty default values', () => {
      const prompt = createMockPrompt({
        variables: [{ name: 'topic', default: '', required: false }],
      });
      render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      const input = screen.getByPlaceholderText('Enter topic');
      expect(input).toHaveValue('');
    });

    it('should handle undefined default values', () => {
      const prompt = createMockPrompt({
        variables: [{ name: 'topic', default: undefined as any, required: false }],
      });
      render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      const input = screen.getByPlaceholderText('Enter topic');
      expect(input).toHaveValue('');
    });

    it('should use default value as placeholder when empty', () => {
      const prompt = createMockPrompt({
        variables: [{ name: 'topic', default: 'AI', required: false }],
      });
      render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      expect(screen.getByPlaceholderText('AI')).toBeInTheDocument();
    });

    it('should fallback to "Enter [name]" when no default', () => {
      const prompt = createMockPrompt({
        variables: [{ name: 'custom', default: '', required: false }],
      });
      render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      expect(screen.getByPlaceholderText('Enter custom')).toBeInTheDocument();
    });
  });

  describe('Auto-focus', () => {
    it('should auto-focus first variable input', async () => {
      const prompt = createMockPrompt({
        variables: [
          { name: 'first', default: '', required: false },
          { name: 'second', default: '', required: false },
        ],
      });
      render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        const firstInput = screen.getByPlaceholderText('Enter first');
        expect(firstInput).toHaveFocus();
      });
    });

    it('should not auto-focus second variable', () => {
      const prompt = createMockPrompt({
        variables: [
          { name: 'first', default: '', required: false },
          { name: 'second', default: '', required: false },
        ],
      });
      render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      const secondInput = screen.getByPlaceholderText('Enter second');
      expect(secondInput).not.toHaveFocus();
    });
  });

  describe('User Input', () => {
    it('should update value when user types', async () => {
      const user = userEvent.setup();
      const prompt = createMockPrompt({
        variables: [{ name: 'topic', default: '', required: false }],
      });
      render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      const input = screen.getByPlaceholderText('Enter topic');
      await user.clear(input);
      await user.type(input, 'Machine Learning');

      expect(input).toHaveValue('Machine Learning');
    });

    it('should update multiple variable values independently', async () => {
      const user = userEvent.setup();
      const prompt = createMockPrompt({
        variables: [
          { name: 'topic', default: '', required: false },
          { name: 'timeframe', default: '', required: false },
        ],
      });
      render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      const topicInput = screen.getByPlaceholderText('Enter topic');
      const timeframeInput = screen.getByPlaceholderText('Enter timeframe');

      await user.type(topicInput, 'AI');
      await user.type(timeframeInput, 'today');

      expect(topicInput).toHaveValue('AI');
      expect(timeframeInput).toHaveValue('today');
    });

    it('should replace default value when user types', async () => {
      const user = userEvent.setup();
      const prompt = createMockPrompt({
        variables: [{ name: 'topic', default: 'AI', required: false }],
      });
      render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      const input = screen.getByDisplayValue('AI');
      await user.clear(input);
      await user.type(input, 'Quantum Computing');

      expect(input).toHaveValue('Quantum Computing');
    });

    it('should handle special characters in input', async () => {
      const user = userEvent.setup();
      const prompt = createMockPrompt({
        variables: [{ name: 'topic', default: '', required: false }],
      });
      render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      const input = screen.getByPlaceholderText('Enter topic');
      await user.type(input, '!@#$%^&*()');

      expect(input).toHaveValue('!@#$%^&*()');
    });

    it('should handle unicode characters in input', async () => {
      const user = userEvent.setup();
      const prompt = createMockPrompt({
        variables: [{ name: 'topic', default: '', required: false }],
      });
      render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      const input = screen.getByPlaceholderText('Enter topic');
      await user.type(input, '你好世界');

      expect(input).toHaveValue('你好世界');
    });
  });

  describe('Form Submission', () => {
    it('should call onConfirm with values when form submitted', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      const prompt = createMockPrompt({
        variables: [
          { name: 'topic', default: 'AI', required: false },
          { name: 'timeframe', default: 'today', required: false },
        ],
      });
      render(
        <ContextModal
          prompt={prompt}
          onConfirm={onConfirm}
          onCancel={vi.fn()}
        />
      );

      await user.click(screen.getByText('Use Prompt'));

      expect(onConfirm).toHaveBeenCalledWith({
        topic: 'AI',
        timeframe: 'today',
      });
    });

    it('should call onConfirm with updated values', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      const prompt = createMockPrompt({
        variables: [{ name: 'topic', default: 'AI', required: false }],
      });
      render(
        <ContextModal
          prompt={prompt}
          onConfirm={onConfirm}
          onCancel={vi.fn()}
        />
      );

      const input = screen.getByDisplayValue('AI');
      await user.clear(input);
      await user.type(input, 'Blockchain');
      await user.click(screen.getByText('Use Prompt'));

      expect(onConfirm).toHaveBeenCalledWith({ topic: 'Blockchain' });
    });

    it('should submit on Enter key press', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      const prompt = createMockPrompt({
        variables: [{ name: 'topic', default: 'AI', required: false }],
      });
      render(
        <ContextModal
          prompt={prompt}
          onConfirm={onConfirm}
          onCancel={vi.fn()}
        />
      );

      const input = screen.getByDisplayValue('AI');
      await user.type(input, '{Enter}');

      expect(onConfirm).toHaveBeenCalledWith({ topic: 'AI' });
    });

    it('should prevent default form submission behavior', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      const prompt = createMockPrompt({
        variables: [{ name: 'topic', default: '', required: false }],
      });
      const { container } = render(
        <ContextModal
          prompt={prompt}
          onConfirm={onConfirm}
          onCancel={vi.fn()}
        />
      );

      const form = container.querySelector('form') as HTMLFormElement;
      const preventDefaultSpy = vi.fn();
      form.addEventListener('submit', (e) => {
        preventDefaultSpy();
        e.preventDefault();
      });

      await user.click(screen.getByText('Use Prompt'));

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Cancel Behavior', () => {
    it('should call onCancel when cancel button clicked', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      const prompt = createMockPrompt();
      render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={onCancel}
        />
      );

      await user.click(screen.getByText('Cancel'));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when overlay clicked', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      const prompt = createMockPrompt();
      const { container } = render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={onCancel}
        />
      );

      const overlay = container.querySelector('.context-modal-overlay') as HTMLElement;
      await user.click(overlay);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should not call onCancel when modal content clicked', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      const prompt = createMockPrompt();
      const { container } = render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={onCancel}
        />
      );

      const modal = container.querySelector('.context-modal') as HTMLElement;
      await user.click(modal);

      expect(onCancel).not.toHaveBeenCalled();
    });

    it('should not submit form when cancel is clicked', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      const prompt = createMockPrompt();
      render(
        <ContextModal
          prompt={prompt}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      await user.click(screen.getByText('Cancel'));

      expect(onConfirm).not.toHaveBeenCalled();
      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('Required Validation', () => {
    it('should show required indicator (*) on required fields', () => {
      const prompt = createMockPrompt({
        variables: [{ name: 'topic', default: '', required: true }],
      });
      render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      // Check for required indicator
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should not show required indicator on optional fields', () => {
      const prompt = createMockPrompt({
        variables: [{ name: 'topic', default: '', required: false }],
      });
      render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      // Check no required indicator
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });

    it('should disable submit button when required field is empty', () => {
      const prompt = createMockPrompt({
        variables: [{ name: 'topic', default: '', required: true }],
      });
      render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      const submitButton = screen.getByRole('button', { name: /use prompt/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when required field has value', async () => {
      const user = userEvent.setup();
      const prompt = createMockPrompt({
        variables: [{ name: 'topic', default: '', required: true }],
      });
      render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      const input = screen.getByPlaceholderText('Enter topic');
      await user.type(input, 'test value');

      const submitButton = screen.getByRole('button', { name: /use prompt/i });
      expect(submitButton).not.toBeDisabled();
    });

    it('should prevent submission when required field is empty', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      const prompt = createMockPrompt({
        variables: [{ name: 'topic', default: '', required: true }],
      });
      render(
        <ContextModal
          prompt={prompt}
          onConfirm={onConfirm}
          onCancel={vi.fn()}
        />
      );

      const input = screen.getByPlaceholderText('Enter topic');
      await user.clear(input);
      await user.click(screen.getByText('Use Prompt'));

      // HTML5 validation should prevent submission
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty variables array', () => {
      const prompt = createMockPrompt({ variables: [] });
      const { container } = render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(container.querySelectorAll('.variable-field')).toHaveLength(0);
      expect(screen.getByText('Use Prompt')).toBeInTheDocument(); // Still has buttons
    });

    it('should handle undefined variables', () => {
      const prompt = createMockPrompt({ variables: undefined as any });
      const { container } = render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(container.querySelectorAll('.variable-field')).toHaveLength(0);
    });

    it('should handle variable names with special characters', () => {
      const prompt = createMockPrompt({
        variables: [{ name: 'var-with-dash', default: '', required: false }],
      });
      render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByText('var-with-dash')).toBeInTheDocument();
    });

    it('should handle very long variable names', () => {
      const longName = 'a'.repeat(100);
      const prompt = createMockPrompt({
        variables: [{ name: longName, default: '', required: false }],
      });
      render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('should handle many variables efficiently', () => {
      const manyVariables = Array.from({ length: 50 }, (_, i) => ({
        name: `var${i}`,
        default: `default${i}`,
        required: false,
      }));

      const prompt = createMockPrompt({ variables: manyVariables });
      const { container } = render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(container.querySelectorAll('.variable-field')).toHaveLength(50);
    });

    it('should handle prompt name with special characters', () => {
      const prompt = createMockPrompt({ name: '<script>alert("xss")</script>' });
      render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByText(/Fill in variables for "<script>alert\("xss"\)<\/script>"/)).toBeInTheDocument();
    });
  });

  describe('Keyboard Events', () => {
    it('should call onCancel when Escape key is pressed', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      const prompt = createMockPrompt({
        variables: [{ name: 'topic', default: 'AI', required: false }],
      });
      render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={onCancel}
        />
      );

      const input = screen.getByDisplayValue('AI');
      await user.type(input, '{Escape}');

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should not submit on Enter if validation fails', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      const prompt = createMockPrompt({
        variables: [{ name: 'required_field', default: '', required: true }],
      });
      render(
        <ContextModal
          prompt={prompt}
          onConfirm={onConfirm}
          onCancel={vi.fn()}
        />
      );

      const input = screen.getByPlaceholderText('Enter required_field');
      // Input is empty and required, so Enter should not submit
      await user.type(input, '{Enter}');

      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('should submit on Enter if validation passes', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      const prompt = createMockPrompt({
        variables: [{ name: 'required_field', default: '', required: true }],
      });
      render(
        <ContextModal
          prompt={prompt}
          onConfirm={onConfirm}
          onCancel={vi.fn()}
        />
      );

      const input = screen.getByPlaceholderText('Enter required_field');
      await user.type(input, 'valid value');
      await user.keyboard('{Enter}');

      expect(onConfirm).toHaveBeenCalledWith({ required_field: 'valid value' });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should allow Tab navigation between fields', async () => {
      const user = userEvent.setup();
      const prompt = createMockPrompt({
        variables: [
          { name: 'first', default: '', required: false },
          { name: 'second', default: '', required: false },
        ],
      });
      render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      const firstInput = screen.getByPlaceholderText('Enter first');
      const secondInput = screen.getByPlaceholderText('Enter second');

      await waitFor(() => expect(firstInput).toHaveFocus());

      await user.tab();
      expect(secondInput).toHaveFocus();
    });

    it('should allow Shift+Tab reverse navigation', async () => {
      const user = userEvent.setup();
      const prompt = createMockPrompt({
        variables: [
          { name: 'first', default: '', required: false },
          { name: 'second', default: '', required: false },
        ],
      });
      render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      const secondInput = screen.getByPlaceholderText('Enter second');

      await user.tab();
      await user.tab();
      await user.tab({ shift: true });

      expect(secondInput).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('should have proper label associations', () => {
      const prompt = createMockPrompt({
        variables: [{ name: 'topic', default: '', required: false }],
      });
      const { container } = render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      const labels = container.querySelectorAll('label');
      expect(labels.length).toBeGreaterThan(0);
    });

    it('should have proper button types', () => {
      const prompt = createMockPrompt();
      render(
        <ContextModal
          prompt={prompt}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      const confirmButton = screen.getByText('Use Prompt');

      expect(cancelButton).toHaveAttribute('type', 'button');
      expect(confirmButton).toHaveAttribute('type', 'submit');
    });
  });
});
