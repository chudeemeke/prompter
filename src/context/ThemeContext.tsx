import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { PromptService } from '../services/PromptService';
import type { Theme } from '../lib/types';

// =============================================================================
// TYPES
// =============================================================================

interface ThemeContextValue {
  /** Current theme setting */
  theme: Theme;
  /** Computed effective theme (resolves 'system' to actual theme) */
  effectiveTheme: 'light' | 'dark';
  /** Update theme setting */
  setTheme: (theme: Theme) => Promise<void>;
  /** Whether theme is loading */
  loading: boolean;
}

interface ThemeProviderProps {
  children: ReactNode;
  service: PromptService;
}

// =============================================================================
// CONTEXT
// =============================================================================

const ThemeContext = createContext<ThemeContextValue | null>(null);

// =============================================================================
// HELPER: Get system preference
// =============================================================================

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

// =============================================================================
// HELPER: Apply theme to document
// =============================================================================

function applyThemeToDocument(effectiveTheme: 'light' | 'dark'): void {
  const root = document.documentElement;

  if (effectiveTheme === 'dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }
}

// =============================================================================
// PROVIDER
// =============================================================================

export function ThemeProvider({ children, service }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [loading, setLoading] = useState(true);

  // Compute effective theme
  const effectiveTheme = useMemo(() => {
    if (theme === 'system') {
      return getSystemTheme();
    }
    return theme;
  }, [theme]);

  // Apply theme to document whenever it changes
  useEffect(() => {
    applyThemeToDocument(effectiveTheme);
  }, [effectiveTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      applyThemeToDocument(getSystemTheme());
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Load theme from config on mount
  useEffect(() => {
    service.getConfig()
      .then((config) => {
        const loadedTheme = config.theme || 'dark';
        setThemeState(loadedTheme);
        applyThemeToDocument(loadedTheme === 'system' ? getSystemTheme() : loadedTheme);
      })
      .catch((error) => {
        console.error('[ThemeContext] Failed to load theme:', error);
        // Default to dark on error
        setThemeState('dark');
        applyThemeToDocument('dark');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [service]);

  // Update theme and persist to config
  const setTheme = useCallback(async (newTheme: Theme) => {
    setThemeState(newTheme);

    try {
      const currentConfig = await service.getConfig();
      await service.updateConfig({ ...currentConfig, theme: newTheme });
    } catch (error) {
      console.error('[ThemeContext] Failed to persist theme:', error);
      // Don't throw - the UI already updated
    }
  }, [service]);

  const value = useMemo(() => ({
    theme,
    effectiveTheme,
    setTheme,
    loading,
  }), [theme, effectiveTheme, setTheme, loading]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

// =============================================================================
// EXPORT FOR TESTING
// =============================================================================

export { ThemeContext, getSystemTheme, applyThemeToDocument };
