import { useEffect } from 'react';

interface UseKeyboardOptions {
  enabled?: boolean;  // ← New: allows disabling the handler
  onArrowUp: () => void;
  onArrowDown: () => void;
  onEnter: () => void;
  onEscape: () => void;
  onTab?: () => void;
}

/**
 * Centralized keyboard event handling
 * Reusable across components
 */
export function useKeyboard({
  enabled = true,  // ← Default to enabled
  onArrowUp,
  onArrowDown,
  onEnter,
  onEscape,
  onTab,
}: UseKeyboardOptions) {
  useEffect(() => {
    // Don't attach handler if disabled
    if (!enabled) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          onArrowUp();
          break;
        case 'ArrowDown':
          e.preventDefault();
          onArrowDown();
          break;
        case 'Enter':
          e.preventDefault();
          onEnter();
          break;
        case 'Escape':
          e.preventDefault();
          onEscape();
          break;
        case 'Tab':
          if (onTab) {
            e.preventDefault();
            onTab();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onArrowUp, onArrowDown, onEnter, onEscape, onTab]);
}
