import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Debounces a value by the specified delay.
 * Returns the debounced value that only updates after the delay has passed
 * without any new values being provided.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 150ms)
 * @returns The debounced value
 *
 * @example
 * const [query, setQuery] = useState('');
 * const debouncedQuery = useDebounce(query, 150);
 * // debouncedQuery updates 150ms after typing stops
 */
export function useDebounce<T>(value: T, delay: number = 150): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up timeout to update debounced value
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: clear timeout if value changes before delay completes
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Returns a debounced callback function.
 * The callback will only be invoked after the delay has passed
 * without any new calls.
 *
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds (default: 150ms)
 * @returns Debounced callback function
 *
 * @example
 * const debouncedSave = useDebouncedCallback(
 *   (value: string) => saveToBackend(value),
 *   300
 * );
 */
export function useDebouncedCallback<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number = 150
): T {
  // Use ref to persist timeout across renders without causing re-renders
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );

  return debouncedCallback;
}
