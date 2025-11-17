import apiClient, { handleApiResponse, handleApiError } from './client';
import { ProcessWebpageRequest, ProcessWebpageResponse, ApiResponse } from './types';

/**
 * Webpage API Module
 * Handles webpage content extraction and processing
 */

/**
 * Process a webpage URL to extract content and create a transcript
 * @param data - Webpage URL
 */
export const processWebpage = async (
  data: ProcessWebpageRequest
): Promise<ProcessWebpageResponse> => {
  try {
    // Use longer timeout for webpage processing and AI generation (180 seconds)
    const response = await apiClient.post<ApiResponse<ProcessWebpageResponse>>(
      '/webpage/process',
      data,
      { timeout: 180000 } // 3 minutes for extraction + note generation
    );
    return handleApiResponse<ProcessWebpageResponse>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export default {
  processWebpage,
};
