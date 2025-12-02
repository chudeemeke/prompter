# Prompter - Project-Specific Instructions

## Project Overview

**Prompter** is a Spotlight-style prompt manager for Windows 11 Pro (x64), inspired by [this YouTube video](https://www.youtube.com/watch?v=w_wbKLOjqeE).

**Technology Stack:**
- Framework: Tauri v2
- Frontend: React + TypeScript + TailwindCSS + Vite
- Backend: Rust with Windows APIs
- Storage: Markdown files with YAML frontmatter in `~/.prompter/prompts/`
- Search: Fuzzy matching with `fuzzy-matcher` crate (SkimMatcherV2)

## Critical User Preferences

### File Management
- **ALWAYS update existing files** instead of creating new ones unless absolutely necessary to elevate design/architecture quality
- **NEVER create orphaned or obsolete files**
- When improving architecture, update in place rather than creating duplicates

### Architecture Standards (NON-NEGOTIABLE)

**ALWAYS adhere to:**
1. **Software Design Principles**: SOLID, DRY, KISS, YAGNI
2. **Software Design Patterns**: Repository, Strategy, Adapter, Factory, Observer, Service patterns
3. **Interfaces and Abstractions**: Use interface/protocol patterns for extensibility and code reuse
4. **Cohesive Systems**: Build frameworks, engines, and factories where possible - systems within systems
5. **Hexagonal Architecture**: Domain → Application → Infrastructure layer separation
6. **Dependency Inversion**: High-level modules depend on abstractions, not concretions

### Platform
- **Target**: Windows 11 Pro (x64)
- **Windows-specific code**: Isolated in infrastructure/adapters (ports & adapters pattern)
- **Future-proof**: Architecture supports macOS/Linux via adapter pattern

## Key Architectural Decisions

### 1. Hotkey Configuration
- **Chosen**: `Ctrl+Space` (NOT Ctrl+Shift+Space)
- **Rationale**: Simpler, faster to press, common in productivity tools
- **Implementation**: `tauri-plugin-global-shortcut`
- **Configurable**: Via `config.json` in `~/.prompter/`

### 2. Storage Location
- **Path**: `~/.prompter/prompts/` (hidden directory)
- **Structure**:
  ```
  ~/.prompter/
  ├── config.json          # User settings
  ├── usage.json           # Frecency data
  └── prompts/             # Prompt files
      ├── Research/
      ├── Writing/
      └── Coding/
  ```
- **Format**: Markdown files with YAML frontmatter
- **Cloud Sync**: File-based storage enables iCloud/OneDrive/Dropbox sync

### 3. Auto-Paste Behavior
- **Default**: Auto-paste ENABLED (simulate Ctrl+V after selection)
- **Global Toggle**: Configurable in `config.json`
- **Per-Prompt Override**: `autoPaste: false` in frontmatter
- **Priority**: Per-prompt > Global config > Hard-coded default (true)

### 4. Window Configuration
- **Dimensions**: 700px × 500px (fixed, not resizable)
- **Style**: Frameless, transparent background with blur
- **Position**: Centered on screen
- **Behavior**: `alwaysOnTop`, hidden by default, shown on hotkey

### 5. Frecency Algorithm
```rust
score = use_count * recency_decay
recency_decay = 1.0 / (1.0 + days_since_last_use * 0.1)
```

## YouTuber's Critical Lessons Learned

From the video that inspired this project:

1. **Don't overindex on small problems** - Keep foundation minimal, avoid perfectionism early
2. **Minimal foundation (15 min max)** - Set up bare minimum scaffolding, then parallelize
3. **Parallelization was essential** - Working with 3 specialized agents simultaneously was key to success
4. **Sequential merge strategy** - OS → Data → UI (dependencies inform merge order)

## Parallelization Strategy

### Three Specialized Agents (Phase 2)

**Agent A - Data Layer:**
- **Owns**: `src-tauri/src/{domain,application,infrastructure}/{storage,search,prompts}`
- **Architecture**: Hexagonal (Domain → Application → Infrastructure)
- **Patterns**: Repository, Strategy, Factory, Observer
- **Responsibilities**: File storage, fuzzy search, frecency tracking, prompt CRUD

**Agent B - OS Integration:**
- **Owns**: `src-tauri/src/{domain/ports,application/use_cases,infrastructure/os}`
- **Architecture**: Ports & Adapters
- **Patterns**: Adapter, Strategy
- **Responsibilities**: Hotkey registration, window management, clipboard, auto-paste, focus tracking

**Agent C - UI Layer:**
- **Owns**: `src/{services,hooks,components}`
- **Architecture**: Service abstraction + Container/Presentation pattern
- **Patterns**: Service, Observer, Strategy
- **Responsibilities**: React components, keyboard navigation, search UI, variable modal

### Merge Strategy (Phase 3)
1. **Agent B (OS)** merges first - provides foundation
2. **Agent A (Data)** merges second - depends on OS layer
3. **Agent C (UI)** merges last - depends on both

### File Boundaries (STRICT)
- **Shared files are READ ONLY** during Phase 2
- **No cross-agent modifications** until Phase 3 merge
- **Clear ownership** prevents merge conflicts

## Phase Breakdown

### Phase 1: Foundation (15 min STRICT LIMIT)
- Create Tauri v2 project
- Set up React + TypeScript + Vite
- Configure TailwindCSS
- Create basic directory structure
- Verify build works
- **NO feature implementation** - scaffolding only

### Phase 2: Parallel Agent Development
- Spawn 3 agents simultaneously
- Each agent works independently on their layer
- Strict file boundaries enforced
- **Duration**: Flexible, based on complexity

### Phase 3: Sequential Merge
- Merge OS layer → Data layer → UI layer
- Resolve integration points
- Wire up dependency injection
- **Duration**: ~30-60 min

### Phase 4: Integration & Testing
- End-to-end testing
- Edge case handling
- Performance optimization
- **Duration**: ~1-2 hours

## Architecture Patterns by Layer

### Domain Layer (Agent A)
```
domain/
├── entities/
│   └── prompt.rs              # Business rules
├── value_objects/
│   ├── prompt_id.rs           # Type-safe ID
│   └── frecency_score.rs      # Encapsulated scoring
└── ports/
    ├── prompt_repository.rs   # Interface (trait)
    └── search_service.rs      # Interface (trait)
```

### Application Layer (Agent A, B)
```
application/
├── use_cases/
│   ├── search_prompts.rs      # Agent A
│   ├── save_prompt.rs         # Agent A
│   ├── paste_prompt.rs        # Agent B
│   └── show_window.rs         # Agent B
└── services/
    └── frecency_calculator.rs # Agent A
```

### Infrastructure Layer (Agent A, B)
```
infrastructure/
├── persistence/
│   ├── file_prompt_repository.rs  # Agent A - implements PromptRepository
│   └── yaml_parser.rs             # Agent A - file parsing
├── search/
│   └── fuzzy_search_service.rs    # Agent A - implements SearchService
└── os/
    ├── windows_clipboard.rs       # Agent B - implements ClipboardService
    ├── windows_focus.rs           # Agent B - implements WindowManager
    └── windows_input.rs           # Agent B - implements InputSimulator
```

### Presentation Layer (Agent C)
```
src/
├── services/
│   ├── PromptService.ts          # Interface
│   ├── TauriPromptService.ts     # Tauri implementation
│   └── MockPromptService.ts      # Mock for development
├── hooks/
│   ├── usePrompts.ts             # Data fetching
│   ├── useSearch.ts              # Search logic
│   ├── useKeyboard.ts            # Keyboard handling
│   └── useSpotlightState.ts      # State management
└── components/
    └── SpotlightWindow/
        ├── index.tsx             # Container (smart)
        ├── SearchInput.tsx       # Presentation
        ├── ResultsList.tsx       # Presentation
        ├── ResultItem.tsx        # Presentation
        └── ContextModal.tsx      # Presentation
```

## Critical Implementation Notes

### 1. Dependency Direction (ENFORCE)
```
Presentation  →  Application  →  Domain
Infrastructure  →  Application  →  Domain
```

**NEVER:**
- Domain imports from Infrastructure
- Domain imports from Presentation
- Application imports from Infrastructure

**ALWAYS:**
- Infrastructure implements Domain interfaces
- Presentation calls Application use cases

### 2. Service Abstraction (UI Layer)
```typescript
// ✅ CORRECT - UI depends on interface
export interface PromptService {
  getAllPrompts(): Promise<Prompt[]>;
  searchPrompts(query: string): Promise<SearchResult[]>;
  copyAndPaste(text: string, autoPaste: boolean): Promise<void>;
}

// Mock for development
export class MockPromptService implements PromptService { }

// Tauri implementation
export class TauriPromptService implements PromptService { }
```

### 3. Container/Presentation Pattern
```tsx
// Container (smart) - has state and logic
export function SpotlightWindow({ service }: SpotlightWindowProps) {
  const { prompts, loading } = usePrompts(service);
  const state = useSpotlightState(service);
  // ...
  return <SearchInput /><ResultsList />
}

// Presentation (dumb) - pure render
export function SearchInput({ value, onChange }: SearchInputProps) {
  return <input value={value} onChange={onChange} />
}
```

### 4. Platform Independence (OS Layer)
```rust
// Domain port (trait)
pub trait WindowManager: Send + Sync {
    fn remember_current_window(&self) -> Result<(), String>;
    fn restore_previous_window(&self) -> Result<(), String>;
}

// Windows adapter
pub struct WindowsFocusTracker { }
impl WindowManager for WindowsFocusTracker { }

// Future macOS adapter
pub struct MacOSFocusTracker { }
impl WindowManager for MacOSFocusTracker { }
```

## Testing Standards

### Coverage Requirements (MINIMUM)
- Statements: 95%+
- Branches: 95%+
- Functions: 95%+
- Lines: 95%+
- Pass Rate: 100% ALWAYS

### TDD Cycle
1. **RED**: Write failing test first
2. **GREEN**: Write minimal code to make test pass
3. **REFACTOR**: Improve code while keeping tests green

### Testing by Layer
- **Domain Layer**: Unit tests for entities, value objects, business rules
- **Application Layer**: Use case tests with mocked ports
- **Infrastructure Layer**: Integration tests with real adapters
- **Presentation Layer**: Component tests with MockPromptService

## Git Commit Rules

**MANDATORY:**
- Author: `Chude <chude@emeke.org>`
- NO Claude references
- NO emojis
- Professional language only
- Succinct and factual

**Example CORRECT commit:**
```
feat(data): implement hexagonal architecture for prompt storage

- Add domain entities: Prompt, PromptId, FrecencyScore
- Add domain ports: PromptRepository, SearchService
- Add infrastructure adapters: FilePromptRepository, FuzzySearchService
- Add application use cases: SearchPrompts, SavePrompt, RecordUsage

Follows SOLID principles, dependency inversion, repository pattern
```

## Time Management

**CRITICAL**: Do NOT rush ANY task irrespective of token or time constraints.

**If running out of context:**
- Complete current atomic task
- Create clear handoff document
- Document exact state and next steps
- Use progress bars format (see USER CLAUDE.md)

## Documentation Standards

**NO emojis** in:
- Markdown files
- READMEs
- Changelogs
- Code comments

**Professional tone:**
- Clear, direct, factual writing
- Substance over style
- Focus on what it does, not how impressive it is

**Exceptions:**
- Terminal/CLI output MAY use symbols (✓, ▸, ⚠) for UX
- Never in version-controlled text files

## Progress Reporting Format

**ALWAYS use visual progress bars:**

```
Overall Progress:        ████████████░░░░░░░░ 62%

Planning Complete:       ████████████████████ 100%
  ✅ Architecture:       ████████████████████ 100%
  ✅ Agent Plans:        ████████████████████ 100%
  ✅ Wireframes:         ████████████████████ 100%

Implementation:          ░░░░░░░░░░░░░░░░░░░░ 0%
  ⏳ Phase 1 Foundation: ░░░░░░░░░░░░░░░░░░░░ 0%
  ⏳ Phase 2 Parallel:   ░░░░░░░░░░░░░░░░░░░░ 0%
  ⏳ Phase 3 Merge:      ░░░░░░░░░░░░░░░░░░░░ 0%
  ⏳ Phase 4 Integration:░░░░░░░░░░░░░░░░░░░░ 0%
```

## References

- **YouTube Video**: https://www.youtube.com/watch?v=w_wbKLOjqeE
- **Master Plan**: [PLAN.md](PLAN.md)
- **Agent A Plan**: [docs/development/AGENT_A_DATA.md](docs/development/AGENT_A_DATA.md)
- **Agent B Plan**: [docs/development/AGENT_B_OS.md](docs/development/AGENT_B_OS.md)
- **Agent C Plan**: [docs/development/AGENT_C_UI.md](docs/development/AGENT_C_UI.md)
- **Decisions**: [docs/decisions/DECISIONS.md](docs/decisions/DECISIONS.md)
- **Wireframes**: [docs/design/WIREFRAMES.md](docs/design/WIREFRAMES.md)
- **API Contracts**: [docs/reference/API_CONTRACTS.md](docs/reference/API_CONTRACTS.md)

## Current Status

**Planning**: 100% complete
**Implementation**: 0% complete

**Next Step**: Execute Phase 1 Foundation (15 min strict limit)
