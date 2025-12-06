import { renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { useFocusTrap } from './useFocusTrap';

// Helper to create a container with focusable elements
const createContainer = () => {
  const container = document.createElement('div');
  container.innerHTML = `
    <button id="first">First</button>
    <input id="middle" type="text" />
    <button id="last">Last</button>
  `;
  document.body.appendChild(container);
  return container;
};

// Helper to clean up container
const cleanupContainer = (container: HTMLElement) => {
  document.body.removeChild(container);
};

describe('useFocusTrap', () => {
  describe('Focus Initialization', () => {
    it('should focus first focusable element on mount', async () => {
      const container = createContainer();
      const TestComponent = () => {
        const ref = useRef<HTMLDivElement>(container as unknown as HTMLDivElement);
        useFocusTrap(ref, true);
        return null;
      };

      renderHook(() => TestComponent());

      // Wait for requestAnimationFrame
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(document.activeElement).toBe(container.querySelector('#first'));
      cleanupContainer(container);
    });

    it('should not focus when inactive', async () => {
      const container = createContainer();
      const outsideButton = document.createElement('button');
      outsideButton.id = 'outside';
      document.body.appendChild(outsideButton);
      outsideButton.focus();

      const TestComponent = () => {
        const ref = useRef<HTMLDivElement>(container as unknown as HTMLDivElement);
        useFocusTrap(ref, false);
        return null;
      };

      renderHook(() => TestComponent());

      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(document.activeElement).toBe(outsideButton);
      cleanupContainer(container);
      document.body.removeChild(outsideButton);
    });
  });

  describe('Tab Key Trapping', () => {
    it('should trap Tab key at end of focusable elements', async () => {
      const container = createContainer();
      const TestComponent = () => {
        const ref = useRef<HTMLDivElement>(container as unknown as HTMLDivElement);
        useFocusTrap(ref, true);
        return null;
      };

      renderHook(() => TestComponent());
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Focus the last element
      const lastButton = container.querySelector('#last') as HTMLButtonElement;
      lastButton.focus();
      expect(document.activeElement).toBe(lastButton);

      // Simulate Tab key
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
      });
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      container.dispatchEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(document.activeElement).toBe(container.querySelector('#first'));
      cleanupContainer(container);
    });

    it('should trap Shift+Tab key at start of focusable elements', async () => {
      const container = createContainer();
      const TestComponent = () => {
        const ref = useRef<HTMLDivElement>(container as unknown as HTMLDivElement);
        useFocusTrap(ref, true);
        return null;
      };

      renderHook(() => TestComponent());
      await new Promise(resolve => requestAnimationFrame(resolve));

      // First element should be focused automatically
      const firstButton = container.querySelector('#first') as HTMLButtonElement;
      expect(document.activeElement).toBe(firstButton);

      // Simulate Shift+Tab key
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
      });
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      container.dispatchEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(document.activeElement).toBe(container.querySelector('#last'));
      cleanupContainer(container);
    });

    it('should not trap Tab in middle of focusable elements', async () => {
      const container = createContainer();
      const TestComponent = () => {
        const ref = useRef<HTMLDivElement>(container as unknown as HTMLDivElement);
        useFocusTrap(ref, true);
        return null;
      };

      renderHook(() => TestComponent());
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Focus the middle element
      const middleInput = container.querySelector('#middle') as HTMLInputElement;
      middleInput.focus();

      // Simulate Tab key
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
      });
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      container.dispatchEvent(event);

      // Should NOT prevent default when in middle
      expect(event.preventDefault).not.toHaveBeenCalled();
      cleanupContainer(container);
    });
  });

  describe('Focus Restoration', () => {
    it('should restore focus to previously focused element on unmount', async () => {
      const container = createContainer();
      const outsideButton = document.createElement('button');
      outsideButton.id = 'outside';
      document.body.appendChild(outsideButton);
      outsideButton.focus();

      expect(document.activeElement).toBe(outsideButton);

      const TestComponent = () => {
        const ref = useRef<HTMLDivElement>(container as unknown as HTMLDivElement);
        useFocusTrap(ref, true);
        return null;
      };

      const { unmount } = renderHook(() => TestComponent());
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Focus should now be inside container
      expect(document.activeElement).toBe(container.querySelector('#first'));

      // Unmount the hook
      unmount();

      // Wait for async focus restoration (requestAnimationFrame)
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Focus should be restored to outside button
      expect(document.activeElement).toBe(outsideButton);

      cleanupContainer(container);
      document.body.removeChild(outsideButton);
    });
  });

  describe('Edge Cases', () => {
    it('should handle container with no focusable elements', async () => {
      const container = document.createElement('div');
      container.innerHTML = '<span>No focusable elements</span>';
      document.body.appendChild(container);

      const TestComponent = () => {
        const ref = useRef<HTMLDivElement>(container);
        useFocusTrap(ref, true);
        return null;
      };

      // Should not throw
      expect(() => renderHook(() => TestComponent())).not.toThrow();

      document.body.removeChild(container);
    });

    it('should handle null container ref', () => {
      const TestComponent = () => {
        const ref = useRef<HTMLDivElement>(null);
        useFocusTrap(ref, true);
        return null;
      };

      // Should not throw
      expect(() => renderHook(() => TestComponent())).not.toThrow();
    });

    it('should ignore non-Tab keys', async () => {
      const container = createContainer();
      const TestComponent = () => {
        const ref = useRef<HTMLDivElement>(container as unknown as HTMLDivElement);
        useFocusTrap(ref, true);
        return null;
      };

      renderHook(() => TestComponent());
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Focus last element
      const lastButton = container.querySelector('#last') as HTMLButtonElement;
      lastButton.focus();

      // Simulate Enter key (not Tab)
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
      });
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      container.dispatchEvent(event);

      // Should NOT prevent default for non-Tab keys
      expect(event.preventDefault).not.toHaveBeenCalled();
      cleanupContainer(container);
    });

    it('should exclude disabled elements from focus trap', async () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button id="first">First</button>
        <button id="disabled" disabled>Disabled</button>
        <button id="last">Last</button>
      `;
      document.body.appendChild(container);

      const TestComponent = () => {
        const ref = useRef<HTMLDivElement>(container);
        useFocusTrap(ref, true);
        return null;
      };

      renderHook(() => TestComponent());
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Focus the last element
      const lastButton = container.querySelector('#last') as HTMLButtonElement;
      lastButton.focus();

      // Simulate Tab key
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
      });
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      container.dispatchEvent(event);

      // Should skip disabled and go to first
      expect(document.activeElement).toBe(container.querySelector('#first'));
      document.body.removeChild(container);
    });
  });

  describe('Active Toggle', () => {
    it('should enable/disable trap based on active prop', async () => {
      const container = createContainer();

      const TestComponent = ({ active }: { active: boolean }) => {
        const ref = useRef<HTMLDivElement>(container as unknown as HTMLDivElement);
        useFocusTrap(ref, active);
        return null;
      };

      // Start inactive
      const { rerender } = renderHook(({ active }) => TestComponent({ active }), {
        initialProps: { active: false },
      });

      await new Promise(resolve => requestAnimationFrame(resolve));

      // Focus last element manually
      const lastButton = container.querySelector('#last') as HTMLButtonElement;
      lastButton.focus();

      // Tab should work normally (no trap)
      let event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      container.dispatchEvent(event);
      expect(event.preventDefault).not.toHaveBeenCalled();

      // Now activate the trap
      rerender({ active: true });
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Focus last element again
      lastButton.focus();

      // Tab should now be trapped
      event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      container.dispatchEvent(event);
      expect(event.preventDefault).toHaveBeenCalled();

      cleanupContainer(container);
    });
  });
});
