import { createContext, useContext, ReactNode } from 'react';
import { useToasts, ToastContainer } from '../components/shared/Toast';

/**
 * Toast context type - provides toast notification functions
 */
interface ToastContextType {
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  warning: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

interface ToastProviderProps {
  children: ReactNode;
}

/**
 * Toast provider - wraps the app and provides toast functions globally
 * Also renders the ToastContainer for displaying notifications
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const { toasts, dismissToast, clearToasts, success, error, warning, info } = useToasts();

  return (
    <ToastContext.Provider
      value={{
        success,
        error,
        warning,
        info,
        dismissToast,
        clearToasts,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

/**
 * Hook to access toast functions from any component
 * @throws Error if used outside ToastProvider
 */
export function useToastContext(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
}

/**
 * Hook that returns null if used outside ToastProvider (safe version)
 * Useful for components that may or may not have toast support
 */
export function useToastContextSafe(): ToastContextType | null {
  return useContext(ToastContext);
}
