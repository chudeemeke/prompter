import { useEffect, useRef, RefObject } from 'react';

/**
 * Focus trap hook to keep keyboard focus within a container element.
 * Essential for modals and dialogs to ensure accessibility.
 *
 * @param containerRef - Ref to the container element to trap focus within
 * @param active - Whether the trap is active (default: true)
 * @returns void
 */
export function useFocusTrap<T extends HTMLElement>(
  containerRef: RefObject<T>,
  active: boolean = true
): void {
  // Store the previously focused element to restore on unmount
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    // Store the current focused element
    previouslyFocusedElement.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // Get all focusable elements within the container
    const getFocusableElements = (): HTMLElement[] => {
      const elements = container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      return Array.from(elements).filter(
        el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden')
      );
    };

    // Focus the first element only if focus is not already inside the container
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      // Slight delay to ensure the modal is rendered
      requestAnimationFrame(() => {
        // Check if focus is already inside the container (e.g., from autoFocus)
        const activeElement = document.activeElement as HTMLElement;
        const focusIsInside = container.contains(activeElement);

        // Only focus first element if nothing inside is focused yet
        if (!focusIsInside) {
          focusableElements[0].focus();
        }
      });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const elements = getFocusableElements();
      if (elements.length === 0) return;

      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];

      // Shift + Tab
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      }
      // Tab only
      else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Cleanup: restore focus to previously focused element
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocusedElement.current && typeof previouslyFocusedElement.current.focus === 'function') {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [containerRef, active]);
}
