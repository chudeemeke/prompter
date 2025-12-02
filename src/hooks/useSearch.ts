import { useMemo } from 'react';
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

    const lowerQuery = query.trim().toLowerCase();
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
