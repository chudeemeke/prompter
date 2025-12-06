import { useEffect } from 'react';

interface UseKeyboardOptions {
  enabled?: boolean;  // ← New: allows disabling the handler
  onArrowUp: () => void;
  onArrowDown: () => void;
  onEnter: () => void;
  onEscape: () => void;
  onTab?: () => void;
  onEdit?: () => void;     // Ctrl+E to edit selected prompt
  onNew?: () => void;      // Ctrl+N to create new prompt
  onSettings?: () => void; // Ctrl+, to open settings
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
  onEdit,
  onNew,
  onSettings,
}: UseKeyboardOptions) {
  useEffect(() => {
    console.log('[useKeyboard] Effect running, enabled:', enabled);

    // Don't attach handler if disabled
    if (!enabled) {
      console.log('[useKeyboard] Handler DISABLED - not attaching event listener');
      return;
    }

    console.log('[useKeyboard] Handler ENABLED - attaching event listener');

    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('[useKeyboard] Key pressed:', e.key, 'target:', e.target);
      switch (e.key) {
        case 'ArrowUp':
          console.log('[useKeyboard] ArrowUp - calling preventDefault and handler');
          e.preventDefault();
          onArrowUp();
          break;
        case 'ArrowDown':
          console.log('[useKeyboard] ArrowDown - calling preventDefault and handler');
          e.preventDefault();
          onArrowDown();
          break;
        case 'Enter':
          console.log('[useKeyboard] Enter - calling preventDefault and handler');
          e.preventDefault();
          onEnter();
          break;
        case 'Escape':
          console.log('[useKeyboard] Escape - calling preventDefault and handler');
          e.preventDefault();
          onEscape();
          break;
        case 'Tab':
          if (onTab) {
            console.log('[useKeyboard] Tab - calling preventDefault and handler');
            e.preventDefault();
            onTab();
          }
          break;
        case 'e':
        case 'E':
          // Alt+E to edit selected prompt
          if (e.altKey && !e.ctrlKey && onEdit) {
            console.log('[useKeyboard] Alt+E - calling preventDefault and edit handler');
            e.preventDefault();
            onEdit();
          }
          break;
        case 'n':
        case 'N':
          // Alt+N to create new prompt
          if (e.altKey && !e.ctrlKey && onNew) {
            console.log('[useKeyboard] Alt+N - calling preventDefault and new handler');
            e.preventDefault();
            onNew();
          }
          break;
        case ',':
          // Alt+, to open settings
          if (e.altKey && !e.ctrlKey && onSettings) {
            console.log('[useKeyboard] Alt+, - calling preventDefault and settings handler');
            e.preventDefault();
            onSettings();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    console.log('[useKeyboard] Event listener attached to window');
    return () => {
      console.log('[useKeyboard] Cleanup - removing event listener from window');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, onArrowUp, onArrowDown, onEnter, onEscape, onTab, onEdit, onNew, onSettings]);
}
