import apiClient, { handleApiResponse, handleApiError } from './client';
import { MindMap, GenerateMindMapRequest, UpdateMindMapRequest, ApiResponse } from './types';

/**
 * MindMap API Module
 * Handles mind map generation and management
 */

/**
 * Get mind map for a note
 * @param noteId - Note ID
 */
export const getMindMapByNoteId = async (noteId: string): Promise<MindMap> => {
  try {
    const response = await apiClient.get<ApiResponse<MindMap>>(`/mindmap/${noteId}`);
    return handleApiResponse<MindMap>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Generate a mind map from a note
 * @param data - Note ID
 */
export const generateMindMap = async (data: GenerateMindMapRequest): Promise<MindMap> => {
  try {
    const response = await apiClient.post<ApiResponse<MindMap>>('/mindmap/generate', data);
    return handleApiResponse<MindMap>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Update a mind map
 * @param noteId - Note ID
 * @param data - Updated mind map data
 */
export const updateMindMap = async (
  noteId: string,
  data: UpdateMindMapRequest
): Promise<MindMap> => {
  try {
    const response = await apiClient.put<ApiResponse<MindMap>>(`/mindmap/${noteId}`, data);
    return handleApiResponse<MindMap>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Delete a mind map
 * @param noteId - Note ID
 */
export const deleteMindMap = async (noteId: string): Promise<{ message: string }> => {
  try {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/mindmap/${noteId}`
    );
    return handleApiResponse<{ message: string }>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export default {
  getMindMapByNoteId,
  generateMindMap,
  updateMindMap,
  deleteMindMap,
};
