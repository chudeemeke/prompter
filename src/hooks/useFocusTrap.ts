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

  // Track if we've captured the previously focused element
  // This must happen during render phase (before autoFocus is applied)
  const hasCaptured = useRef(false);

  // Capture the focused element during render phase, before autoFocus runs
  // This is critical because autoFocus is applied during React's commit phase,
  // which happens before useEffect but after the render phase
  if (active && !hasCaptured.current) {
    previouslyFocusedElement.current = document.activeElement as HTMLElement;
    hasCaptured.current = true;
  }

  // Reset capture flag when becoming inactive
  if (!active && hasCaptured.current) {
    hasCaptured.current = false;
  }

  useEffect(() => {
    if (!active) return;

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
      const elementToFocus = previouslyFocusedElement.current;
      if (elementToFocus && typeof elementToFocus.focus === 'function') {
        // Use requestAnimationFrame to ensure DOM is updated before focusing
        // Then use a microtask to ensure React has finished reconciliation
        requestAnimationFrame(() => {
          // Double-check element is still in the DOM and focusable
          if (document.body.contains(elementToFocus)) {
            elementToFocus.focus();
          }
        });
      }
    };
  }, [containerRef, active]);
}
