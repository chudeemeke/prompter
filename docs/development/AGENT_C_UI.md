# Agent C: UI Layer (Clean Architecture + Service Pattern)

You are implementing the **UI Layer** for Prompter using **Clean Architecture** principles with **Service Abstraction Pattern**.

## Your Mission

Build the React frontend with clean separation of concerns:
- **Service Layer**: Abstraction over Tauri API (interfaces)
- **Hooks Layer**: Reusable business logic (state management, keyboard handling)
- **Components Layer**: Presentation components (UI only)
- **Container/Presentation Pattern**: Separate data from display

You work INDEPENDENTLY using mock data - no dependencies on other agents.

---

## Architecture Overview

```
src/
├── services/
│   ├── PromptService.ts          # Interface (abstraction)
│   ├── TauriPromptService.ts     # Tauri implementation
│   └── MockPromptService.ts      # Mock implementation for development
├── hooks/
│   ├── usePrompts.ts             # Data fetching logic
│   ├── useSearch.ts              # Search/filter logic
│   ├── useKeyboard.ts            # Keyboard navigation logic
│   └── useSpotlightState.ts      # Centralized state management
├── components/
│   ├── SpotlightWindow/
│   │   ├── index.tsx             # Container (smart component)
│   │   ├── SearchInput.tsx       # Presentation
│   │   ├── ResultsList.tsx       # Presentation
│   │   ├── ResultItem.tsx        # Presentation
│   │   └── ContextModal.tsx      # Presentation
│   └── index.ts                  # Barrel exports
└── styles/
    └── globals.css               # Tailwind + custom styles
```

**Dependency Direction:**
```
Components → Hooks → Services → Tauri API
```

**Benefits:**
- Components don't know about Tauri
- Easy to test with mock services
- Can swap Tauri for other backends
- Centralized business logic in hooks

---

## Context

Prompter is a Spotlight-style floating window:
1. Centered, frameless window with blur background
2. User types to filter prompts
3. Arrow keys navigate, Enter selects, Escape closes
4. Tab opens variable input modal

Your job: Build this UI with full keyboard support and clean architecture.

---

## File Boundaries (STRICT)

```
OWNS (create/modify freely):
  src/services/
  ├── PromptService.ts
  ├── TauriPromptService.ts
  └── MockPromptService.ts

  src/hooks/
  ├── usePrompts.ts
  ├── useSearch.ts
  ├── useKeyboard.ts
  └── useSpotlightState.ts

  src/components/
  ├── SpotlightWindow/
  │   ├── index.tsx
  │   ├── SearchInput.tsx
  │   ├── ResultsList.tsx
  │   ├── ResultItem.tsx
  │   └── ContextModal.tsx
  └── index.ts

  src/styles/
  └── globals.css

MODIFIES:
  src/App.tsx              # Import and render SpotlightWindow

READ ONLY:
  src/lib/types.ts         # Type definitions
  src/lib/mocks.ts         # Mock data
```

---

## 1. Service Layer (Abstraction over Tauri)

### `services/PromptService.ts` (Interface)

```typescript
import type { Prompt, SearchResult } from '../lib/types';

/**
 * Prompt service interface (abstraction)
 * Allows swapping implementations (Tauri, Mock, API, etc.)
 */
export interface PromptService {
  /**
   * Get all prompts
   */
  getAllPrompts(): Promise<Prompt[]>;

  /**
   * Get a single prompt by ID
   */
  getPrompt(id: string): Promise<Prompt>;

  /**
   * Search prompts with fuzzy matching
   */
  searchPrompts(query: string): Promise<SearchResult[]>;

  /**
   * Copy prompt and paste into previous app
   */
  copyAndPaste(text: string, autoPaste: boolean): Promise<void>;

  /**
   * Hide window and restore focus
   */
  hideAndRestore(): Promise<void>;

  /**
   * Record that a prompt was used (for frecency)
   */
  recordUsage(id: string): Promise<void>;
}
```

### `services/TauriPromptService.ts` (Tauri Implementation)

```typescript
import { invoke } from '@tauri-apps/api/core';
import type { Prompt, SearchResult } from '../lib/types';
import type { PromptService } from './PromptService';

/**
 * Tauri implementation of PromptService
 * Calls actual Tauri commands
 */
export class TauriPromptService implements PromptService {
  async getAllPrompts(): Promise<Prompt[]> {
    return invoke<Prompt[]>('get_all_prompts');
  }

  async getPrompt(id: string): Promise<Prompt> {
    return invoke<Prompt>('get_prompt', { id });
  }

  async searchPrompts(query: string): Promise<SearchResult[]> {
    return invoke<SearchResult[]>('search_prompts', { query });
  }

  async copyAndPaste(text: string, autoPaste: boolean): Promise<void> {
    return invoke('copy_and_paste', { text, autoPaste });
  }

  async hideAndRestore(): Promise<void> {
    return invoke('hide_and_restore');
  }

  async recordUsage(id: string): Promise<void> {
    return invoke('record_prompt_usage', { id });
  }
}
```

### `services/MockPromptService.ts` (Mock Implementation)

```typescript
import { mockPrompts } from '../lib/mocks';
import type { Prompt, SearchResult } from '../lib/types';
import type { PromptService } from './PromptService';

/**
 * Mock implementation for development
 * No Tauri dependency, works in browser
 */
export class MockPromptService implements PromptService {
  private prompts: Prompt[] = mockPrompts;

  async getAllPrompts(): Promise<Prompt[]> {
    return Promise.resolve([...this.prompts]);
  }

  async getPrompt(id: string): Promise<Prompt> {
    const prompt = this.prompts.find(p => p.id === id);
    if (!prompt) {
      throw new Error(`Prompt not found: ${id}`);
    }
    return Promise.resolve(prompt);
  }

  async searchPrompts(query: string): Promise<SearchResult[]> {
    if (!query.trim()) {
      return this.prompts.map(p => ({
        prompt: p,
        score: 100,
        matches: [],
      }));
    }

    const lowerQuery = query.toLowerCase();
    const results = this.prompts
      .filter(p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description?.toLowerCase().includes(lowerQuery) ||
        p.tags?.some(t => t.toLowerCase().includes(lowerQuery)) ||
        p.content.toLowerCase().includes(lowerQuery)
      )
      .map(p => ({
        prompt: p,
        score: p.name.toLowerCase().includes(lowerQuery) ? 100 : 50,
        matches: [],
      }));

    results.sort((a, b) => b.score - a.score);
    return Promise.resolve(results);
  }

  async copyAndPaste(text: string, autoPaste: boolean): Promise<void> {
    console.log('[Mock] Copy and paste:', { text, autoPaste });
    return Promise.resolve();
  }

  async hideAndRestore(): Promise<void> {
    console.log('[Mock] Hide and restore');
    return Promise.resolve();
  }

  async recordUsage(id: string): Promise<void> {
    console.log('[Mock] Record usage:', id);
    return Promise.resolve();
  }
}
```

---

## 2. Hooks Layer (Business Logic)

### `hooks/usePrompts.ts` (Data Fetching)

```typescript
import { useState, useEffect } from 'react';
import type { Prompt } from '../lib/types';
import type { PromptService } from '../services/PromptService';

/**
 * Hook for fetching and managing prompts
 * Depends on PromptService abstraction (not Tauri directly)
 */
export function usePrompts(service: PromptService) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPrompts();
  }, [service]);

  const loadPrompts = async () => {
    try {
      setLoading(true);
      const data = await service.getAllPrompts();
      setPrompts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prompts');
    } finally {
      setLoading(false);
    }
  };

  return { prompts, loading, error, reload: loadPrompts };
}
```

### `hooks/useSearch.ts` (Search Logic)

```typescript
import { useState, useEffect, useMemo } from 'react';
import type { Prompt } from '../lib/types';

/**
 * Client-side search/filter logic
 * Can be replaced with service.searchPrompts() for backend search
 */
export function useSearch(prompts: Prompt[], query: string): Prompt[] {
  return useMemo(() => {
    if (!query.trim()) {
      return prompts;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = prompts.filter(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description?.toLowerCase().includes(lowerQuery) ||
      p.tags?.some(t => t.toLowerCase().includes(lowerQuery)) ||
      p.content.toLowerCase().includes(lowerQuery)
    );

    // Sort by relevance (name matches first)
    filtered.sort((a, b) => {
      const aNameMatch = a.name.toLowerCase().includes(lowerQuery);
      const bNameMatch = b.name.toLowerCase().includes(lowerQuery);
      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;
      return 0;
    });

    return filtered;
  }, [prompts, query]);
}
```

### `hooks/useKeyboard.ts` (Keyboard Navigation)

```typescript
import { useEffect } from 'react';

interface UseKeyboardOptions {
  onArrowUp: () => void;
  onArrowDown: () => void;
  onEnter: () => void;
  onEscape: () => void;
  onTab?: () => void;
}

/**
 * Centralized keyboard event handling
 * Reusable across components
 */
export function useKeyboard({
  onArrowUp,
  onArrowDown,
  onEnter,
  onEscape,
  onTab,
}: UseKeyboardOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          onArrowUp();
          break;
        case 'ArrowDown':
          e.preventDefault();
          onArrowDown();
          break;
        case 'Enter':
          e.preventDefault();
          onEnter();
          break;
        case 'Escape':
          e.preventDefault();
          onEscape();
          break;
        case 'Tab':
          if (onTab) {
            e.preventDefault();
            onTab();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onArrowUp, onArrowDown, onEnter, onEscape, onTab]);
}
```

### `hooks/useSpotlightState.ts` (Centralized State)

```typescript
import { useState, useCallback } from 'react';
import type { Prompt } from '../lib/types';
import type { PromptService } from '../services/PromptService';

/**
 * Centralized state management for Spotlight window
 * All business logic in one place
 */
export function useSpotlightState(service: PromptService) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showContextModal, setShowContextModal] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);

  const selectPrompt = useCallback((prompt: Prompt) => {
    if (prompt.variables && prompt.variables.length > 0) {
      // Show context modal for variable input
      setSelectedPrompt(prompt);
      setShowContextModal(true);
    } else {
      // No variables, select directly
      handlePromptSelection(prompt, {});
    }
  }, []);

  const handlePromptSelection = useCallback(
    async (prompt: Prompt, variables: Record<string, string>) => {
      // Substitute variables in content
      let content = prompt.content;
      Object.entries(variables).forEach(([key, value]) => {
        content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
      });

      // Record usage for frecency
      await service.recordUsage(prompt.id);

      // Copy and paste
      await service.copyAndPaste(content, true);

      // Close modal
      setShowContextModal(false);
      setSelectedPrompt(null);
    },
    [service]
  );

  const closeWindow = useCallback(async () => {
    await service.hideAndRestore();
  }, [service]);

  const moveSelection = useCallback((direction: 'up' | 'down', maxIndex: number) => {
    setSelectedIndex(prev => {
      if (direction === 'up') {
        return prev > 0 ? prev - 1 : maxIndex;
      } else {
        return prev < maxIndex ? prev + 1 : 0;
      }
    });
  }, []);

  return {
    // State
    query,
    selectedIndex,
    showContextModal,
    selectedPrompt,

    // Actions
    setQuery,
    setSelectedIndex,
    selectPrompt,
    handlePromptSelection,
    closeWindow,
    moveSelection,
    setShowContextModal,
  };
}
```

---

## 3. Components Layer (Presentation)

### `components/SpotlightWindow/index.tsx` (Container Component)

```tsx
import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { usePrompts } from '../../hooks/usePrompts';
import { useSearch } from '../../hooks/useSearch';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useSpotlightState } from '../../hooks/useSpotlightState';
import type { PromptService } from '../../services/PromptService';
import { SearchInput } from './SearchInput';
import { ResultsList } from './ResultsList';
import { ContextModal } from './ContextModal';

interface SpotlightWindowProps {
  service: PromptService;
}

/**
 * Container component (smart component)
 * Manages state and business logic, delegates presentation to child components
 */
export function SpotlightWindow({ service }: SpotlightWindowProps) {
  const { prompts, loading, error } = usePrompts(service);
  const state = useSpotlightState(service);
  const filteredPrompts = useSearch(prompts, state.query);

  // Keyboard navigation
  useKeyboard({
    onArrowUp: () => state.moveSelection('up', filteredPrompts.length - 1),
    onArrowDown: () => state.moveSelection('down', filteredPrompts.length - 1),
    onEnter: () => {
      if (filteredPrompts[state.selectedIndex]) {
        state.selectPrompt(filteredPrompts[state.selectedIndex]);
      }
    },
    onEscape: () => state.closeWindow(),
    onTab: () => {
      if (filteredPrompts[state.selectedIndex]) {
        state.selectPrompt(filteredPrompts[state.selectedIndex]);
      }
    },
  });

  // Reset selected index when results change
  useEffect(() => {
    state.setSelectedIndex(0);
  }, [filteredPrompts.length]);

  if (loading) {
    return (
      <div className="spotlight-window">
        <div className="loading">Loading prompts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="spotlight-window">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="spotlight-window">
      <SearchInput value={state.query} onChange={state.setQuery} />
      <ResultsList
        results={filteredPrompts}
        selectedIndex={state.selectedIndex}
        onSelect={state.selectPrompt}
        onHover={state.setSelectedIndex}
      />
      <div className="keyboard-hints">
        <span className="keyboard-hint">
          <kbd>↑↓</kbd> Navigate
        </span>
        <span className="keyboard-hint">
          <kbd>Enter</kbd> Select
        </span>
        <span className="keyboard-hint">
          <kbd>Tab</kbd> Variables
        </span>
        <span className="keyboard-hint">
          <kbd>Esc</kbd> Close
        </span>
      </div>

      {state.showContextModal && state.selectedPrompt && (
        <ContextModal
          prompt={state.selectedPrompt}
          onConfirm={(vars) => state.handlePromptSelection(state.selectedPrompt!, vars)}
          onCancel={() => state.setShowContextModal(false)}
        />
      )}
    </div>
  );
}
```

### `components/SpotlightWindow/SearchInput.tsx` (Presentation Component)

```tsx
import { useRef, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Presentation component (dumb component)
 * Only handles display and user input, no business logic
 */
export function SearchInput({ value, onChange, placeholder = "Search prompts..." }: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Listen for focus-search event from Tauri (hotkey pressed)
  useEffect(() => {
    const unlisten = listen('focus-search', () => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => {
      unlisten.then(fn => fn());
    };
  }, []);

  return (
    <div className="search-input-container">
      <Search className="search-icon" size={20} />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="search-input"
      />
      {value && (
        <button onClick={() => onChange('')} className="clear-button">
          <X size={18} />
        </button>
      )}
    </div>
  );
}
```

### `components/SpotlightWindow/ResultsList.tsx`

```tsx
import { useRef, useEffect } from 'react';
import type { Prompt } from '../../lib/types';
import { ResultItem } from './ResultItem';

interface ResultsListProps {
  results: Prompt[];
  selectedIndex: number;
  onSelect: (prompt: Prompt) => void;
  onHover: (index: number) => void;
}

export function ResultsList({ results, selectedIndex, onSelect, onHover }: ResultsListProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll selected item into view
  useEffect(() => {
    const selectedElement = listRef.current?.children[selectedIndex] as HTMLElement;
    selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedIndex]);

  if (results.length === 0) {
    return (
      <div className="no-results">
        <p>No prompts found</p>
        <p className="text-sm text-gray-500">Try a different search term</p>
      </div>
    );
  }

  return (
    <div ref={listRef} className="results-list">
      {results.map((prompt, index) => (
        <ResultItem
          key={prompt.id}
          prompt={prompt}
          isSelected={index === selectedIndex}
          onClick={() => onSelect(prompt)}
          onMouseEnter={() => onHover(index)}
        />
      ))}
    </div>
  );
}
```

### `components/SpotlightWindow/ResultItem.tsx`

```tsx
import type { Prompt } from '../../lib/types';

interface ResultItemProps {
  prompt: Prompt;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}

// Simple icon mapping
const iconMap: Record<string, string> = {
  'newspaper': '📰',
  'code': '💻',
  'email': '✉️',
  'note': '📝',
  'search': '🔍',
  'star': '⭐',
  'chart': '📊',
  'calendar': '📅',
};

function getIconDisplay(icon?: string): string {
  return icon ? (iconMap[icon] || '📄') : '📄';
}

export function ResultItem({ prompt, isSelected, onClick, onMouseEnter }: ResultItemProps) {
  return (
    <div
      className={`result-item ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    >
      <div
        className="result-icon"
        style={{ backgroundColor: prompt.color || '#6B7280' }}
      >
        {getIconDisplay(prompt.icon)}
      </div>
      <div className="result-content">
        <div className="result-name">{prompt.name}</div>
        {prompt.description && (
          <div className="result-description">{prompt.description}</div>
        )}
      </div>
      {prompt.folder && (
        <div className="result-folder">{prompt.folder}</div>
      )}
      {prompt.variables && prompt.variables.length > 0 && (
        <div className="result-has-variables" title="Press Tab to fill variables">
          {{ "{" }}{{ "{" }}{{ "}" }}{{ "}" }}
        </div>
      )}
    </div>
  );
}
```

### `components/SpotlightWindow/ContextModal.tsx`

```tsx
import { useState, FormEvent } from 'react';
import type { Prompt, Variable } from '../../lib/types';

interface ContextModalProps {
  prompt: Prompt;
  onConfirm: (variables: Record<string, string>) => void;
  onCancel: () => void;
}

export function ContextModal({ prompt, onConfirm, onCancel }: ContextModalProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    prompt.variables?.forEach(v => {
      initial[v.name] = v.default || '';
    });
    return initial;
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onConfirm(values);
  };

  return (
    <div className="context-modal-overlay" onClick={onCancel}>
      <div className="context-modal" onClick={e => e.stopPropagation()}>
        <h3>Fill in variables for "{prompt.name}"</h3>
        <form onSubmit={handleSubmit}>
          {prompt.variables?.map((variable, index) => (
            <div key={variable.name} className="variable-field">
              <label>
                {variable.name}
                {variable.required && <span className="required">*</span>}
              </label>
              <input
                type="text"
                value={values[variable.name] || ''}
                onChange={e => setValues(prev => ({
                  ...prev,
                  [variable.name]: e.target.value
                }))}
                placeholder={variable.default || `Enter ${variable.name}`}
                autoFocus={index === 0}
                required={variable.required}
              />
            </div>
          ))}
          <div className="modal-actions">
            <button type="button" onClick={onCancel} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="confirm-button">
              Use Prompt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

---

## 4. App Integration

### `src/App.tsx`

```tsx
import { SpotlightWindow } from './components/SpotlightWindow';
import { MockPromptService } from './services/MockPromptService';
import { TauriPromptService } from './services/TauriPromptService';
import './styles/globals.css';

// Use mock service during development, Tauri service in production
const isDevelopment = import.meta.env.DEV;
const promptService = isDevelopment
  ? new MockPromptService()
  : new TauriPromptService();

function App() {
  return (
    <div className="w-[700px] h-[500px]">
      <SpotlightWindow service={promptService} />
    </div>
  );
}

export default App;
```

---

## 5. Styles

### `styles/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Window container */
.spotlight-window {
  @apply flex flex-col w-full h-full bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden border border-gray-700/50;
}

/* Loading/Error states */
.loading, .error {
  @apply flex items-center justify-center h-full text-gray-400;
}

.error {
  @apply text-red-400;
}

/* Search input */
.search-input-container {
  @apply flex items-center gap-3 px-4 py-3 border-b border-gray-700/50;
}

.search-icon {
  @apply text-gray-400;
}

.search-input {
  @apply flex-1 bg-transparent text-white text-lg placeholder-gray-500 outline-none;
}

.clear-button {
  @apply p-1 text-gray-500 hover:text-gray-300 transition-colors;
}

/* Results list */
.results-list {
  @apply flex-1 overflow-y-auto;
}

.no-results {
  @apply py-8 text-center text-gray-400;
}

/* Result item */
.result-item {
  @apply flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-gray-800/30 last:border-b-0;
}

.result-item:hover,
.result-item.selected {
  @apply bg-blue-600/20;
}

.result-icon {
  @apply w-10 h-10 rounded-lg flex items-center justify-center text-white text-xl flex-shrink-0;
}

.result-content {
  @apply flex-1 min-w-0;
}

.result-name {
  @apply font-medium text-white truncate;
}

.result-description {
  @apply text-sm text-gray-400 truncate;
}

.result-folder {
  @apply text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded flex-shrink-0;
}

.result-has-variables {
  @apply text-xs text-gray-500 flex-shrink-0;
}

/* Context modal */
.context-modal-overlay {
  @apply fixed inset-0 bg-black/60 flex items-center justify-center z-50;
}

.context-modal {
  @apply bg-gray-900 rounded-xl p-6 w-[450px] max-w-[90vw] shadow-2xl border border-gray-700;
}

.context-modal h3 {
  @apply text-lg font-semibold text-white mb-4;
}

.variable-field {
  @apply mb-4;
}

.variable-field label {
  @apply block text-sm text-gray-400 mb-1;
}

.variable-field .required {
  @apply text-red-400 ml-1;
}

.variable-field input {
  @apply w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500;
}

.modal-actions {
  @apply flex justify-end gap-3 mt-6;
}

.cancel-button {
  @apply px-4 py-2 text-gray-400 hover:text-white transition-colors rounded-lg;
}

.confirm-button {
  @apply px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors;
}

/* Keyboard hints */
.keyboard-hints {
  @apply flex items-center justify-center gap-4 px-4 py-2 border-t border-gray-700/50 text-xs text-gray-500;
}

.keyboard-hint {
  @apply flex items-center gap-1.5;
}

.keyboard-hint kbd {
  @apply px-2 py-0.5 bg-gray-800 rounded text-gray-400 font-mono;
}
```

---

## Dependencies

```bash
npm install lucide-react  # For icons (Search, X)
```

---

## Success Criteria

```
[ ] PromptService interface defined (abstraction)
[ ] MockPromptService works without Tauri
[ ] TauriPromptService calls actual Tauri commands
[ ] usePrompts hook fetches data via service
[ ] useSearch hook filters prompts
[ ] useKeyboard hook handles all keyboard events
[ ] useSpotlightState centralizes state management
[ ] Components depend on hooks, not Tauri directly
[ ] SearchInput auto-focuses and listens for focus-search event
[ ] ResultsList scrolls selected item into view
[ ] ResultItem shows icon, name, description, folder
[ ] ContextModal opens for prompts with variables
[ ] Keyboard navigation works (↑↓ Enter Esc Tab)
[ ] Can swap MockPromptService for TauriPromptService easily
[ ] UI looks polished and professional
```

---

## Benefits of This Architecture

1. **Testability**: Components can be tested with MockPromptService
2. **Portability**: Not tied to Tauri - could swap for Electron, web API, etc.
3. **Separation of Concerns**: Components only handle presentation
4. **Reusability**: Hooks can be used across multiple components
5. **Type Safety**: TypeScript interfaces ensure consistency
6. **Maintainability**: Business logic centralized in hooks, not scattered in components

---

## Report Back

When complete, report:
1. **Architecture validation**: Clean separation of layers?
2. **Files created**: List all modules
3. **Service abstraction**: Can swap implementations easily?
4. **Test coverage**: Percentage covered (aim for 95%+)
5. **Design patterns used**: Service, Container/Presentation, Custom Hooks
6. **Screenshots**: UI appearance
7. **Any deviations from plan**
