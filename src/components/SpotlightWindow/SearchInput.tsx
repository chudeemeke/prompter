import { useRef, useEffect } from 'react';
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
        aria-label="Search prompts"
        data-testid="search-input"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="clear-button"
          aria-label="Clear search"
          title="Clear search"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
