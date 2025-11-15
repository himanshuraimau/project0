import apiClient, { handleApiResponse, handleApiError } from './client';
import { SemanticSearchRequest, SemanticSearchResult, ApiResponse } from './types';

/**
 * Search API Module
 * Handles semantic search operations
 */

/**
 * Perform semantic search across notes
 * @param data - Search query and optional filters
 */
export const semanticSearch = async (
  data: SemanticSearchRequest
): Promise<SemanticSearchResult[]> => {
  try {
    const response = await apiClient.post<ApiResponse<SemanticSearchResult[]>>(
      '/search/semantic',
      data
    );
    return handleApiResponse<SemanticSearchResult[]>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export default {
  semanticSearch,
};
