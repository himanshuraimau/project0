/**
 * Search and semantic search functionality types
 */

// Basic search chunk structure
export interface SearchChunk {
  id: number;
  noteId: string;
  text: string;
  distance: number;
}

// Search result containing chunks and associated notes
export interface SearchResult {
  chunks: SearchChunk[];
  notes: Record<string, SearchNote>;
}

// Note information included in search results
export interface SearchNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// Options for configuring semantic search hook
export interface UseSemanticSearchOptions {
  onError?: (error: Error) => void;
  noteId?: string;
  limit?: number;
}

// Request payload for semantic search API
export interface SemanticSearchRequest {
  query: string;
  noteId?: string;
  limit?: number;
}

// Response from semantic search API
export interface SemanticSearchResponse {
  chunks: SearchChunk[];
  notes: Record<string, SearchNote>;
}

// Hook return type for semantic search
export interface UseSemanticSearchReturn {
  search: (query: string, options?: { noteId?: string; limit?: number }) => Promise<void>;
  isSearching: boolean;
  results: SearchResult | null;
  error: Error | null;
  reset: () => void;
}

// Database chunk structure (from embedding service)
export interface DatabaseChunk {
  id: number;
  note_id: string;
  chunk_text: string;
  distance: number;
}

// General search request structure
export interface GeneralSearchRequest {
  query: string;
  filters?: Record<string, unknown>;
  page?: number;
  limit?: number;
}

// Search error types
export interface SearchError extends Error {
  code?: 'UNAUTHORIZED' | 'NOT_FOUND' | 'INVALID_QUERY' | 'SERVER_ERROR';
  details?: unknown;
}