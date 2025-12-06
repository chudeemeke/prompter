# Changelog

All notable changes to the Prompter project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-06

First production-ready release of Prompter - a Spotlight-style prompt manager for Windows 11.

### Added

#### Core Features
- **Spotlight Window**: Global hotkey (`Ctrl+Space`) opens a Spotlight-style search interface
  - Fuzzy search across all prompts by name, description, and tags
  - Keyboard navigation with Arrow Up/Down, Enter to select, Escape to dismiss
  - Tab key to promote selection (boost frecency score)
  - Loading skeleton, error state with retry, and empty state handling
  - Keyboard hints bar showing all available shortcuts

#### Keyboard Shortcuts
- `Ctrl+Space`: Global hotkey to show/hide Spotlight window
- `Arrow Up/Down`: Navigate search results
- `Enter`: Select and paste the currently highlighted prompt
- `Tab`: Promote selection (boost frecency score)
- `Escape`: Close/dismiss window
- `Alt+E`: Edit the currently selected prompt in editor
- `Alt+N`: Create a new prompt
- `Alt+,`: Open settings window

#### Editor Window
- Full-featured prompt editor with tabbed interface:
  - **Content Tab**: Name, description, and prompt content fields
  - **Variables Tab**: Add/edit/remove variables with name, default value, required flag, description
  - **Settings Tab**: Folder selection, icon picker, color picker, tags, auto-paste toggle
- Sidebar with folder tree navigation (`PromptSidebar` component)
  - Collapsible folders with expand/collapse toggle
  - Prompt filtering/search within sidebar
  - Visual selection indicator for active prompt
  - "New" button for quick prompt creation
- Version history view and restore capability
- Duplicate prompt functionality
- Unsaved changes detection with confirmation dialog
- Comprehensive validation (name required, content required, no duplicate variables)

#### Settings Window
- Tabbed navigation: General, Hotkeys, Appearance, Storage, Advanced
- Configuration options:
  - Theme selection (Light/Dark/System)
  - Auto-start on Windows login
  - Auto-paste global toggle
  - Close after paste behavior
  - Remember last query option
  - Show keyboard hints toggle
  - Max results and max recent prompts limits
  - Font size and word wrap settings
  - Backup configuration
  - Analytics toggle

#### Analytics Window
- Summary statistics cards (Total Prompts, Favorites, Total Uses, Average Uses)
- Time range selector: 7 days, 30 days, 90 days, All Time
- Sections:
  - Top Prompts (ranked by usage with trend indicators)
  - Recently Used (with relative dates)
  - By Folder (breakdown with percentage bars)
  - Most Used Prompt (spotlight card)
- Trend indicators: Up (green), Down (red), Stable (gray)

#### Variable System
- Define variables using `{{variable_name}}` syntax in prompt content
- Per-variable settings: name, default value, required flag, description
- Runtime variable input via ContextModal with validation
- Required variables must be filled before submission

#### Sample Prompts Library
14 pre-built prompts across 7 categories:
- **Development** (5): Explain Code, Write Tests, Fix Error, Video Grader, Code Review
- **Writing** (2): Summarize, Improve Writing
- **Communication** (1): Email Reply
- **Creative** (1): Brainstorm Ideas
- **Meeting** (2): Meeting Notes, Meeting Engagement Report
- **News** (1): 48 Hours in AI
- **Shows** (1): What Should I Watch Tonight?
- **Uncategorized** (1): Dog Facts

#### System Integration
- System tray icon with menu (Show/Hide, New Prompt, Settings, Quit)
- Window focus tracking and restoration after paste
- Auto-paste via SendInput API (with UIPI workaround guidance)
- Auto-start on Windows login support
- Multi-window architecture (Spotlight, Editor, Settings, Analytics)

#### Auto-Update System
- Configured `tauri-plugin-updater` (v2.9.0) for automatic updates
- `useUpdater` hook with progress tracking
- Check, download, install workflow with app relaunch
- Documentation in `docs/deployment/AUTO_UPDATE.md`

#### Performance Optimizations
- `useDebounce` hook (150ms default) for search input optimization
- `React.memo` on ResultItem component with `useMemo` for styles
- Production-safe logging utility (`src/lib/logger.ts`) with zero overhead in production

#### Accessibility
- `useFocusTrap` hook for modal keyboard accessibility
- Tab/Shift+Tab cycling within modals
- Focus restoration on modal close
- ARIA labels on interactive elements

#### Theme Support
- Light, Dark, and System preference detection
- `ThemeContext` with `useTheme` hook
- CSS variables for dynamic theme switching
- Immediate theme change (no reload required)
- Theme persisted to config

#### Shared UI Components
- `Button`: Primary, secondary, ghost variants with loading state
- `Input`: Text input with label, error display, required indicator
- `Textarea`: Multi-line text with rows configuration
- `Select`: Dropdown with label and options
- `TagInput`: Tag management with comma/Enter support
- `IconPicker`: Icon selection with emoji support
- `ColorPicker`: Color selection with hex input
- `Modal`: Reusable modal dialog
- `Toast`: Notification toasts (success, error, info, warning)
- `Tabs`: Tabbed interface with icon support
- `Skeleton`: Loading skeleton with count configuration
- `ErrorBoundary`: React error boundary with reset

#### Custom Hooks
- `useKeyboard`: Centralized keyboard event handling with enable/disable
- `useDebounce`: Value and callback debouncing
- `useFocusTrap`: Modal focus management
- `useUpdater`: Application update management
- `useEditor`: Prompt editor state management with validation
- `usePrompts`: Prompt fetching and caching
- `useSearch`: Client-side fuzzy search
- `useSpotlightState`: Spotlight window state management

#### Rust Backend (Tauri Commands)
- `get_all_prompts`, `get_prompt`, `create_prompt`, `update_prompt`
- `search_prompts` with fuzzy matching (SkimMatcherV2)
- `record_usage` for frecency tracking
- `copy_and_paste` with clipboard and input simulation
- `show_window`, `hide_window` with focus management
- `open_editor_window`, `open_settings_window`, `open_analytics_window`
- `enable_autostart`, `disable_autostart`, `is_autostart_enabled`

#### Architecture
- Hexagonal Architecture with Domain, Application, and Infrastructure layers
- SOLID principles throughout all layers
- Repository pattern for data access abstraction
- Adapter pattern for platform-specific implementations
- Strategy pattern for swappable algorithms
- Dependency inversion with trait-based ports

#### Testing
- 763+ unit tests with 95%+ coverage
- Test coverage: 98.07% statements, 94.16% branches, 97.46% functions, 98.50% lines
- Vitest + React Testing Library + jsdom for frontend
- Playwright E2E test setup with fixtures

#### Build and Deploy
- Production installers: MSI and NSIS for Windows
- `scripts/build-tauri.bat` for Windows native builds
- Bundle identifier: `com.prompter.app`

### Known Issues

- **Auto-paste may not work in all applications**: Due to Windows UIPI (User Interface Privilege Isolation) security restrictions, paste simulation may be blocked by some applications. The system provides honest feedback via toast messages, instructing users to press Ctrl+V if needed.

---

## [0.0.0] - 2025-11-30

### Added
- Project initialized
- Planning phase completed
- Architecture designed (Hexagonal Architecture)
- Phase 1 Foundation: Tauri v2 + React + TypeScript + TailwindCSS setup
- Phase 2 Parallel Development: Data Layer, OS Integration, UI Layer
- Phase 3 Sequential Merge: All layers integrated

---

## Types of Changes

- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` in case of vulnerabilities

## References

- [YouTube Video (Inspiration)](https://www.youtube.com/watch?v=w_wbKLOjqeE)
- [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
- [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
