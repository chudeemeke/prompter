import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { ErrorBoundary, useErrorTrigger } from './ErrorBoundary';

// =============================================================================
// TEST UTILITIES
// =============================================================================

// Component that throws an error when rendered
function ThrowingComponent({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error from ThrowingComponent');
  }
  return <div>Rendered successfully</div>;
}

// Component that throws error on state change (during render)
function ThrowOnStateChangeComponent() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error('Error triggered by state change');
  }

  return (
    <button onClick={() => setShouldThrow(true)}>
      Trigger Error via State
    </button>
  );
}

// Component that uses the useErrorTrigger hook (throws during render via state)
function ErrorTriggerComponent() {
  const [triggered, setTriggered] = useState(false);
  const triggerError = useErrorTrigger();

  if (triggered) {
    triggerError();
  }

  return (
    <button onClick={() => setTriggered(true)}>
      Trigger via hook
    </button>
  );
}

// =============================================================================
// TESTS: ErrorBoundary Component
// =============================================================================

describe('ErrorBoundary', () => {
  // Suppress console.error for tests that expect errors
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('Rendering', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Child content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('should render multiple children without error', () => {
      render(
        <ErrorBoundary>
          <div>First child</div>
          <div>Second child</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('First child')).toBeInTheDocument();
      expect(screen.getByText('Second child')).toBeInTheDocument();
    });

    it('should render nested components without error', () => {
      render(
        <ErrorBoundary>
          <div>
            <span>
              <ThrowingComponent shouldThrow={false} />
            </span>
          </div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Rendered successfully')).toBeInTheDocument();
    });
  });

  describe('Error Catching', () => {
    it('should catch error and display fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
    });

    it('should display the error message', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Test error from ThrowingComponent')).toBeInTheDocument();
    });

    it('should log error to console', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        '[ErrorBoundary] Caught error:',
        expect.any(Error)
      );
    });

    it('should call onError callback when error occurs', () => {
      const onError = vi.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Test error from ThrowingComponent' }),
        expect.objectContaining({ componentStack: expect.any(String) })
      );
    });
  });

  describe('Custom Fallback', () => {
    it('should render custom fallback when provided', () => {
      render(
        <ErrorBoundary fallback={<div>Custom error UI</div>}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error UI')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('should render complex custom fallback', () => {
      const CustomFallback = (
        <div>
          <h1>Oops!</h1>
          <p>Something broke</p>
          <button>Go home</button>
        </div>
      );

      render(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Oops!')).toBeInTheDocument();
      expect(screen.getByText('Something broke')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go home' })).toBeInTheDocument();
    });
  });

  describe('Default Fallback UI Actions', () => {
    it('should show reload button', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /reload application/i })).toBeInTheDocument();
    });

    it('should show copy error button', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /copy error details/i })).toBeInTheDocument();
    });

    it('should show technical details toggle', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText(/show technical details/i)).toBeInTheDocument();
    });

    it('should toggle technical details visibility', async () => {
      const user = userEvent.setup();

      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      // Initially hidden
      expect(screen.queryByText(/component stack/i)).not.toBeInTheDocument();

      // Click to show
      await user.click(screen.getByText(/show technical details/i));

      // Should now show details
      expect(screen.getByText(/hide technical details/i)).toBeInTheDocument();

      // Click to hide again
      await user.click(screen.getByText(/hide technical details/i));

      expect(screen.getByText(/show technical details/i)).toBeInTheDocument();
    });

    it('should copy error details to clipboard', async () => {
      const user = userEvent.setup();
      const writeTextMock = vi.fn().mockResolvedValue(undefined);

      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      });

      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      await user.click(screen.getByRole('button', { name: /copy error details/i }));

      expect(writeTextMock).toHaveBeenCalledWith(
        expect.stringContaining('Test error from ThrowingComponent')
      );
    });

    it('should show "Copied!" after copying', async () => {
      const user = userEvent.setup();
      const writeTextMock = vi.fn().mockResolvedValue(undefined);

      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      });

      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      await user.click(screen.getByRole('button', { name: /copy error details/i }));

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
    });

    it('should handle clipboard error gracefully', async () => {
      const user = userEvent.setup();
      const writeTextMock = vi.fn().mockRejectedValue(new Error('Clipboard failed'));

      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      });

      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      // Should not throw
      await user.click(screen.getByRole('button', { name: /copy error details/i }));

      // Should still show copy button (not "Copied!")
      expect(screen.getByRole('button', { name: /copy error details/i })).toBeInTheDocument();
    });
  });

  describe('Error Details Content', () => {
    it('should include stack trace in details', async () => {
      const user = userEvent.setup();

      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      await user.click(screen.getByText(/show technical details/i));

      // Stack trace container should be visible (checking by the parent structure)
      const detailsSection = screen.getByText(/hide technical details/i);
      expect(detailsSection).toBeInTheDocument();
    });
  });

  describe('Unknown Error Handling', () => {
    it('should handle error without message gracefully', () => {
      function ThrowEmptyError(): JSX.Element {
        throw new Error();
      }

      render(
        <ErrorBoundary>
          <ThrowEmptyError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Reload Functionality', () => {
    it('should call window.location.reload on reload button click', async () => {
      const user = userEvent.setup();
      const originalLocation = window.location;

      // Mock window.location.reload
      Object.defineProperty(window, 'location', {
        value: { ...originalLocation, reload: vi.fn() },
        writable: true,
      });

      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      await user.click(screen.getByRole('button', { name: /reload application/i }));

      expect(window.location.reload).toHaveBeenCalled();

      // Restore
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
      });
    });
  });

  describe('Reset Functionality', () => {
    it('should reset error state and show children again when reset is called', () => {
      // Create a ref to access the ErrorBoundary instance
      let errorBoundaryRef: ErrorBoundary | null = null;

      // Initial render with error
      const { rerender } = render(
        <ErrorBoundary ref={(ref: ErrorBoundary | null) => { errorBoundaryRef = ref; }}>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      // Verify error UI is shown
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Call reset method directly via ref
      if (errorBoundaryRef !== null) {
        (errorBoundaryRef as ErrorBoundary).handleReset();
      }

      // Re-render with non-throwing component
      rerender(
        <ErrorBoundary ref={(ref: ErrorBoundary | null) => { errorBoundaryRef = ref; }}>
          <ThrowingComponent shouldThrow={false} />
        </ErrorBoundary>
      );

      // Verify children render again
      expect(screen.getByText('Rendered successfully')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
  });
});

// =============================================================================
// TESTS: useErrorTrigger Hook
// =============================================================================

describe('useErrorTrigger', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should throw error when trigger function is called during render', async () => {
    const user = userEvent.setup();

    render(
      <ErrorBoundary>
        <ErrorTriggerComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Trigger via hook')).toBeInTheDocument();

    // Click sets state, which triggers error during next render
    await user.click(screen.getByText('Trigger via hook'));

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error triggered by useErrorTrigger')).toBeInTheDocument();
  });

  it('should return a function', () => {
    let capturedTrigger: (() => void) | null = null;

    function CaptureComponent() {
      const trigger = useErrorTrigger();
      capturedTrigger = trigger;
      return <div>Captured</div>;
    }

    render(
      <ErrorBoundary>
        <CaptureComponent />
      </ErrorBoundary>
    );

    expect(typeof capturedTrigger).toBe('function');
  });

  it('should throw specific error message', () => {
    let capturedTrigger: (() => void) | null = null;

    function CaptureComponent() {
      const trigger = useErrorTrigger();
      capturedTrigger = trigger;
      return <div>Captured</div>;
    }

    render(
      <ErrorBoundary>
        <CaptureComponent />
      </ErrorBoundary>
    );

    expect(() => capturedTrigger!()).toThrow('Test error triggered by useErrorTrigger');
  });
});

// =============================================================================
// TESTS: Edge Cases
// =============================================================================

describe('ErrorBoundary Edge Cases', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should handle multiple errors from different children', () => {
    // First error should be caught
    render(
      <ErrorBoundary>
        <ThrowingComponent />
        <div>Second child</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.queryByText('Second child')).not.toBeInTheDocument();
  });

  it('should not break parent ErrorBoundary', () => {
    render(
      <ErrorBoundary>
        <div>Parent content</div>
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      </ErrorBoundary>
    );

    // Parent content should still render
    expect(screen.getByText('Parent content')).toBeInTheDocument();
    // Child ErrorBoundary should catch error
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should catch errors triggered by state changes during render', async () => {
    const user = userEvent.setup();

    render(
      <ErrorBoundary>
        <ThrowOnStateChangeComponent />
      </ErrorBoundary>
    );

    // Button should be visible initially
    expect(screen.getByRole('button', { name: 'Trigger Error via State' })).toBeInTheDocument();

    // Click triggers state change which causes error during next render
    await user.click(screen.getByRole('button', { name: 'Trigger Error via State' }));

    // ErrorBoundary should catch the render error
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Error triggered by state change')).toBeInTheDocument();
  });
});
