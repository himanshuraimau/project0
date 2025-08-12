import { useState } from 'react';

interface SearchResult {
  chunks: {
    id: number;
    noteId: string;
    text: string;
    distance: number;
  }[];
  notes: Record<string, {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

interface UseSemanticSearchOptions {
  onError?: (error: Error) => void;
  noteId?: string;
  limit?: number;
}

/**
 * Hook for performing semantic search across user notes
 * 
 * @example
 * ```tsx
 * const { search, results, isSearching, error } = useSemanticSearch();
 * 
 * // Search all notes
 * search("What are the main topics in machine learning?");
 * 
 * // Search within a specific note
 * search("What are the key points?", { noteId: "note-123" });
 * 
 * // Display results
 * return (
 *   <div>
 *     {results?.chunks.map(chunk => (
 *       <div key={chunk.id}>
 *         <p>{chunk.text}</p>
 *         <p>From: {results.notes[chunk.noteId].title}</p>
 *       </div>
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useSemanticSearch({ 
  onError, 
  noteId: defaultNoteId, 
  limit: defaultLimit = 5 
}: UseSemanticSearchOptions = {}) {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const search = async (
    query: string, 
    options?: { noteId?: string; limit?: number }
  ) => {
    const noteId = options?.noteId ?? defaultNoteId;
    const limit = options?.limit ?? defaultLimit;
    
    if (!query.trim()) {
      setResults(null);
      return;
    }
    
    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch('/api/search/semantic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, noteId, limit }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to perform semantic search');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      onError?.(error);
    } finally {
      setIsSearching(false);
    }
  };

  return {
    search,
    isSearching,
    results,
    error,
    reset: () => setResults(null),
  };
}

export default useSemanticSearch;
