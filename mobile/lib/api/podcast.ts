import apiClient, { handleApiResponse, handleApiError } from './client';
import { Podcast, GeneratePodcastRequest, ApiResponse } from './types';

/**
 * Podcast API Module
 * Handles podcast generation and management
 */

/**
 * Get all podcasts for the authenticated user
 */
export const getPodcasts = async (): Promise<Podcast[]> => {
  try {
    const response = await apiClient.get<ApiResponse<Podcast[]>>('/podcast');
    return handleApiResponse<Podcast[]>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get a specific podcast by ID
 * @param id - Podcast ID
 */
export const getPodcastById = async (id: string): Promise<Podcast> => {
  try {
    const response = await apiClient.get<ApiResponse<Podcast>>(`/podcast/${id}`);
    return handleApiResponse<Podcast>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get podcasts for a specific note
 * @param noteId - Note ID
 */
export const getPodcastsByNoteId = async (noteId: string): Promise<Podcast[]> => {
  try {
    const response = await apiClient.get<ApiResponse<Podcast[]>>(`/podcast/note/${noteId}`);
    return handleApiResponse<Podcast[]>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Generate a new podcast from a note
 * @param data - Podcast generation parameters
 */
export const generatePodcast = async (data: GeneratePodcastRequest): Promise<Podcast> => {
  try {
    const response = await apiClient.post<ApiResponse<Podcast>>('/podcast/generate', data);
    return handleApiResponse<Podcast>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Delete a podcast
 * @param id - Podcast ID
 */
export const deletePodcast = async (id: string): Promise<{ message: string }> => {
  try {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/podcast/${id}`);
    return handleApiResponse<{ message: string }>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Handle webhook for podcast generation updates
 * Note: This is typically called by the server, not the mobile app
 * @param webhookData - Webhook payload
 */
export const handlePodcastWebhook = async (webhookData: any): Promise<any> => {
  try {
    const response = await apiClient.post<ApiResponse<any>>('/podcast/webhook', webhookData);
    return handleApiResponse<any>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export default {
  getPodcasts,
  getPodcastById,
  getPodcastsByNoteId,
  generatePodcast,
  deletePodcast,
  handlePodcastWebhook,
};
