import { useRef, useEffect } from 'react';
import type { Prompt } from '../../lib/types';
import { ResultItem } from './ResultItem';

interface ResultsListProps {
  results: Prompt[];
  selected_index: number;
  onSelect: (prompt: Prompt) => void;
  onHover: (index: number) => void;
}

/**
 * Display list of prompt results
 */
export function ResultsList({ results, selected_index, onSelect, onHover }: ResultsListProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll selected item into view
  useEffect(() => {
    const selectedElement = listRef.current?.children[selected_index] as HTMLElement;
    selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selected_index]);

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
          isSelected={index === selected_index}
          onClick={() => onSelect(prompt)}
          onMouseEnter={() => onHover(index)}
        />
      ))}
    </div>
  );
}
