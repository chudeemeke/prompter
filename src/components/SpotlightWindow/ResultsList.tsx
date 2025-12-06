import { useRef, useEffect } from 'react';
import { Search, FileText } from 'lucide-react';
import type { Prompt } from '../../lib/types';
import { ResultItem } from './ResultItem';

interface ResultsListProps {
  results: Prompt[];
  selected_index: number;
  onSelect: (prompt: Prompt) => void;
  onHover: (index: number) => void;
  /** Whether there are any prompts at all (not just search results) */
  hasPrompts?: boolean;
  /** Search query for contextual empty state */
  searchQuery?: string;
}

/**
 * Display list of prompt results
 */
export function ResultsList({
  results,
  selected_index,
  onSelect,
  onHover,
  hasPrompts = true,
  searchQuery = '',
}: ResultsListProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll selected item into view
  useEffect(() => {
    const selectedElement = listRef.current?.children[selected_index] as HTMLElement;
    selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selected_index]);

  if (results.length === 0) {
    // No prompts exist at all
    if (!hasPrompts) {
      return (
        <div className="empty-state" data-testid="empty-state">
          <FileText className="empty-state-icon" />
          <div className="empty-state-title">No prompts yet</div>
          <div className="empty-state-description">
            Create your first prompt to get started. Prompts are stored in your
            ~/.prompter/prompts folder.
          </div>
        </div>
      );
    }

    // No search results for current query
    return (
      <div className="empty-state" data-testid="empty-state">
        <Search className="empty-state-icon" />
        <div className="empty-state-title">No results found</div>
        <div className="empty-state-description">
          {searchQuery
            ? `No prompts match "${searchQuery}"`
            : 'Try searching for a prompt name or description'}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      className="results-list"
      data-testid="results-list"
      role="listbox"
      aria-label="Search results"
    >
      {results.map((prompt, index) => (
        <ResultItem
          key={prompt.id}
          prompt={prompt}
          isSelected={index === selected_index}
          onClick={() => onSelect(prompt)}
          onMouseEnter={() => onHover(index)}
        />
      ))}
    </div>
  );
}
