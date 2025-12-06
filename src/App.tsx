import { useMemo } from 'react';
import { SpotlightWindow, EditorWindow, SettingsWindow, AnalyticsWindow } from './components';
import { MockPromptService } from './services/MockPromptService';
import { TauriPromptService } from './services/TauriPromptService';
import { ThemeProvider } from './context';
import type { WindowType, EditorMode } from './lib/types';

// =============================================================================
// SERVICE INITIALIZATION
// =============================================================================

// Use mock service during development (Vite dev server), Tauri service in production
const isDevelopment = import.meta.env.DEV && !window.__TAURI_INTERNALS__;
const promptService = isDevelopment
  ? new MockPromptService()
  : new TauriPromptService();

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
// WINDOW DIMENSIONS
// =============================================================================

const WINDOW_SIZES: Record<WindowType, { width: number; height: number }> = {
  spotlight: { width: 700, height: 500 },
  editor: { width: 900, height: 700 },
  settings: { width: 600, height: 500 },
  analytics: { width: 800, height: 600 },
};

// =============================================================================
// APP COMPONENT
// =============================================================================

function AppContent() {
  const params = useMemo(() => parseWindowParams(), []);
  const size = WINDOW_SIZES[params.window];

  // Render based on window type
  switch (params.window) {
    case 'editor':
      return (
        <div className={`w-[${size.width}px] h-[${size.height}px]`} style={{ width: size.width, height: size.height }}>
          <EditorWindow
            service={promptService}
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
        <div className={`w-[${size.width}px] h-[${size.height}px]`} style={{ width: size.width, height: size.height }}>
          <SettingsWindow
            service={promptService}
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
        <div className={`w-[${size.width}px] h-[${size.height}px]`} style={{ width: size.width, height: size.height }}>
          <AnalyticsWindow
            service={promptService}
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
          <SpotlightWindow service={promptService} />
        </div>
      );
  }
}

function App() {
  return (
    <ThemeProvider service={promptService}>
      <AppContent />
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
