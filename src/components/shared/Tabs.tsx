import { useState, ReactNode, createContext, useContext } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  children: ReactNode;
  className?: string;
}

/**
 * Tabs container component
 * Manages active tab state and renders tab list
 */
export function Tabs({ tabs, defaultTab, onChange, children, className = '' }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
      <div className={`flex flex-col h-full ${className}`}>
        <div className="flex border-b border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => !tab.disabled && handleTabChange(tab.id)}
              disabled={tab.disabled}
              className={`
                flex items-center gap-2 px-4 py-2.5 text-sm font-medium
                border-b-2 -mb-px transition-colors
                ${activeTab === tab.id
                  ? 'text-blue-400 border-blue-400'
                  : 'text-gray-400 border-transparent hover:text-gray-200 hover:border-gray-600'
                }
                ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </TabsContext.Provider>
  );
}

interface TabPanelProps {
  id: string;
  children: ReactNode;
  className?: string;
}

/**
 * Tab panel component - renders content when tab is active
 */
export function TabPanel({ id, children, className = '' }: TabPanelProps) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('TabPanel must be used within Tabs');
  }

  if (context.activeTab !== id) {
    return null;
  }

  return (
    <div className={`p-4 ${className}`} role="tabpanel">
      {children}
    </div>
  );
}

/**
 * Hook to access tabs context
 */
export function useTabs() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('useTabs must be used within Tabs');
  }
  return context;
}
