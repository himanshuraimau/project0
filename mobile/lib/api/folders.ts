import apiClient, { handleApiResponse, handleApiError } from './client';
import {
  Folder,
  FolderWithCount,
  CreateFolderRequest,
  UpdateFolderRequest,
  ApiResponse,
} from './types';

/**
 * Folders API Module
 * Handles all folder-related operations including CRUD and note organization
 */

// ==================== Basic CRUD Operations ====================

/**
 * Fetch all folders for the authenticated user
 * Returns folders with note counts, ordered by position
 */
export const getFolders = async (): Promise<FolderWithCount[]> => {
  try {
    const response = await apiClient.get<ApiResponse<FolderWithCount[]>>('/folders');
    return handleApiResponse<FolderWithCount[]>(response);
  } catch (error) {
    console.error('❌ getFolders error:', error);
    return handleApiError(error);
  }
};

/**
 * Get a specific folder by ID
 * @param id - Folder ID
 * @param includeNotes - Whether to include notes in the response
 */
export const getFolderById = async (
  id: string,
  includeNotes: boolean = true
): Promise<Folder> => {
  try {
    const response = await apiClient.get<ApiResponse<Folder>>(
      `/folders/${id}`,
      {
        params: { includeNotes },
      }
    );
    return handleApiResponse<Folder>(response);
  } catch (error) {
    console.error('❌ getFolderById error:', error);
    return handleApiError(error);
  }
};

/**
 * Create a new folder
 * @param data - Folder creation data
 */
export const createFolder = async (data: CreateFolderRequest): Promise<Folder> => {
  try {
    const response = await apiClient.post<ApiResponse<Folder>>('/folders', data);
    return handleApiResponse<Folder>(response);
  } catch (error) {
    console.error('❌ createFolder error:', error);
    return handleApiError(error);
  }
};

/**
 * Update an existing folder
 * @param id - Folder ID
 * @param data - Updated folder data
 */
export const updateFolder = async (
  id: string,
  data: UpdateFolderRequest
): Promise<Folder> => {
  try {
    const response = await apiClient.put<ApiResponse<Folder>>(`/folders/${id}`, data);
    return handleApiResponse<Folder>(response);
  } catch (error) {
    console.error('❌ updateFolder error:', error);
    return handleApiError(error);
  }
};

/**
 * Delete a folder
 * Notes in the folder will be moved to uncategorized
 * @param id - Folder ID
 */
export const deleteFolder = async (id: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/folders/${id}`);
    const data = handleApiResponse<{ message: string }>(response);
    return { success: true, message: data?.message || 'Folder deleted successfully' };
  } catch (error) {
    console.error('❌ deleteFolder error:', error);
    return handleApiError(error);
  }
};

// ==================== Note Organization ====================

/**
 * Move a note to a different folder
 * @param noteId - Note ID
 * @param folderId - Target folder ID (null for uncategorized)
 */
export const moveNoteToFolder = async (
  noteId: string,
  folderId: string | null
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.put<ApiResponse<{ message: string }>>(
      `/notes/${noteId}/move`,
      { folderId }
    );
    const data = handleApiResponse<{ message: string }>(response);
    return { success: true, message: data?.message || 'Note moved successfully' };
  } catch (error) {
    console.error('❌ moveNoteToFolder error:', error);
    return handleApiError(error);
  }
};

export default {
  getFolders,
  getFolderById,
  createFolder,
  updateFolder,
  deleteFolder,
  moveNoteToFolder,
};
