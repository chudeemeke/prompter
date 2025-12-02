# UI Layer Structure

## File Tree

```
src/
├── services/                      # Service Layer (Abstraction)
│   ├── PromptService.ts          # Interface definition
│   ├── MockPromptService.ts      # Mock implementation (dev)
│   └── TauriPromptService.ts     # Tauri implementation (prod)
│
├── hooks/                         # Business Logic Layer
│   ├── usePrompts.ts             # Data fetching hook
│   ├── useSearch.ts              # Search/filter logic
│   ├── useKeyboard.ts            # Keyboard event handling
│   └── useSpotlightState.ts      # Centralized state management
│
├── components/                    # Presentation Layer
│   ├── SpotlightWindow/
│   │   ├── index.tsx             # Container (smart component)
│   │   ├── SearchInput.tsx       # Presentation component
│   │   ├── ResultsList.tsx       # Presentation component
│   │   ├── ResultItem.tsx        # Presentation component
│   │   └── ContextModal.tsx      # Presentation component
│   └── index.ts                  # Barrel exports
│
├── lib/                           # Shared (Read-only)
│   ├── types.ts                  # TypeScript types
│   └── mocks.ts                  # Mock data
│
├── App.tsx                        # Main app component
├── main.tsx                       # Entry point
├── index.css                      # Global styles
└── vite-env.d.ts                 # Vite types
```

---

## Dependency Flow

```
┌─────────────────────────────────────────────────┐
│                   App.tsx                       │
│  Creates service instance (Mock or Tauri)       │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│          SpotlightWindow (Container)            │
│  - Uses hooks for state and logic               │
│  - Wires up keyboard navigation                 │
│  - Delegates to presentation components         │
└────────┬───────────┬────────────┬────────┬──────┘
         │           │            │        │
         ▼           ▼            ▼        ▼
    ┌────────┐  ┌─────────┐  ┌───────┐  ┌──────┐
    │ Search │  │ Results │  │Context│  │Hints │
    │ Input  │  │  List   │  │ Modal │  │      │
    └────────┘  └─────────┘  └───────┘  └──────┘
                     │
                     ▼
                ┌─────────┐
                │ Result  │
                │  Item   │
                └─────────┘
```

---

## Data Flow

```
User Input (Keyboard/Mouse)
         ↓
SpotlightWindow (Container)
         ↓
Custom Hooks (Business Logic)
         ↓
PromptService (Abstraction)
         ↓
MockPromptService ←→ TauriPromptService
         ↓                    ↓
    Mock Data            Tauri Commands
                             ↓
                         Rust Backend
```

---

## Component Responsibilities

### Container (Smart)
- **SpotlightWindow/index.tsx**
  - Manages all state via hooks
  - Handles keyboard events
  - Orchestrates child components
  - No direct DOM rendering

### Presentation (Dumb)
- **SearchInput.tsx**
  - Renders search input
  - Auto-focuses
  - Emits onChange events

- **ResultsList.tsx**
  - Maps prompts to items
  - Auto-scrolls selection
  - Handles empty state

- **ResultItem.tsx**
  - Displays single prompt
  - Shows icon, name, description
  - Handles hover/selection

- **ContextModal.tsx**
  - Variable input form
  - Validation
  - Submit/cancel actions

---

## Hook Responsibilities

### usePrompts
- Fetches all prompts via service
- Returns: prompts, loading, error, reload
- Service-agnostic

### useSearch
- Filters prompts by query
- Client-side fuzzy matching
- Memoized for performance

### useKeyboard
- Handles keyboard events
- Arrow keys, Enter, Escape, Tab
- Centralized event handling

### useSpotlightState
- Centralized state management
- Variable substitution logic
- Usage recording
- Window close logic

---

## Service Implementations

### PromptService (Interface)
```typescript
interface PromptService {
  getAllPrompts(): Promise<Prompt[]>
  getPrompt(id: string): Promise<Prompt>
  searchPrompts(query: string): Promise<SearchResult[]>
  copyAndPaste(text: string, autoPaste: boolean): Promise<void>
  hideAndRestore(): Promise<void>
  recordUsage(id: string): Promise<void>
}
```

### MockPromptService
- Uses mockPrompts array
- Client-side filtering
- Console logging
- Works in browser

### TauriPromptService
- Calls Tauri commands via invoke()
- Maps to Rust backend
- Ready for integration

---

## Styling Approach

### TailwindCSS + Custom Classes
- Utility-first approach
- Custom classes for components
- Applied via @apply in index.css
- Dark theme throughout

### Key Styles
- `.spotlight-window` - Main container
- `.search-input-container` - Search bar
- `.results-list` - Scrollable results
- `.result-item` - Individual prompt
- `.context-modal` - Variable input modal
- `.keyboard-hints` - Footer hints

---

## Type Safety

### All types imported from lib/types.ts
- `Prompt` - Core prompt structure
- `SearchResult` - Search with scoring
- `PromptVariable` - Variable metadata
- `UsageStats` - Usage tracking
- `AppConfig` - Configuration

### No `any` types used
- Full TypeScript strict mode
- All props typed
- Service methods typed
- Hook return types explicit

---

## Testing Strategy

### Unit Tests
- Test hooks in isolation
- Mock service responses
- Test search logic
- Test keyboard handlers

### Component Tests
- Render components
- Test user interactions
- Verify prop passing
- Test event handlers

### Integration Tests
- Test full flow
- Mock Tauri commands
- Verify service swapping
- End-to-end scenarios

---

## Performance Optimizations

### Implemented
- `useMemo` for search filtering
- Auto-scroll with smooth behavior
- Controlled components
- Event cleanup in hooks

### Future
- Virtual scrolling for large lists
- Debounced search input
- Lazy loading of prompts
- Cached service results

---

## Accessibility

### Keyboard Support
- All actions keyboard-accessible
- Arrow key navigation
- Enter to select
- Escape to cancel
- Tab for variables

### Future
- ARIA labels
- Screen reader support
- Focus management
- Semantic HTML

---

## Summary

The UI layer is organized into clear layers:
1. **Services** - Abstract external dependencies
2. **Hooks** - Encapsulate business logic
3. **Components** - Pure presentation

This architecture enables:
- Easy testing (mock services)
- Flexible backend (swap services)
- Maintainable code (clear responsibilities)
- Type safety (full TypeScript)
- Performance (optimized rendering)
