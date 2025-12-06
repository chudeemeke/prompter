import { renderHook, act } from '@testing-library/react';
import { useDebounce, useDebouncedCallback } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Value Debouncing', () => {
    it('should return initial value immediately', () => {
      const { result } = renderHook(() => useDebounce('initial', 150));
      expect(result.current).toBe('initial');
    });

    it('should debounce value changes', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 150),
        { initialProps: { value: 'initial' } }
      );

      expect(result.current).toBe('initial');

      // Update value
      rerender({ value: 'updated' });

      // Should still be initial before delay
      expect(result.current).toBe('initial');

      // Advance time past debounce delay
      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(result.current).toBe('updated');
    });

    it('should reset timer on rapid value changes', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 150),
        { initialProps: { value: 'initial' } }
      );

      // Rapidly update value
      rerender({ value: 'a' });
      act(() => vi.advanceTimersByTime(50));

      rerender({ value: 'ab' });
      act(() => vi.advanceTimersByTime(50));

      rerender({ value: 'abc' });
      act(() => vi.advanceTimersByTime(50));

      // Should still be initial (timer keeps resetting)
      expect(result.current).toBe('initial');

      // Wait for full delay after last change
      act(() => vi.advanceTimersByTime(150));

      // Now should be final value
      expect(result.current).toBe('abc');
    });

    it('should use default delay of 150ms', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });

      // Before 150ms
      act(() => vi.advanceTimersByTime(149));
      expect(result.current).toBe('initial');

      // At 150ms
      act(() => vi.advanceTimersByTime(1));
      expect(result.current).toBe('updated');
    });

    it('should handle different delay values', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });

      // At 300ms - still initial
      act(() => vi.advanceTimersByTime(300));
      expect(result.current).toBe('initial');

      // At 500ms - now updated
      act(() => vi.advanceTimersByTime(200));
      expect(result.current).toBe('updated');
    });

    it('should handle zero delay', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 0),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });

      // Even with 0 delay, setTimeout is async
      act(() => vi.advanceTimersByTime(0));
      expect(result.current).toBe('updated');
    });

    it('should work with different types', () => {
      // Number
      const { result: numberResult, rerender: rerenderNumber } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: 42 } }
      );

      rerenderNumber({ value: 100 });
      act(() => vi.advanceTimersByTime(100));
      expect(numberResult.current).toBe(100);

      // Object
      const initialObj = { foo: 'bar' };
      const updatedObj = { foo: 'baz' };
      const { result: objResult, rerender: rerenderObj } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: initialObj } }
      );

      rerenderObj({ value: updatedObj });
      act(() => vi.advanceTimersByTime(100));
      expect(objResult.current).toBe(updatedObj);

      // Boolean
      const { result: boolResult, rerender: rerenderBool } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: false } }
      );

      rerenderBool({ value: true });
      act(() => vi.advanceTimersByTime(100));
      expect(boolResult.current).toBe(true);
    });

    it('should clean up timeout on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

      const { rerender, unmount } = renderHook(
        ({ value }) => useDebounce(value, 150),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });

      // Unmount before timeout completes
      unmount();

      // Should have called clearTimeout
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });

    it('should handle null and undefined values', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce<string | null | undefined>(value, 100),
        { initialProps: { value: 'initial' as string | null | undefined } }
      );

      rerender({ value: null });
      act(() => vi.advanceTimersByTime(100));
      expect(result.current).toBe(null);

      rerender({ value: undefined });
      act(() => vi.advanceTimersByTime(100));
      expect(result.current).toBe(undefined);
    });
  });

  describe('Callback Debouncing', () => {
    it('should debounce callback execution', () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useDebouncedCallback(callback, 150));

      // Call multiple times rapidly
      result.current('a');
      result.current('b');
      result.current('c');

      // Callback should not have been called yet
      expect(callback).not.toHaveBeenCalled();

      // Advance time
      act(() => vi.advanceTimersByTime(150));

      // Should have been called once with last value
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('c');
    });

    it('should clean up timeout on unmount', () => {
      const callback = vi.fn();
      const { result, unmount } = renderHook(() =>
        useDebouncedCallback(callback, 150)
      );

      result.current('test');

      // Unmount before timeout
      unmount();

      // Advance time
      act(() => vi.advanceTimersByTime(200));

      // Callback should not have been called
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle callbacks with multiple arguments', () => {
      const callback = vi.fn();
      const { result } = renderHook(() =>
        useDebouncedCallback(callback, 100)
      );

      result.current('arg1', 'arg2', 'arg3');

      act(() => vi.advanceTimersByTime(100));

      expect(callback).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
    });

    it('should use default delay of 150ms', () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useDebouncedCallback(callback));

      result.current('test');

      // Before 150ms
      act(() => vi.advanceTimersByTime(149));
      expect(callback).not.toHaveBeenCalled();

      // At 150ms
      act(() => vi.advanceTimersByTime(1));
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid delay changes', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 100 } }
      );

      rerender({ value: 'updated', delay: 200 });

      // Old delay should not trigger update
      act(() => vi.advanceTimersByTime(100));
      expect(result.current).toBe('initial');

      // New delay should trigger update
      act(() => vi.advanceTimersByTime(100));
      expect(result.current).toBe('updated');
    });

    it('should handle same value being set multiple times', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: 'same' } }
      );

      // Set same value multiple times
      rerender({ value: 'same' });
      rerender({ value: 'same' });
      rerender({ value: 'same' });

      act(() => vi.advanceTimersByTime(100));

      expect(result.current).toBe('same');
    });

    it('should handle very long delays', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 10000),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });

      // Advance time significantly but less than delay
      act(() => vi.advanceTimersByTime(9999));
      expect(result.current).toBe('initial');

      // Complete the delay
      act(() => vi.advanceTimersByTime(1));
      expect(result.current).toBe('updated');
    });
  });
});
