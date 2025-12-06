import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToastContext, useToastContextSafe } from './ToastContext';

// Test component that uses toast context
function TestComponent() {
  const toast = useToastContext();
  return (
    <div>
      <button onClick={() => toast.success('Success Title', 'Success message')}>
        Show Success
      </button>
      <button onClick={() => toast.error('Error Title', 'Error message')}>
        Show Error
      </button>
      <button onClick={() => toast.warning('Warning Title', 'Warning message')}>
        Show Warning
      </button>
      <button onClick={() => toast.info('Info Title', 'Info message')}>
        Show Info
      </button>
      <button onClick={() => toast.clearToasts()}>Clear All</button>
    </div>
  );
}

// Test component that uses safe version
function SafeTestComponent() {
  const toast = useToastContextSafe();
  return (
    <div>
      <span data-testid="has-context">{toast ? 'yes' : 'no'}</span>
      {toast && (
        <button onClick={() => toast.success('Safe Success')}>
          Show Toast Safely
        </button>
      )}
    </div>
  );
}

describe('ToastContext', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('ToastProvider', () => {
    it('should render children', () => {
      render(
        <ToastProvider>
          <div data-testid="child">Child Content</div>
        </ToastProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should provide toast context to children', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      expect(screen.getByText('Show Success')).toBeInTheDocument();
    });
  });

  describe('useToastContext', () => {
    it('should throw error when used outside ToastProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useToastContext must be used within a ToastProvider');

      consoleSpy.mockRestore();
    });

    it('should show success toast', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Success'));

      expect(screen.getByText('Success Title')).toBeInTheDocument();
      expect(screen.getByText('Success message')).toBeInTheDocument();
    });

    it('should show error toast', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Error'));

      expect(screen.getByText('Error Title')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('should show warning toast', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Warning'));

      expect(screen.getByText('Warning Title')).toBeInTheDocument();
      expect(screen.getByText('Warning message')).toBeInTheDocument();
    });

    it('should show info toast', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Info'));

      expect(screen.getByText('Info Title')).toBeInTheDocument();
      expect(screen.getByText('Info message')).toBeInTheDocument();
    });

    it('should auto-dismiss toast after duration', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Success'));
      expect(screen.getByText('Success Title')).toBeInTheDocument();

      // Success toasts have 5000ms duration by default
      act(() => {
        vi.advanceTimersByTime(5100);
      });

      expect(screen.queryByText('Success Title')).not.toBeInTheDocument();
    });

    it('should allow manual dismiss via button', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Success'));
      expect(screen.getByText('Success Title')).toBeInTheDocument();

      // Find and click the dismiss button (X icon)
      const dismissButton = screen.getByLabelText('Dismiss');
      await user.click(dismissButton);

      expect(screen.queryByText('Success Title')).not.toBeInTheDocument();
    });

    it('should clear all toasts', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      // Show multiple toasts
      await user.click(screen.getByText('Show Success'));
      await user.click(screen.getByText('Show Error'));

      expect(screen.getByText('Success Title')).toBeInTheDocument();
      expect(screen.getByText('Error Title')).toBeInTheDocument();

      // Clear all
      await user.click(screen.getByText('Clear All'));

      expect(screen.queryByText('Success Title')).not.toBeInTheDocument();
      expect(screen.queryByText('Error Title')).not.toBeInTheDocument();
    });

    it('should show multiple toasts simultaneously', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Success'));
      await user.click(screen.getByText('Show Error'));
      await user.click(screen.getByText('Show Warning'));

      expect(screen.getByText('Success Title')).toBeInTheDocument();
      expect(screen.getByText('Error Title')).toBeInTheDocument();
      expect(screen.getByText('Warning Title')).toBeInTheDocument();
    });
  });

  describe('useToastContextSafe', () => {
    it('should return null when used outside ToastProvider', () => {
      render(<SafeTestComponent />);

      expect(screen.getByTestId('has-context')).toHaveTextContent('no');
    });

    it('should return context when used inside ToastProvider', () => {
      render(
        <ToastProvider>
          <SafeTestComponent />
        </ToastProvider>
      );

      expect(screen.getByTestId('has-context')).toHaveTextContent('yes');
    });

    it('should work with toast functions when context is available', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <ToastProvider>
          <SafeTestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Toast Safely'));

      expect(screen.getByText('Safe Success')).toBeInTheDocument();
    });
  });

  describe('Toast accessibility', () => {
    it('should have role="alert" for notifications', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Success'));

      // Toast should have alert role for accessibility
      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThan(0);
    });

    it('should render dismiss button with accessible label', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Success'));

      expect(screen.getByLabelText('Dismiss')).toBeInTheDocument();
    });
  });
});
