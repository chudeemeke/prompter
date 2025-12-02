# Changelog

All notable changes to the Prompter project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Production Build & Testing (2025-12-01 to 2025-12-02)

#### Added - Production Readiness
- Installed Rust toolchain and Windows SDK
- Successfully built Tauri application
- Added system tray icon with menu (Show, Settings, Quit)
- Implemented tray icon click handlers
- Added comprehensive logging for debugging throughout the call chain:
  - Frontend: ContextModal, useSpotlightState hook
  - Backend: copy_and_paste command, WindowsFocusTracker
- Created Settings plan document (docs/design/SETTINGS_PLAN.md)
- Created User Guide documentation (docs/USER_GUIDE.md)
- Created .gitignore for proper version control
- Initial commit pushed to GitHub: https://github.com/chudeemeke/prompter
- Added Testing Pyramid documentation to ~/.claude/CLAUDE.md
  - Unit (60-70%), Integration (20-30%), Contract (optional), E2E (5-10%)
  - Real-world Prompter example showing integration test gap
  - Enforcement strategies and decision matrix

#### Changed - Configuration & UX
- Changed hotkey from Ctrl+Shift+Space to Ctrl+Space (simpler, faster)
- Fixed window focus tracking: only remember window when opened from tray, NOT on startup
- Fixed snake_case/camelCase parameter mismatches across entire TypeScript codebase (16+ fields)
  - Types: autoPaste → auto_paste, createdAt → created_at, updatedAt → updated_at
  - Stats: promptId → prompt_id, useCount → use_count, lastUsed → last_used
  - Config: promptsDir → prompts_dir, showInTray → show_in_tray, maxResults → max_results
  - UI: isVisible → is_visible, selectedIndex → selected_index, showVariableModal → show_variable_modal
- Added temporary "show on startup" for testing (to be removed after hotkey fixed)
- Reorganized project structure following WoW (Ways of Working) standards:
  - Moved batch files to scripts/ directory
  - Moved PLAN.md to docs/planning/
  - Deleted temporary status files (PRODUCTION_STATUS.md, PROJECT_STATUS_SUMMARY.md, AGENT_B_FILES.txt)
  - Created docs/TODO.md for tracking technical debt

#### Fixed - Critical Issues
- Fixed all Rust compiler warnings
- Fixed YAML parsing to load all prompts correctly
- Fixed parameter naming: autoPaste → auto_paste, promptId → prompt_id (and 16+ other fields)
- Fixed window focus issue: prevented remembering CMD window on startup
- Fixed Vite cache corruption issue causing JavaScript execution failures
- Fixed SSH configuration for GitHub access on Windows:
  - Disabled IPQoS (not supported on Windows OpenSSH)
  - Disabled ControlMaster (unreliable on Windows, works in WSL2/Linux)

#### Testing
- All tests passing: 346/353 (7 intentionally skipped)
- Test coverage: 95%+ across all metrics
- Search functionality verified
- System tray integration verified
- Keyboard navigation verified

#### In Progress
- End-to-end paste functionality testing
- JavaScript execution debugging (Vite cache issues resolved)

#### Pending
- Settings window UI implementation
- Auto-start on Windows login
- Remove temporary startup code
- Windows MSI installer configuration
- Prompt editor implementation (CRITICAL MISSING FEATURE)

### Planning Phase Complete

#### Added - Architecture & Design (2025-11-30)

- Created master orchestration plan in [PLAN.md](PLAN.md)
- Designed hexagonal architecture for Agent A (Data Layer) in [docs/development/AGENT_A_DATA.md](docs/development/AGENT_A_DATA.md)
  - Domain layer with entities, value objects, and ports
  - Application layer with use cases and services
  - Infrastructure layer with file-based repository and fuzzy search adapters
  - Implements Repository, Strategy, Factory, and Observer patterns
- Designed ports & adapters architecture for Agent B (OS Integration) in [docs/development/AGENT_B_OS.md](docs/development/AGENT_B_OS.md)
  - Domain ports: WindowManager, ClipboardService, InputSimulator traits
  - Application use cases: PastePromptUseCase, ShowWindowUseCase
  - Windows-specific adapters with platform independence
  - Implements Adapter and Strategy patterns
- Designed service abstraction architecture for Agent C (UI Layer) in [docs/development/AGENT_C_UI.md](docs/development/AGENT_C_UI.md)
  - PromptService interface with Mock and Tauri implementations
  - Custom hooks: usePrompts, useSearch, useKeyboard, useSpotlightState
  - Container/Presentation component pattern
  - Implements Service, Observer, and Strategy patterns
- Created comprehensive wireframes and UI mockups in [docs/design/WIREFRAMES.md](docs/design/WIREFRAMES.md)
  - Main window layout (700px × 500px, frameless, transparent)
  - Component breakdowns: SearchInput, ResultsList, ContextModal, KeyboardOverlay
  - Color palette, typography, and animation specifications
  - Accessibility guidelines and edge case handling
- Documented all user decisions in [docs/decisions/DECISIONS.md](docs/decisions/DECISIONS.md)
  - Hotkey: Ctrl+Space
  - Storage: ~/.prompter/prompts/
  - Auto-paste: Enabled by default with per-prompt override
  - Editor: Built-in with optional external editor support
  - Cloud sync: File-based structure supporting iCloud/OneDrive/Dropbox
  - Extended MVP features: Folders, variables, frecency, recent prompts, preview pane
- Created API contracts and type definitions in [docs/reference/API_CONTRACTS.md](docs/reference/API_CONTRACTS.md)
- Created project status tracking in [docs/project/STATUS.md](docs/project/STATUS.md)
- Created project-specific guidelines in [CLAUDE.md](CLAUDE.md)

#### Design Decisions

- Chose Tauri v2 over Electron for native performance and smaller bundle size
- Selected Rust for backend to leverage Windows APIs and type safety
- Adopted React + TypeScript for UI with TailwindCSS for styling
- Implemented hexagonal architecture for maintainability and testability
- Used SOLID principles throughout all layers
- Applied dependency inversion principle for platform independence
- Structured for parallel agent development (3 agents working simultaneously)

#### Architecture Validation

- Validated architecture against YouTube video whiteboard
  - Confirmed 4-layer alignment: UI → Interaction → OS → Data
  - Verified parallelization strategy matches proven approach
  - Documented YouTuber's critical lessons learned
- Applied multi-dimensional design validation framework
  - Industry standards alignment (git, docker, kubectl patterns)
  - Anthropic alignment (Claude CLI/Code design guidelines)
  - Apple philosophy (simple interface, hidden complexity)
  - Cognitive science (Miller's Law, mental models)
  - User's WoW (Ways of Working) alignment
  - Technical scalability (5 features → 50 features)
  - Realistic implementation (production-ready from day one)

### Implementation Status

- Planning: 100% complete
- Phase 1 Foundation: 100% complete (2025-11-30)
- Phase 2 Parallel Development: 100% complete (2025-11-30)
- Phase 3 Sequential Merge: 100% complete (2025-11-30)
- Phase 4 Integration & Testing: In Progress

#### Phase 1: Foundation Complete (2025-11-30)

##### Added - Frontend Setup
- Created Vite + React + TypeScript project structure
- Configured TailwindCSS with dark theme color palette
- Created TypeScript type definitions in [src/lib/types.ts](src/lib/types.ts)
  - Core domain types: Prompt, PromptVariable, SearchResult, UsageStats
  - Application types: AppConfig, CommandResult, SpotlightState
- Created mock data in [src/lib/mocks.ts](src/lib/mocks.ts) with 5 sample prompts
- Configured Vite build system
- Installed frontend dependencies (193 packages)

##### Added - Backend Setup
- Configured Tauri v2 window settings in [src-tauri/tauri.conf.json](src-tauri/tauri.conf.json)
  - Dimensions: 700x500px (fixed, not resizable)
  - Frameless, transparent, always-on-top
  - Hidden by default, skip taskbar
- Created Rust module structure
  - [src-tauri/src/commands/](src-tauri/src/commands/) - Command stubs for all Tauri commands
  - [src-tauri/src/storage/mod.rs](src-tauri/src/storage/mod.rs) - Storage module placeholder (Agent A)
  - [src-tauri/src/os/mod.rs](src-tauri/src/os/mod.rs) - OS integration placeholder (Agent B)
- Created command signatures in [src-tauri/src/commands/prompts.rs](src-tauri/src/commands/prompts.rs)
  - get_all_prompts, search_prompts, save_prompt, record_usage
- Created command signatures in [src-tauri/src/commands/clipboard.rs](src-tauri/src/commands/clipboard.rs)
  - copy_and_paste, show_window, hide_window
- Declared Rust dependencies in [src-tauri/Cargo.toml](src-tauri/Cargo.toml)
  - Core: serde, serde_yaml, serde_json
  - Search: fuzzy-matcher
  - Utilities: walkdir, chrono, thiserror
  - Tauri plugins: shell, global-shortcut, clipboard-manager, log
- Registered all commands in [src-tauri/src/lib.rs](src-tauri/src/lib.rs)

##### Verified
- Frontend build: SUCCESS (Vite build completes in 1.49s, 142.90 kB JS bundle)
- TypeScript compilation: PASS (0 errors)
- Module structure: READY for parallel agents
- File boundaries: CLEAR separation for Agent A, B, C

#### Phase 2: Parallel Development Complete (2025-11-30)

All three agents worked simultaneously with strict file boundaries. Zero merge conflicts.

##### Agent A: Data Layer (Hexagonal Architecture) - 24 files created

**Domain Layer (Pure Business Logic)**:
- `storage/domain/entities/prompt.rs` - Prompt entity with validation (120 lines + 6 tests)
- `storage/domain/value_objects/prompt_id.rs` - Type-safe ID (60 lines + 6 tests)
- `storage/domain/value_objects/frecency_score.rs` - Scoring logic (80 lines + 7 tests)
- `storage/domain/ports/prompt_repository.rs` - Repository trait (interface)
- `storage/domain/ports/search_service.rs` - Search trait (interface)

**Application Layer (Use Cases)**:
- `storage/application/use_cases/search_prompts.rs` - Search orchestration (80 lines + 2 tests)
- `storage/application/use_cases/save_prompt.rs` - Save with validation (40 lines + 2 tests)
- `storage/application/use_cases/record_usage.rs` - Usage tracking (20 lines + 1 test)
- `storage/application/services/frecency_calculator.rs` - Frecency service (150 lines + 4 tests)

**Infrastructure Layer (Adapters)**:
- `storage/infrastructure/persistence/file_prompt_repository.rs` - File storage (150 lines + 5 tests)
- `storage/infrastructure/persistence/yaml_parser.rs` - YAML parser (100 lines + 4 tests)
- `storage/infrastructure/search/fuzzy_search_service.rs` - Fuzzy search (120 lines + 6 tests)

**Presentation Layer**:
- Updated `commands/prompts.rs` with full implementations (40 lines)

**Architecture Patterns Applied**:
- Repository Pattern (data access abstraction)
- Strategy Pattern (swappable search algorithms)
- Dependency Inversion (use cases depend on traits)
- Value Object Pattern (type-safe wrappers)
- All SOLID principles

**Test Coverage**: 43 comprehensive tests (domain, application, infrastructure)
**Dependencies Added**: dirs, tempfile (dev)

##### Agent B: OS Integration (Ports & Adapters) - 18 files created

**Domain Ports (Platform-Independent Traits)**:
- `os/domain/ports/window_manager.rs` - WindowManager trait
- `os/domain/ports/clipboard_service.rs` - ClipboardService trait
- `os/domain/ports/input_simulator.rs` - InputSimulator trait

**Application Use Cases**:
- `os/application/use_cases/paste_prompt.rs` - PastePromptUseCase
- `os/application/use_cases/show_window.rs` - ShowWindowUseCase

**Infrastructure Adapters (Windows-Specific)**:
- `os/infrastructure/windows_focus.rs` - WindowsFocusTracker (GetForegroundWindow API)
- `os/infrastructure/tauri_clipboard.rs` - TauriClipboardAdapter
- `os/infrastructure/windows_input.rs` - WindowsInputSimulator (SendInput API)

**Presentation Layer**:
- Updated `commands/clipboard.rs` with full implementations
- Updated `lib.rs` with Ctrl+Space hotkey registration

**Windows APIs Used**:
- GetForegroundWindow() - Capture focused window
- SetForegroundWindow() - Restore window focus
- SendInput() - Simulate Ctrl+V keypress

**Architecture Patterns Applied**:
- Adapter Pattern (platform-specific implementations)
- Strategy Pattern (swappable focus tracking)
- Dependency Inversion (use cases depend on ports)

**Test Coverage**: 8 unit tests + Windows integration tests
**Dependencies Added**: tokio, once_cell, windows (platform-specific)

##### Agent C: UI Layer (Service Abstraction) - 16 files created

**Service Layer (Abstractions)**:
- `services/PromptService.ts` - Interface definition
- `services/MockPromptService.ts` - Mock implementation with local fuzzy search
- `services/TauriPromptService.ts` - Tauri implementation ready for backend

**Custom Hooks (Business Logic)**:
- `hooks/usePrompts.ts` - Data fetching hook
- `hooks/useSearch.ts` - Client-side search/filter logic
- `hooks/useKeyboard.ts` - Centralized keyboard event handling
- `hooks/useSpotlightState.ts` - State management with business logic

**Components (Presentation)**:
- `components/SpotlightWindow/index.tsx` - Container (smart) - wires hooks
- `components/SpotlightWindow/SearchInput.tsx` - Search input with clear button
- `components/SpotlightWindow/ResultsList.tsx` - Auto-scrolling results
- `components/SpotlightWindow/ResultItem.tsx` - Icon, name, description display
- `components/SpotlightWindow/ContextModal.tsx` - Variable input form

**Updated Files**:
- `App.tsx` - Integrated SpotlightWindow with MockPromptService
- `index.css` - Complete TailwindCSS styles with dark theme

**Features Implemented**:
- Search prompts with instant filtering
- Keyboard navigation (↑↓, Enter, Escape, Tab)
- Variable input modal for prompts with variables
- Auto-scroll selected item
- Empty/loading/error state handling
- Dark theme with blur effects

**Architecture Patterns Applied**:
- Service Abstraction Pattern
- Container/Presentation Pattern
- Custom Hooks Pattern
- Dependency Injection

**Dependencies Added**: lucide-react (for icons)

#### Phase 3: Sequential Merge Complete (2025-11-30)

##### Integration Results

**Frontend Build**: SUCCESS
- Build time: 7.38s
- Bundle size: 155.00 kB (gzipped: 50.11 kB)
- CSS size: 13.19 kB (gzipped: 2.89 kB)
- TypeScript compilation: 0 errors
- All 1700 modules transformed successfully

**Rust Backend**: Ready (requires Windows environment for full compilation)
- All module structures in place
- All dependencies declared in Cargo.toml
- Command registrations complete
- Hotkey setup integrated

**Configuration Updates**:
- Fixed TypeScript config (forceConsistentCasingInFileNames)
- All npm dependencies installed (248 packages total)
- No merge conflicts (clean parallel development)

##### Files Integration Summary

**Total Files Created**: 58
- Agent A (Data): 24 files
- Agent B (OS): 18 files
- Agent C (UI): 16 files

**Total Lines of Code**: ~2,520
- Agent A: ~1,500 lines (production + tests)
- Agent B: ~520 lines (production)
- Agent C: ~1,000+ lines (production)

**Total Tests**: 51+
- Agent A: 43 tests
- Agent B: 8+ tests
- Agent C: Ready for test implementation

### Next Steps

1. Execute Phase 2: Parallel Agent Development
   - Spawn Agent A (Data Layer)
   - Spawn Agent B (OS Integration)
   - Spawn Agent C (UI Layer)
   - Agents work independently with strict file boundaries

3. Execute Phase 3: Sequential Merge
   - Merge Agent B (OS) first
   - Merge Agent A (Data) second
   - Merge Agent C (UI) last
   - Wire up dependency injection

4. Execute Phase 4: Integration & Testing
   - End-to-end testing
   - Edge case handling
   - Performance optimization

## Version History

### [0.0.0] - 2025-11-30

- Project initialized
- Planning phase completed
- Architecture designed
- Ready for implementation

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
