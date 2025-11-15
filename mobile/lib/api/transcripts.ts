import apiClient, { handleApiResponse, handleApiError } from './client';
import { Transcript, CreateTranscriptRequest, ApiResponse } from './types';

/**
 * Transcripts API Module
 * Handles transcript management operations
 */

/**
 * Get all transcripts for the authenticated user
 */
export const getTranscripts = async (): Promise<Transcript[]> => {
  try {
    const response = await apiClient.get<ApiResponse<Transcript[]>>('/transcripts');
    return handleApiResponse<Transcript[]>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get a specific transcript by ID
 * @param id - Transcript ID
 */
export const getTranscriptById = async (id: string): Promise<Transcript> => {
  try {
    const response = await apiClient.get<ApiResponse<Transcript>>(`/transcripts/${id}`);
    return handleApiResponse<Transcript>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Create a new transcript
 * @param data - Transcript data
 */
export const createTranscript = async (data: CreateTranscriptRequest): Promise<Transcript> => {
  try {
    const response = await apiClient.post<ApiResponse<Transcript>>('/transcripts', data);
    return handleApiResponse<Transcript>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Delete a transcript
 * @param id - Transcript ID
 */
export const deleteTranscript = async (id: string): Promise<{ message: string }> => {
  try {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/transcripts/${id}`
    );
    return handleApiResponse<{ message: string }>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export default {
  getTranscripts,
  getTranscriptById,
  createTranscript,
  deleteTranscript,
};
