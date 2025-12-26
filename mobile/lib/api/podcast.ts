import apiClient, { handleApiResponse, handleApiError } from './client';
import { ApiResponse } from './types';

/**
 * Podcast API Module
 * Handles podcast generation and management with microservice
 */

// Updated types for microservice integration
export interface PodcastJob {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep?: string;
  audioUrl?: string;
  audioDuration?: number;
  transcript?: any[];
  error?: string;
}

export interface Podcast {
  id: string;
  noteId: string;
  jobId?: string;
  podcastId?: string;
  audioUrl?: string;
  duration?: number;
  transcript?: any[];
  status: 'GENERATING' | 'COMPLETED' | 'FAILED';
  progress?: number;
  errorMessage?: string;
  title: string;
  description?: string;
  createdAt: string;
  completedAt?: string;
}

export interface GeneratePodcastRequest {
  noteId: string;
  noteContent: string;
  duration?: 'short' | 'long';
}

export interface GeneratePodcastResponse {
  success: boolean;
  jobId: string;
  podcastId: string;
  status: string;
  message: string;
}

/**
 * Get all podcasts for the authenticated user
 */
export const getPodcasts = async (userId: string): Promise<Podcast[]> => {
  try {
    const response = await apiClient.get<ApiResponse<{ podcasts: Podcast[] }>>(`/podcast/user/${userId}`);
    const data = handleApiResponse<{ podcasts: Podcast[] }>(response);
    return data.podcasts;
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
    const response = await apiClient.get<ApiResponse<{ podcasts: Podcast[] }>>(`/podcast/note/${noteId}`);
    const data = handleApiResponse<{ podcasts: Podcast[] }>(response);
    return data.podcasts;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Generate a new podcast from a note (async with microservice)
 * @param data - Podcast generation parameters
 */
export const generatePodcast = async (data: GeneratePodcastRequest): Promise<GeneratePodcastResponse> => {
  try {
    const response = await apiClient.post<ApiResponse<GeneratePodcastResponse>>('/podcast/generate', data);
    return handleApiResponse<GeneratePodcastResponse>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get podcast generation job status
 * @param jobId - Job ID from generatePodcast
 */
export const getPodcastStatus = async (jobId: string): Promise<PodcastJob> => {
  try {
    const response = await apiClient.get<ApiResponse<{ job: PodcastJob }>>(`/podcast/status/${jobId}`);
    const data = handleApiResponse<{ job: PodcastJob }>(response);
    return data.job;
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

export default {
  getPodcasts,
  getPodcastsByNoteId,
  generatePodcast,
  getPodcastStatus,
  deletePodcast,
};
