import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs, TabPanel, useTabs } from './Tabs';

// =============================================================================
// TESTS: Tabs Component
// =============================================================================

describe('Tabs', () => {
  const defaultTabs = [
    { id: 'tab1', label: 'Tab 1' },
    { id: 'tab2', label: 'Tab 2' },
    { id: 'tab3', label: 'Tab 3' },
  ];

  describe('Rendering', () => {
    it('should render all tabs', () => {
      render(
        <Tabs tabs={defaultTabs}>
          <TabPanel id="tab1">Content 1</TabPanel>
          <TabPanel id="tab2">Content 2</TabPanel>
          <TabPanel id="tab3">Content 3</TabPanel>
        </Tabs>
      );

      expect(screen.getByText('Tab 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toBeInTheDocument();
      expect(screen.getByText('Tab 3')).toBeInTheDocument();
    });

    it('should render first tab content by default', () => {
      render(
        <Tabs tabs={defaultTabs}>
          <TabPanel id="tab1">Content 1</TabPanel>
          <TabPanel id="tab2">Content 2</TabPanel>
        </Tabs>
      );

      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
    });

    it('should render defaultTab content when specified', () => {
      render(
        <Tabs tabs={defaultTabs} defaultTab="tab2">
          <TabPanel id="tab1">Content 1</TabPanel>
          <TabPanel id="tab2">Content 2</TabPanel>
        </Tabs>
      );

      expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });

    it('should render tab icons when provided', () => {
      const tabsWithIcons = [
        { id: 'tab1', label: 'Tab 1', icon: <span data-testid="icon1">*</span> },
        { id: 'tab2', label: 'Tab 2', icon: <span data-testid="icon2">+</span> },
      ];

      render(
        <Tabs tabs={tabsWithIcons}>
          <TabPanel id="tab1">Content 1</TabPanel>
          <TabPanel id="tab2">Content 2</TabPanel>
        </Tabs>
      );

      expect(screen.getByTestId('icon1')).toBeInTheDocument();
      expect(screen.getByTestId('icon2')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <Tabs tabs={defaultTabs} className="custom-class">
          <TabPanel id="tab1">Content 1</TabPanel>
        </Tabs>
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Tab Switching', () => {
    it('should switch tab content when clicking a different tab', async () => {
      const user = userEvent.setup();

      render(
        <Tabs tabs={defaultTabs}>
          <TabPanel id="tab1">Content 1</TabPanel>
          <TabPanel id="tab2">Content 2</TabPanel>
        </Tabs>
      );

      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.queryByText('Content 2')).not.toBeInTheDocument();

      await user.click(screen.getByText('Tab 2'));

      expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });

    it('should call onChange callback when tab changes', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Tabs tabs={defaultTabs} onChange={onChange}>
          <TabPanel id="tab1">Content 1</TabPanel>
          <TabPanel id="tab2">Content 2</TabPanel>
        </Tabs>
      );

      await user.click(screen.getByText('Tab 2'));

      expect(onChange).toHaveBeenCalledWith('tab2');
    });

    it('should not switch to disabled tab', async () => {
      const user = userEvent.setup();
      const tabsWithDisabled = [
        { id: 'tab1', label: 'Tab 1' },
        { id: 'tab2', label: 'Tab 2', disabled: true },
      ];

      render(
        <Tabs tabs={tabsWithDisabled}>
          <TabPanel id="tab1">Content 1</TabPanel>
          <TabPanel id="tab2">Content 2</TabPanel>
        </Tabs>
      );

      await user.click(screen.getByText('Tab 2'));

      // Content should still be Tab 1
      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
    });

    it('should apply disabled styling to disabled tabs', () => {
      const tabsWithDisabled = [
        { id: 'tab1', label: 'Tab 1' },
        { id: 'tab2', label: 'Tab 2', disabled: true },
      ];

      render(
        <Tabs tabs={tabsWithDisabled}>
          <TabPanel id="tab1">Content 1</TabPanel>
        </Tabs>
      );

      const disabledTab = screen.getByText('Tab 2').closest('button');
      expect(disabledTab).toBeDisabled();
      expect(disabledTab).toHaveClass('cursor-not-allowed');
    });
  });

  describe('Active Tab Styling', () => {
    it('should apply active styling to current tab', () => {
      render(
        <Tabs tabs={defaultTabs}>
          <TabPanel id="tab1">Content 1</TabPanel>
        </Tabs>
      );

      const activeTab = screen.getByText('Tab 1').closest('button');
      expect(activeTab).toHaveClass('text-blue-400');
      expect(activeTab).toHaveClass('border-blue-400');
    });

    it('should apply inactive styling to other tabs', () => {
      render(
        <Tabs tabs={defaultTabs}>
          <TabPanel id="tab1">Content 1</TabPanel>
        </Tabs>
      );

      const inactiveTab = screen.getByText('Tab 2').closest('button');
      expect(inactiveTab).toHaveClass('text-gray-400');
      expect(inactiveTab).toHaveClass('border-transparent');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty tabs array gracefully', () => {
      render(
        <Tabs tabs={[]}>
          <TabPanel id="tab1">Content 1</TabPanel>
        </Tabs>
      );

      // Should not render any tab content since no tabs exist
      expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
    });
  });
});

// =============================================================================
// TESTS: TabPanel Component
// =============================================================================

describe('TabPanel', () => {
  it('should throw error when used outside Tabs context', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TabPanel id="test">Content</TabPanel>);
    }).toThrow('TabPanel must be used within Tabs');

    consoleSpy.mockRestore();
  });

  it('should render content when tab is active', () => {
    render(
      <Tabs tabs={[{ id: 'tab1', label: 'Tab 1' }]} defaultTab="tab1">
        <TabPanel id="tab1">Active Content</TabPanel>
      </Tabs>
    );

    expect(screen.getByText('Active Content')).toBeInTheDocument();
  });

  it('should not render content when tab is inactive', () => {
    render(
      <Tabs tabs={[{ id: 'tab1', label: 'Tab 1' }, { id: 'tab2', label: 'Tab 2' }]} defaultTab="tab1">
        <TabPanel id="tab1">Active Content</TabPanel>
        <TabPanel id="tab2">Inactive Content</TabPanel>
      </Tabs>
    );

    expect(screen.getByText('Active Content')).toBeInTheDocument();
    expect(screen.queryByText('Inactive Content')).not.toBeInTheDocument();
  });

  it('should have role="tabpanel"', () => {
    render(
      <Tabs tabs={[{ id: 'tab1', label: 'Tab 1' }]}>
        <TabPanel id="tab1">Content</TabPanel>
      </Tabs>
    );

    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <Tabs tabs={[{ id: 'tab1', label: 'Tab 1' }]}>
        <TabPanel id="tab1" className="custom-panel">Content</TabPanel>
      </Tabs>
    );

    expect(screen.getByRole('tabpanel')).toHaveClass('custom-panel');
  });
});

// =============================================================================
// TESTS: useTabs Hook
// =============================================================================

describe('useTabs', () => {
  it('should throw error when used outside Tabs context', () => {
    // Create a component that uses the hook
    function TestComponent() {
      const context = useTabs();
      return <div>{context.activeTab}</div>;
    }

    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useTabs must be used within Tabs');

    consoleSpy.mockRestore();
  });

  it('should return context when used within Tabs', () => {
    // Use a ref-like object to capture the context
    const captured: { context: { activeTab: string; setActiveTab: (id: string) => void } | null } = { context: null };

    function TestComponent() {
      const ctx = useTabs();
      captured.context = ctx;
      return <div data-testid="active">{ctx.activeTab}</div>;
    }

    render(
      <Tabs tabs={[{ id: 'tab1', label: 'Tab 1' }]} defaultTab="tab1">
        <TabPanel id="tab1">
          <TestComponent />
        </TabPanel>
      </Tabs>
    );

    expect(screen.getByTestId('active')).toHaveTextContent('tab1');
    expect(captured.context).not.toBeNull();
    expect(typeof captured.context!.setActiveTab).toBe('function');
  });
});
