import { renderHook } from '@testing-library/react';
import { useKeyboard } from './useKeyboard';

// Helper to simulate keyboard events with preventDefault spy
const simulateKeyPress = (key: string, options: Partial<KeyboardEventInit> = {}) => {
  const event = new KeyboardEvent('keydown', { key, ...options });
  const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
  window.dispatchEvent(event);
  return { event, preventDefaultSpy };
};

describe('useKeyboard', () => {
  const createHandlers = () => ({
    onArrowUp: vi.fn(),
    onArrowDown: vi.fn(),
    onEnter: vi.fn(),
    onEscape: vi.fn(),
    onTab: vi.fn(),
  });

  describe('Event Listener Setup', () => {
    it('should add keydown event listener on mount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const handlers = createHandlers();

      renderHook(() => useKeyboard(handlers));

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      addEventListenerSpy.mockRestore();
    });

    it('should remove event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      const handlers = createHandlers();

      const { unmount } = renderHook(() => useKeyboard(handlers));
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      removeEventListenerSpy.mockRestore();
    });

    it('should not leave event listeners after unmount', () => {
      const handlers = createHandlers();
      const { unmount } = renderHook(() => useKeyboard(handlers));

      unmount();

      simulateKeyPress('ArrowUp');
      expect(handlers.onArrowUp).not.toHaveBeenCalled();
    });
  });

  describe('Arrow Up Key', () => {
    it('should call onArrowUp when ArrowUp pressed', () => {
      const handlers = createHandlers();
      renderHook(() => useKeyboard(handlers));

      simulateKeyPress('ArrowUp');

      expect(handlers.onArrowUp).toHaveBeenCalledTimes(1);
    });

    it('should prevent default behavior for ArrowUp', () => {
      const handlers = createHandlers();
      renderHook(() => useKeyboard(handlers));

      const { preventDefaultSpy } = simulateKeyPress('ArrowUp');

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should not call other handlers when ArrowUp pressed', () => {
      const handlers = createHandlers();
      renderHook(() => useKeyboard(handlers));

      simulateKeyPress('ArrowUp');

      expect(handlers.onArrowDown).not.toHaveBeenCalled();
      expect(handlers.onEnter).not.toHaveBeenCalled();
      expect(handlers.onEscape).not.toHaveBeenCalled();
    });

    it('should handle rapid ArrowUp presses', () => {
      const handlers = createHandlers();
      renderHook(() => useKeyboard(handlers));

      for (let i = 0; i < 10; i++) {
        simulateKeyPress('ArrowUp');
      }

      expect(handlers.onArrowUp).toHaveBeenCalledTimes(10);
    });
  });

  describe('Arrow Down Key', () => {
    it('should call onArrowDown when ArrowDown pressed', () => {
      const handlers = createHandlers();
      renderHook(() => useKeyboard(handlers));

      simulateKeyPress('ArrowDown');

      expect(handlers.onArrowDown).toHaveBeenCalledTimes(1);
    });

    it('should prevent default behavior for ArrowDown', () => {
      const handlers = createHandlers();
      renderHook(() => useKeyboard(handlers));

      const { preventDefaultSpy } = simulateKeyPress('ArrowDown');

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should not call other handlers when ArrowDown pressed', () => {
      const handlers = createHandlers();
      renderHook(() => useKeyboard(handlers));

      simulateKeyPress('ArrowDown');

      expect(handlers.onArrowUp).not.toHaveBeenCalled();
      expect(handlers.onEnter).not.toHaveBeenCalled();
      expect(handlers.onEscape).not.toHaveBeenCalled();
    });
  });

  describe('Enter Key', () => {
    it('should call onEnter when Enter pressed', () => {
      const handlers = createHandlers();
      renderHook(() => useKeyboard(handlers));

      simulateKeyPress('Enter');

      expect(handlers.onEnter).toHaveBeenCalledTimes(1);
    });

    it('should prevent default behavior for Enter', () => {
      const handlers = createHandlers();
      renderHook(() => useKeyboard(handlers));

      const { preventDefaultSpy } = simulateKeyPress('Enter');

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should not call other handlers when Enter pressed', () => {
      const handlers = createHandlers();
      renderHook(() => useKeyboard(handlers));

      simulateKeyPress('Enter');

      expect(handlers.onArrowUp).not.toHaveBeenCalled();
      expect(handlers.onArrowDown).not.toHaveBeenCalled();
      expect(handlers.onEscape).not.toHaveBeenCalled();
    });

    it('should handle Enter in forms without triggering form submission', () => {
      const handlers = createHandlers();
      renderHook(() => useKeyboard(handlers));

      const { preventDefaultSpy } = simulateKeyPress('Enter');

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(handlers.onEnter).toHaveBeenCalled();
    });
  });

  describe('Escape Key', () => {
    it('should call onEscape when Escape pressed', () => {
      const handlers = createHandlers();
      renderHook(() => useKeyboard(handlers));

      simulateKeyPress('Escape');

      expect(handlers.onEscape).toHaveBeenCalledTimes(1);
    });

    it('should prevent default behavior for Escape', () => {
      const handlers = createHandlers();
      renderHook(() => useKeyboard(handlers));

      const { preventDefaultSpy } = simulateKeyPress('Escape');

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should not call other handlers when Escape pressed', () => {
      const handlers = createHandlers();
      renderHook(() => useKeyboard(handlers));

      simulateKeyPress('Escape');

      expect(handlers.onArrowUp).not.toHaveBeenCalled();
      expect(handlers.onArrowDown).not.toHaveBeenCalled();
      expect(handlers.onEnter).not.toHaveBeenCalled();
    });
  });

  describe('Tab Key', () => {
    it('should call onTab when Tab pressed and handler provided', () => {
      const handlers = createHandlers();
      renderHook(() => useKeyboard(handlers));

      simulateKeyPress('Tab');

      expect(handlers.onTab).toHaveBeenCalledTimes(1);
    });

    it('should prevent default behavior for Tab when handler provided', () => {
      const handlers = createHandlers();
      renderHook(() => useKeyboard(handlers));

      const { preventDefaultSpy } = simulateKeyPress('Tab');

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should not prevent default when onTab not provided', () => {
      const handlers = {
        onArrowUp: vi.fn(),
        onArrowDown: vi.fn(),
        onEnter: vi.fn(),
        onEscape: vi.fn(),
      };
      renderHook(() => useKeyboard(handlers));

      const { preventDefaultSpy } = simulateKeyPress('Tab');

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('should not call onTab when not provided', () => {
      const handlers = {
        onArrowUp: vi.fn(),
        onArrowDown: vi.fn(),
        onEnter: vi.fn(),
        onEscape: vi.fn(),
      };
      renderHook(() => useKeyboard(handlers));

      simulateKeyPress('Tab');

      // Should not throw error
      expect(handlers.onArrowUp).not.toHaveBeenCalled();
    });
  });

  describe('Ignored Keys', () => {
    it('should ignore letter keys', () => {
      const handlers = createHandlers();
      renderHook(() => useKeyboard(handlers));

      simulateKeyPress('a');

      expect(handlers.onArrowUp).not.toHaveBeenCalled();
      expect(handlers.onArrowDown).not.toHaveBeenCalled();
      expect(handlers.onEnter).not.toHaveBeenCalled();
      expect(handlers.onEscape).not.toHaveBeenCalled();
    });

    it('should ignore number keys', () => {
      const handlers = createHandlers();
      renderHook(() => useKeyboard(handlers));

      simulateKeyPress('1');

      expect(handlers.onArrowUp).not.toHaveBeenCalled();
      expect(handlers.onArrowDown).not.toHaveBeenCalled();
      expect(handlers.onEnter).not.toHaveBeenCalled();
      expect(handlers.onEscape).not.toHaveBeenCalled();
    });

    it('should ignore Space key', () => {
      const handlers = createHandlers();
      renderHook(() => useKeyboard(handlers));

      simulateKeyPress(' ');

      expect(handlers.onArrowUp).not.toHaveBeenCalled();
      expect(handlers.onArrowDown).not.toHaveBeenCalled();
      expect(handlers.onEnter).not.toHaveBeenCalled();
      expect(handlers.onEscape).not.toHaveBeenCalled();
    });

    it('should ignore ArrowLeft and ArrowRight', () => {
      const handlers = createHandlers();
      renderHook(() => useKeyboard(handlers));

      simulateKeyPress('ArrowLeft');
      simulateKeyPress('ArrowRight');

      expect(handlers.onArrowUp).not.toHaveBeenCalled();
      expect(handlers.onArrowDown).not.toHaveBeenCalled();
    });

    it('should not prevent default for ignored keys', () => {
      const handlers = createHandlers();
      renderHook(() => useKeyboard(handlers));

      const { preventDefaultSpy } = simulateKeyPress('a');

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });

  describe('Modifier Keys', () => {
    it('should handle key combinations with modifiers', () => {
      const handlers = createHandlers();
      renderHook(() => useKeyboard(handlers));

      simulateKeyPress('Enter', { ctrlKey: true });

      // Still calls handler even with modifier
      expect(handlers.onEnter).toHaveBeenCalled();
    });

    it('should handle Shift+Tab', () => {
      const handlers = createHandlers();
      renderHook(() => useKeyboard(handlers));

      simulateKeyPress('Tab', { shiftKey: true });

      expect(handlers.onTab).toHaveBeenCalled();
    });

    it('should handle Alt+ArrowUp', () => {
      const handlers = createHandlers();
      renderHook(() => useKeyboard(handlers));

      simulateKeyPress('ArrowUp', { altKey: true });

      expect(handlers.onArrowUp).toHaveBeenCalled();
    });
  });

  describe('Handler Updates', () => {
    it('should use updated handlers after rerender', () => {
      const initialHandlers = createHandlers();
      const { rerender } = renderHook(
        ({ handlers }) => useKeyboard(handlers),
        { initialProps: { handlers: initialHandlers } }
      );

      const newHandlers = createHandlers();
      rerender({ handlers: newHandlers });

      simulateKeyPress('ArrowUp');

      expect(newHandlers.onArrowUp).toHaveBeenCalled();
      expect(initialHandlers.onArrowUp).not.toHaveBeenCalled();
    });

    it('should handle changing onTab from undefined to defined', () => {
      const handlers = {
        onArrowUp: vi.fn(),
        onArrowDown: vi.fn(),
        onEnter: vi.fn(),
        onEscape: vi.fn(),
      };

      const { rerender } = renderHook(
        ({ handlers }) => useKeyboard(handlers as any),
        { initialProps: { handlers } }
      );

      simulateKeyPress('Tab');
      // Should not prevent default initially

      const handlersWithTab = {
        ...handlers,
        onTab: vi.fn(),
      };

      rerender({ handlers: handlersWithTab });

      const { preventDefaultSpy } = simulateKeyPress('Tab');

      expect(handlersWithTab.onTab).toHaveBeenCalled();
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Multiple Hook Instances', () => {
    it('should handle multiple useKeyboard instances', () => {
      const handlers1 = createHandlers();
      const handlers2 = createHandlers();

      renderHook(() => useKeyboard(handlers1));
      renderHook(() => useKeyboard(handlers2));

      simulateKeyPress('ArrowUp');

      // Both should be called
      expect(handlers1.onArrowUp).toHaveBeenCalled();
      expect(handlers2.onArrowUp).toHaveBeenCalled();
    });

    it('should cleanup only unmounted instance', () => {
      const handlers1 = createHandlers();
      const handlers2 = createHandlers();

      const { unmount: unmount1 } = renderHook(() => useKeyboard(handlers1));
      renderHook(() => useKeyboard(handlers2));

      unmount1();

      simulateKeyPress('ArrowUp');

      expect(handlers1.onArrowUp).not.toHaveBeenCalled();
      expect(handlers2.onArrowUp).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle optional onTab handler', () => {
      const handlers = {
        onArrowUp: vi.fn(),
        onArrowDown: vi.fn(),
        onEnter: vi.fn(),
        onEscape: vi.fn(),
        // onTab is optional and undefined
      };

      renderHook(() => useKeyboard(handlers));

      simulateKeyPress('Tab');

      // Should not throw when onTab is undefined
      expect(handlers.onArrowUp).not.toHaveBeenCalled();
    });

    it('should handle very rapid key presses', () => {
      const handlers = createHandlers();
      renderHook(() => useKeyboard(handlers));

      for (let i = 0; i < 100; i++) {
        simulateKeyPress('ArrowDown');
      }

      expect(handlers.onArrowDown).toHaveBeenCalledTimes(100);
    });

    it('should handle alternating key presses', () => {
      const handlers = createHandlers();
      renderHook(() => useKeyboard(handlers));

      simulateKeyPress('ArrowUp');
      simulateKeyPress('ArrowDown');
      simulateKeyPress('ArrowUp');
      simulateKeyPress('ArrowDown');

      expect(handlers.onArrowUp).toHaveBeenCalledTimes(2);
      expect(handlers.onArrowDown).toHaveBeenCalledTimes(2);
    });

    it('should handle all managed keys in sequence', () => {
      const handlers = createHandlers();
      renderHook(() => useKeyboard(handlers));

      simulateKeyPress('ArrowUp');
      simulateKeyPress('ArrowDown');
      simulateKeyPress('Enter');
      simulateKeyPress('Escape');
      simulateKeyPress('Tab');

      expect(handlers.onArrowUp).toHaveBeenCalledTimes(1);
      expect(handlers.onArrowDown).toHaveBeenCalledTimes(1);
      expect(handlers.onEnter).toHaveBeenCalledTimes(1);
      expect(handlers.onEscape).toHaveBeenCalledTimes(1);
      expect(handlers.onTab).toHaveBeenCalledTimes(1);
    });
  });

  describe('Memory Leaks', () => {
    it('should not accumulate event listeners on rerender', () => {
      const handlers = createHandlers();
      const { rerender } = renderHook(() => useKeyboard(handlers));

      for (let i = 0; i < 10; i++) {
        rerender();
      }

      simulateKeyPress('ArrowUp');

      // Should only be called once, not 10 times
      expect(handlers.onArrowUp).toHaveBeenCalledTimes(1);
    });

    it('should cleanup on unmount to prevent memory leaks', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      const handlers = createHandlers();

      const { unmount } = renderHook(() => useKeyboard(handlers));
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Stale Closure Prevention', () => {
    it('should always use latest handler function', () => {
      let callCount = 0;
      const getHandler = () => vi.fn(() => callCount++);

      const { rerender } = renderHook(
        ({ onArrowUp }) => useKeyboard({
          onArrowUp,
          onArrowDown: vi.fn(),
          onEnter: vi.fn(),
          onEscape: vi.fn(),
        }),
        { initialProps: { onArrowUp: getHandler() } }
      );

      simulateKeyPress('ArrowUp');
      expect(callCount).toBe(1);

      rerender({ onArrowUp: getHandler() });
      simulateKeyPress('ArrowUp');
      expect(callCount).toBe(2);
    });
  });
});
