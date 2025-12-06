import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './Button';

// =============================================================================
// TYPES
// =============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  copied: boolean;
}

// =============================================================================
// ERROR BOUNDARY COMPONENT
// =============================================================================

/**
 * React Error Boundary - catches JavaScript errors anywhere in child component tree.
 * Displays a fallback UI instead of crashing the entire application.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console for debugging
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);

    // Update state with error details
    this.setState({ errorInfo });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copied: false,
    });
  };

  handleToggleDetails = (): void => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  handleCopyError = async (): Promise<void> => {
    const { error, errorInfo } = this.state;
    const errorText = `
Error: ${error?.message || 'Unknown error'}

Stack Trace:
${error?.stack || 'No stack trace available'}

Component Stack:
${errorInfo?.componentStack || 'No component stack available'}

Timestamp: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorText);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (err) {
      console.error('[ErrorBoundary] Failed to copy error:', err);
    }
  };

  render(): ReactNode {
    const { hasError, error, errorInfo, showDetails, copied } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // If custom fallback provided, use it
      if (fallback) {
        return fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-gray-800 rounded-xl border border-gray-700 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-red-900/30 border-b border-red-800/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-900/50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">
                  Something went wrong
                </h1>
                <p className="text-sm text-red-300">
                  An unexpected error occurred
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-4 space-y-4">
              <p className="text-gray-300 text-sm">
                We're sorry, but something unexpected happened. You can try reloading
                the application or contact support if the problem persists.
              </p>

              {/* Error message preview */}
              {error && (
                <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                  <p className="text-red-400 text-sm font-mono break-all">
                    {error.message || 'Unknown error'}
                  </p>
                </div>
              )}

              {/* Toggle details */}
              <button
                onClick={this.handleToggleDetails}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
              >
                {showDetails ? (
                  <>
                    <ChevronUp size={16} />
                    Hide technical details
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} />
                    Show technical details
                  </>
                )}
              </button>

              {/* Technical details */}
              {showDetails && (
                <div className="space-y-3">
                  {/* Stack trace */}
                  {error?.stack && (
                    <div className="bg-gray-900 rounded-lg p-3 border border-gray-700 max-h-40 overflow-y-auto">
                      <p className="text-xs font-mono text-gray-400 whitespace-pre-wrap break-all">
                        {error.stack}
                      </p>
                    </div>
                  )}

                  {/* Component stack */}
                  {errorInfo?.componentStack && (
                    <div className="bg-gray-900 rounded-lg p-3 border border-gray-700 max-h-40 overflow-y-auto">
                      <p className="text-xs text-gray-500 mb-2">Component Stack:</p>
                      <p className="text-xs font-mono text-gray-400 whitespace-pre-wrap break-all">
                        {errorInfo.componentStack}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-850 border-t border-gray-700 flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                onClick={this.handleReload}
                icon={<RefreshCw size={16} />}
                className="flex-1"
              >
                Reload Application
              </Button>
              <Button
                variant="secondary"
                onClick={this.handleCopyError}
                icon={<Copy size={16} />}
                className="flex-1"
              >
                {copied ? 'Copied!' : 'Copy Error Details'}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

// =============================================================================
// HOOK FOR PROGRAMMATIC ERROR TRIGGERING (TESTING)
// =============================================================================

/**
 * Hook to manually trigger error boundary for testing purposes.
 * Only use in development.
 */
export function useErrorTrigger(): () => void {
  return () => {
    throw new Error('Test error triggered by useErrorTrigger');
  };
}
