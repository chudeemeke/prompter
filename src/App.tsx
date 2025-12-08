import { useState, useEffect, useMemo } from 'react';
import { listen } from '@tauri-apps/api/event';
import { SpotlightWindow, EditorWindow, SettingsWindow, AnalyticsWindow } from './components';
import { MockPromptService } from './services/MockPromptService';
import { TauriPromptService } from './services/TauriPromptService';
import { ThemeProvider } from './context';
import type { WindowType, EditorMode } from './lib/types';
import type { PromptService } from './services/PromptService';

// =============================================================================
// SERVICE FACTORY
// =============================================================================

/**
 * Create the appropriate service based on environment.
 * This is called inside components (not at module level) to ensure
 * Tauri globals are available in dev mode.
 */
function createPromptService(): PromptService {
  // In Tauri environment (dev or prod), __TAURI_INTERNALS__ is injected
  const isTauri = !!window.__TAURI_INTERNALS__;

  console.log('[App] Service selection:', {
    DEV: import.meta.env.DEV,
    TAURI_INTERNALS: isTauri,
    usingService: isTauri ? 'TauriPromptService' : 'MockPromptService'
  });

  return isTauri ? new TauriPromptService() : new MockPromptService();
}

// =============================================================================
// WINDOW ROUTING
// =============================================================================

interface WindowParams {
  window: WindowType;
  promptId?: string;
  mode?: EditorMode;
}

function parseWindowParams(): WindowParams {
  const params = new URLSearchParams(window.location.search);
  const pathname = window.location.pathname;

  // Determine window type from URL path first, then fall back to query param
  let windowType: WindowType = 'spotlight';

  if (pathname === '/editor' || pathname.startsWith('/editor')) {
    windowType = 'editor';
  } else if (pathname === '/settings' || pathname.startsWith('/settings')) {
    windowType = 'settings';
  } else if (pathname === '/analytics' || pathname.startsWith('/analytics')) {
    windowType = 'analytics';
  } else if (params.get('window')) {
    // Fall back to query parameter for backward compatibility
    windowType = params.get('window') as WindowType;
  }

  return {
    window: windowType,
    promptId: params.get('promptId') || params.get('id') || undefined,
    mode: (params.get('mode') as EditorMode) || 'create',
  };
}

// =============================================================================
// APP COMPONENT
// =============================================================================

interface AppContentProps {
  service: PromptService;
}

function AppContent({ service }: AppContentProps) {
  // Use state instead of memoization to allow URL re-parsing on Tauri navigation
  const [params, setParams] = useState<WindowParams>(() => parseWindowParams());

  // Listen for URL changes from Tauri window navigation
  // When Rust calls window.navigate(), it emits 'url-changed' for React to re-parse
  useEffect(() => {
    // Only set up listener in Tauri environment
    if (!window.__TAURI_INTERNALS__) return;

    let mounted = true;
    const setupListener = async () => {
      const unlisten = await listen('url-changed', () => {
        if (mounted) {
          setParams(parseWindowParams());
        }
      });
      return unlisten;
    };

    const unlistenPromise = setupListener();

    return () => {
      mounted = false;
      unlistenPromise.then(unlisten => unlisten());
    };
  }, []);

  // Render based on window type
  switch (params.window) {
    case 'editor':
      return (
        <div className="w-full h-full min-w-[900px] min-h-[700px]">
          <EditorWindow
            service={service}
            promptId={params.promptId}
            mode={params.mode}
            onClose={() => {
              // In Tauri, we close the window
              if (window.__TAURI_INTERNALS__) {
                import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
                  getCurrentWindow().close();
                });
              }
            }}
          />
        </div>
      );

    case 'settings':
      return (
        <div className="w-full h-full min-w-[600px] min-h-[500px]">
          <SettingsWindow
            service={service}
            onClose={() => {
              if (window.__TAURI_INTERNALS__) {
                import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
                  getCurrentWindow().close();
                });
              }
            }}
          />
        </div>
      );

    case 'analytics':
      return (
        <div className="w-full h-full min-w-[800px] min-h-[600px]">
          <AnalyticsWindow
            service={service}
            onClose={() => {
              if (window.__TAURI_INTERNALS__) {
                import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
                  getCurrentWindow().close();
                });
              }
            }}
          />
        </div>
      );

    case 'spotlight':
    default:
      return (
        <div className="w-[700px] h-[500px]">
          <SpotlightWindow service={service} />
        </div>
      );
  }
}

function App() {
  // Create service inside component to ensure Tauri globals are available
  // useMemo ensures it's created only once per component lifecycle
  const promptService = useMemo(() => createPromptService(), []);

  return (
    <ThemeProvider service={promptService}>
      <AppContent service={promptService} />
    </ThemeProvider>
  );
}

export default App;

// =============================================================================
// TYPE AUGMENTATION
// =============================================================================

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}
