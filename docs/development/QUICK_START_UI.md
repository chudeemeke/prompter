# Quick Start - UI Development

## Running the UI

### Development Mode (with mocks)
```bash
npm run dev
```
Opens at http://localhost:1420

### Build for Production
```bash
npm run build
```
Outputs to `dist/`

---

## Adding a New Service Implementation

1. Create new service class:
```typescript
// src/services/MyCustomService.ts
import type { PromptService } from './PromptService';
import type { Prompt, SearchResult } from '../lib/types';

export class MyCustomService implements PromptService {
  async getAllPrompts(): Promise<Prompt[]> {
    // Your implementation
  }

  async getPrompt(id: string): Promise<Prompt> {
    // Your implementation
  }

  // ... implement all methods
}
```

2. Use in App.tsx:
```typescript
import { MyCustomService } from './services/MyCustomService';

const service = new MyCustomService();

function App() {
  return <SpotlightWindow service={service} />;
}
```

---

## Adding a New Component

1. Create component file:
```typescript
// src/components/SpotlightWindow/MyComponent.tsx
interface MyComponentProps {
  value: string;
  onChange: (value: string) => void;
}

export function MyComponent({ value, onChange }: MyComponentProps) {
  return (
    <div>
      {/* Your UI */}
    </div>
  );
}
```

2. Import in container:
```typescript
// src/components/SpotlightWindow/index.tsx
import { MyComponent } from './MyComponent';

export function SpotlightWindow({ service }: SpotlightWindowProps) {
  return (
    <div className="spotlight-window">
      <MyComponent value={state.value} onChange={state.setValue} />
    </div>
  );
}
```

---

## Adding a New Hook

1. Create hook file:
```typescript
// src/hooks/useMyHook.ts
import { useState, useEffect } from 'react';

export function useMyHook(dependency: string) {
  const [state, setState] = useState('');

  useEffect(() => {
    // Your logic
  }, [dependency]);

  return { state, setState };
}
```

2. Use in component:
```typescript
import { useMyHook } from '../../hooks/useMyHook';

export function SpotlightWindow({ service }: SpotlightWindowProps) {
  const { state, setState } = useMyHook(service);

  return <div>{state}</div>;
}
```

---

## Switching from Mock to Tauri Service

In `src/App.tsx`:

```typescript
// Change this:
const promptService = isDevelopment
  ? new MockPromptService()
  : new MockPromptService();

// To this:
const promptService = isDevelopment
  ? new MockPromptService()
  : new TauriPromptService();
```

---

## Testing Components

### Setup React Testing Library
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest
```

### Example Test
```typescript
// src/components/SpotlightWindow/SearchInput.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchInput } from './SearchInput';

test('renders search input', () => {
  const onChange = vi.fn();
  render(<SearchInput value="" onChange={onChange} />);

  const input = screen.getByPlaceholderText('Search prompts...');
  expect(input).toBeInTheDocument();

  fireEvent.change(input, { target: { value: 'test' } });
  expect(onChange).toHaveBeenCalledWith('test');
});
```

---

## Adding Styles

### Option 1: TailwindCSS Utilities
```tsx
<div className="flex items-center gap-3 px-4 py-3">
  {/* Your content */}
</div>
```

### Option 2: Custom Classes in index.css
```css
/* src/index.css */
.my-custom-class {
  @apply flex items-center gap-3 px-4 py-3;
}
```

Then use:
```tsx
<div className="my-custom-class">
  {/* Your content */}
</div>
```

---

## Debugging

### Console Logs in Mock Service
The MockPromptService logs all actions:
```
[Mock] Copy and paste: { text: "...", autoPaste: true }
[Mock] Hide and restore
[Mock] Record usage: abc123
```

### React DevTools
Install React DevTools browser extension to inspect:
- Component hierarchy
- Props and state
- Hooks values
- Re-render performance

### Vite DevTools
Press `Shift + Option + D` (Mac) or `Shift + Alt + D` (Windows) in browser to see:
- Module graph
- Dependencies
- Build stats

---

## Common Issues

### Issue: Components not updating
**Solution:** Check if state is properly managed in hooks

### Issue: Keyboard shortcuts not working
**Solution:** Verify useKeyboard is called in container component

### Issue: Styles not applying
**Solution:** Ensure TailwindCSS classes are in index.css or use @apply

### Issue: Service not swapping
**Solution:** Check App.tsx service instantiation logic

---

## File Naming Conventions

- **Components:** PascalCase (SearchInput.tsx)
- **Hooks:** camelCase with "use" prefix (usePrompts.ts)
- **Services:** PascalCase (MockPromptService.ts)
- **Types:** PascalCase (Prompt, SearchResult)
- **CSS classes:** kebab-case (search-input-container)

---

## Import Order Convention

```typescript
// 1. React imports
import { useState, useEffect } from 'react';

// 2. Third-party imports
import { Search, X } from 'lucide-react';

// 3. Internal imports (types)
import type { Prompt } from '../../lib/types';

// 4. Internal imports (hooks)
import { usePrompts } from '../../hooks/usePrompts';

// 5. Internal imports (components)
import { SearchInput } from './SearchInput';
```

---

## Key Keyboard Shortcuts

| Key | Action | Component |
|-----|--------|-----------|
| `↑` | Move selection up | SpotlightWindow |
| `↓` | Move selection down | SpotlightWindow |
| `Enter` | Select prompt | SpotlightWindow |
| `Tab` | Open variable modal | SpotlightWindow |
| `Escape` | Close window/modal | SpotlightWindow/ContextModal |

---

## Next Steps

1. **Backend Integration**
   - Implement Tauri commands in Rust
   - Test TauriPromptService
   - Switch service in App.tsx

2. **Testing**
   - Add unit tests for hooks
   - Add component tests
   - Add integration tests

3. **Enhancement**
   - Add fuzzy search highlighting
   - Implement frecency scoring
   - Add preview pane
   - Add keyboard shortcuts help

---

## Useful Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Tauri
npm run tauri:dev    # Run Tauri in dev mode
npm run tauri:build  # Build Tauri app

# Testing (when setup)
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run coverage     # Generate coverage report
```

---

## Resources

- [React Docs](https://react.dev)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Tauri Docs](https://tauri.app)
- [TypeScript Docs](https://www.typescriptlang.org/docs)
- [Lucide Icons](https://lucide.dev)
