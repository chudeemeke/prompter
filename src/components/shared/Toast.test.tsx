import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastContainer, useToasts } from './Toast';
import type { Toast } from '../../lib/types';

// =============================================================================
// TESTS: ToastContainer Component
// =============================================================================

describe('ToastContainer', () => {
  const mockDismiss = vi.fn();

  beforeEach(() => {
    mockDismiss.mockClear();
  });

  describe('Rendering', () => {
    it('should return null when no toasts', () => {
      const { container } = render(
        <ToastContainer toasts={[]} onDismiss={mockDismiss} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render single toast', () => {
      const toasts: Toast[] = [
        { id: '1', type: 'success', title: 'Success!' },
      ];

      render(<ToastContainer toasts={toasts} onDismiss={mockDismiss} />);

      expect(screen.getByText('Success!')).toBeInTheDocument();
    });

    it('should render multiple toasts', () => {
      const toasts: Toast[] = [
        { id: '1', type: 'success', title: 'Success!' },
        { id: '2', type: 'error', title: 'Error!' },
        { id: '3', type: 'info', title: 'Info!' },
      ];

      render(<ToastContainer toasts={toasts} onDismiss={mockDismiss} />);

      expect(screen.getByText('Success!')).toBeInTheDocument();
      expect(screen.getByText('Error!')).toBeInTheDocument();
      expect(screen.getByText('Info!')).toBeInTheDocument();
    });
  });

  describe('Toast Types', () => {
    it('should render success toast with green styling', () => {
      const toasts: Toast[] = [
        { id: '1', type: 'success', title: 'Success!' },
      ];

      render(<ToastContainer toasts={toasts} onDismiss={mockDismiss} />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-green-900/90');
    });

    it('should render error toast with red styling', () => {
      const toasts: Toast[] = [
        { id: '1', type: 'error', title: 'Error!' },
      ];

      render(<ToastContainer toasts={toasts} onDismiss={mockDismiss} />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-red-900/90');
    });

    it('should render warning toast with yellow styling', () => {
      const toasts: Toast[] = [
        { id: '1', type: 'warning', title: 'Warning!' },
      ];

      render(<ToastContainer toasts={toasts} onDismiss={mockDismiss} />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-yellow-900/90');
    });

    it('should render info toast with blue styling', () => {
      const toasts: Toast[] = [
        { id: '1', type: 'info', title: 'Info!' },
      ];

      render(<ToastContainer toasts={toasts} onDismiss={mockDismiss} />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-blue-900/90');
    });
  });

  describe('Toast Content', () => {
    it('should render toast title', () => {
      const toasts: Toast[] = [
        { id: '1', type: 'success', title: 'Test Title' },
      ];

      render(<ToastContainer toasts={toasts} onDismiss={mockDismiss} />);

      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('should render toast message when provided', () => {
      const toasts: Toast[] = [
        { id: '1', type: 'success', title: 'Title', message: 'Additional details' },
      ];

      render(<ToastContainer toasts={toasts} onDismiss={mockDismiss} />);

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Additional details')).toBeInTheDocument();
    });

    it('should not render message when not provided', () => {
      const toasts: Toast[] = [
        { id: '1', type: 'success', title: 'Title Only' },
      ];

      render(<ToastContainer toasts={toasts} onDismiss={mockDismiss} />);

      expect(screen.getByText('Title Only')).toBeInTheDocument();
      // Only the title should be rendered, no message element
      expect(screen.getByRole('alert').querySelectorAll('p')).toHaveLength(1);
    });
  });

  describe('Dismiss', () => {
    it('should call onDismiss when dismiss button clicked', async () => {
      const user = userEvent.setup();
      const toasts: Toast[] = [
        { id: 'toast-123', type: 'success', title: 'Success!' },
      ];

      render(<ToastContainer toasts={toasts} onDismiss={mockDismiss} />);

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      await user.click(dismissButton);

      expect(mockDismiss).toHaveBeenCalledWith('toast-123');
    });

    it('should auto-dismiss after duration', async () => {
      vi.useFakeTimers();

      const toasts: Toast[] = [
        { id: 'toast-123', type: 'success', title: 'Success!', duration: 1000 },
      ];

      render(<ToastContainer toasts={toasts} onDismiss={mockDismiss} />);

      expect(mockDismiss).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockDismiss).toHaveBeenCalledWith('toast-123');

      vi.useRealTimers();
    });

    it('should not auto-dismiss when duration is 0', async () => {
      vi.useFakeTimers();

      const toasts: Toast[] = [
        { id: 'toast-123', type: 'success', title: 'Persistent!', duration: 0 },
      ];

      render(<ToastContainer toasts={toasts} onDismiss={mockDismiss} />);

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(mockDismiss).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should not auto-dismiss when duration is not provided', async () => {
      vi.useFakeTimers();

      const toasts: Toast[] = [
        { id: 'toast-123', type: 'success', title: 'No Duration' },
      ];

      render(<ToastContainer toasts={toasts} onDismiss={mockDismiss} />);

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      // Without duration, should not auto-dismiss
      expect(mockDismiss).not.toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('Accessibility', () => {
    it('should have role="alert" on toast', () => {
      const toasts: Toast[] = [
        { id: '1', type: 'success', title: 'Success!' },
      ];

      render(<ToastContainer toasts={toasts} onDismiss={mockDismiss} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should have accessible dismiss button', () => {
      const toasts: Toast[] = [
        { id: '1', type: 'success', title: 'Success!' },
      ];

      render(<ToastContainer toasts={toasts} onDismiss={mockDismiss} />);

      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
    });
  });
});

// =============================================================================
// TESTS: useToasts Hook
// =============================================================================

describe('useToasts', () => {
  // Test component that uses the hook
  function ToastTestComponent() {
    const {
      toasts,
      addToast,
      dismissToast,
      clearToasts,
      success,
      error,
      warning,
      info,
    } = useToasts();

    return (
      <div>
        <button onClick={() => addToast({ type: 'success', title: 'Added' })}>
          Add Toast
        </button>
        <button onClick={() => success('Success Title', 'Success message')}>
          Add Success
        </button>
        <button onClick={() => error('Error Title', 'Error message')}>
          Add Error
        </button>
        <button onClick={() => warning('Warning Title', 'Warning message')}>
          Add Warning
        </button>
        <button onClick={() => info('Info Title', 'Info message')}>
          Add Info
        </button>
        <button onClick={clearToasts}>
          Clear All
        </button>
        <div data-testid="toast-count">{toasts.length}</div>
        {toasts.map((t) => (
          <div key={t.id} data-testid={`toast-${t.id}`}>
            <span data-testid={`toast-type-${t.id}`}>{t.type}</span>
            <span data-testid={`toast-title-${t.id}`}>{t.title}</span>
            <span data-testid={`toast-message-${t.id}`}>{t.message}</span>
            <button onClick={() => dismissToast(t.id)}>Dismiss {t.id}</button>
          </div>
        ))}
      </div>
    );
  }

  describe('addToast', () => {
    it('should add a toast with generated id', async () => {
      const user = userEvent.setup();

      render(<ToastTestComponent />);

      expect(screen.getByTestId('toast-count')).toHaveTextContent('0');

      await user.click(screen.getByText('Add Toast'));

      expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
    });

    it('should add toast with default duration of 5000', async () => {
      const user = userEvent.setup();
      let capturedToasts: Toast[] = [];

      function CaptureComponent() {
        const { toasts, addToast } = useToasts();
        capturedToasts = toasts;
        return (
          <button onClick={() => addToast({ type: 'success', title: 'Test' })}>
            Add
          </button>
        );
      }

      render(<CaptureComponent />);
      await user.click(screen.getByText('Add'));

      expect(capturedToasts[0].duration).toBe(5000);
    });
  });

  describe('dismissToast', () => {
    it('should remove a specific toast by id', async () => {
      const user = userEvent.setup();

      render(<ToastTestComponent />);

      await user.click(screen.getByText('Add Toast'));
      expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

      // Find the dismiss button for the toast we just added
      const dismissButtons = screen.getAllByRole('button').filter(
        btn => btn.textContent?.includes('Dismiss')
      );
      await user.click(dismissButtons[0]);

      expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
    });
  });

  describe('clearToasts', () => {
    it('should remove all toasts', async () => {
      const user = userEvent.setup();

      render(<ToastTestComponent />);

      // Add multiple toasts
      await user.click(screen.getByText('Add Toast'));
      await user.click(screen.getByText('Add Toast'));
      await user.click(screen.getByText('Add Toast'));

      expect(screen.getByTestId('toast-count')).toHaveTextContent('3');

      await user.click(screen.getByText('Clear All'));

      expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
    });
  });

  describe('Convenience Methods', () => {
    it('should add success toast with correct type', async () => {
      const user = userEvent.setup();
      let capturedToasts: Toast[] = [];

      function CaptureComponent() {
        const { toasts, success } = useToasts();
        capturedToasts = toasts;
        return (
          <button onClick={() => success('Title', 'Message')}>
            Add
          </button>
        );
      }

      render(<CaptureComponent />);
      await user.click(screen.getByText('Add'));

      expect(capturedToasts[0].type).toBe('success');
      expect(capturedToasts[0].title).toBe('Title');
      expect(capturedToasts[0].message).toBe('Message');
    });

    it('should add error toast with longer duration (8000)', async () => {
      const user = userEvent.setup();
      let capturedToasts: Toast[] = [];

      function CaptureComponent() {
        const { toasts, error } = useToasts();
        capturedToasts = toasts;
        return (
          <button onClick={() => error('Error Title', 'Error Message')}>
            Add
          </button>
        );
      }

      render(<CaptureComponent />);
      await user.click(screen.getByText('Add'));

      expect(capturedToasts[0].type).toBe('error');
      expect(capturedToasts[0].title).toBe('Error Title');
      expect(capturedToasts[0].message).toBe('Error Message');
      expect(capturedToasts[0].duration).toBe(8000);
    });

    it('should add warning toast with correct type', async () => {
      const user = userEvent.setup();
      let capturedToasts: Toast[] = [];

      function CaptureComponent() {
        const { toasts, warning } = useToasts();
        capturedToasts = toasts;
        return (
          <button onClick={() => warning('Warning Title', 'Warning Message')}>
            Add
          </button>
        );
      }

      render(<CaptureComponent />);
      await user.click(screen.getByText('Add'));

      expect(capturedToasts[0].type).toBe('warning');
      expect(capturedToasts[0].title).toBe('Warning Title');
      expect(capturedToasts[0].message).toBe('Warning Message');
    });

    it('should add info toast with correct type', async () => {
      const user = userEvent.setup();
      let capturedToasts: Toast[] = [];

      function CaptureComponent() {
        const { toasts, info } = useToasts();
        capturedToasts = toasts;
        return (
          <button onClick={() => info('Info Title', 'Info Message')}>
            Add
          </button>
        );
      }

      render(<CaptureComponent />);
      await user.click(screen.getByText('Add'));

      expect(capturedToasts[0].type).toBe('info');
      expect(capturedToasts[0].title).toBe('Info Title');
      expect(capturedToasts[0].message).toBe('Info Message');
    });

    it('should work without message parameter', async () => {
      const user = userEvent.setup();
      let capturedToasts: Toast[] = [];

      function CaptureComponent() {
        const { toasts, success, error, warning, info } = useToasts();
        capturedToasts = toasts;
        return (
          <>
            <button onClick={() => success('S')}>S</button>
            <button onClick={() => error('E')}>E</button>
            <button onClick={() => warning('W')}>W</button>
            <button onClick={() => info('I')}>I</button>
          </>
        );
      }

      render(<CaptureComponent />);
      await user.click(screen.getByText('S'));
      await user.click(screen.getByText('E'));
      await user.click(screen.getByText('W'));
      await user.click(screen.getByText('I'));

      expect(capturedToasts).toHaveLength(4);
      expect(capturedToasts[0].message).toBeUndefined();
      expect(capturedToasts[1].message).toBeUndefined();
      expect(capturedToasts[2].message).toBeUndefined();
      expect(capturedToasts[3].message).toBeUndefined();
    });
  });

  describe('Toast ID Generation', () => {
    it('should generate unique IDs for each toast', async () => {
      const user = userEvent.setup();
      let capturedToasts: Toast[] = [];

      function CaptureComponent() {
        const { toasts, addToast } = useToasts();
        capturedToasts = toasts;
        return (
          <button onClick={() => addToast({ type: 'success', title: 'Test' })}>
            Add
          </button>
        );
      }

      render(<CaptureComponent />);

      await user.click(screen.getByText('Add'));
      await user.click(screen.getByText('Add'));
      await user.click(screen.getByText('Add'));

      const ids = capturedToasts.map(t => t.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(3);
      expect(ids.every(id => id.startsWith('toast-'))).toBe(true);
    });
  });
});
