import apiClient, { handleApiResponse, handleApiError } from './client';
import { ApiResponse } from './types';

// Podcast interface matching the actual API response (from web)
// This replaces the outdated Podcast interface in types.ts
export interface Podcast {
  id: string;
  noteId: string;
  userId?: string;
  jobId?: string; // Microservice job ID
  podcastId?: string; // Microservice podcast ID
  status: 'GENERATING' | 'COMPLETED' | 'FAILED';
  progress?: number;
  errorMessage?: string;
  audioUrl?: string;
  duration?: number; // Duration in seconds
  transcript?: any; // JSON transcript array (can be string or parsed)
  title: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
}

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

// Import Podcast type from types.ts to ensure consistency
import { Podcast } from './types';

export interface GeneratePodcastRequest {
  noteId: string;
  noteContent: string;
}

export interface GeneratePodcastResponse {
  success: boolean;
  jobId: string;
  podcastId: string;
  status: string;
  message: string;
  audioUrl?: string;
  audioDuration?: number;
}

/**
 * Get all podcasts for the authenticated user
 */
export const getPodcasts = async (userId: string): Promise<Podcast[]> => {
  try {
    const response = await apiClient.get<{ success: boolean; podcasts: Podcast[] }>(`/podcast/user/${userId}`);
    // Backend returns { success: true, podcasts: [...] } directly
    if (response.data.success) {
      return response.data.podcasts || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching user podcasts:', error);
    return [];
  }
};

/**
 * Get podcasts for a specific note
 * @param noteId - Note ID
 */
export const getPodcastsByNoteId = async (noteId: string): Promise<Podcast[]> => {
  try {
    const response = await apiClient.get<{ success: boolean; podcasts: Podcast[] }>(`/podcast/note/${noteId}`);
    // Backend returns { success: true, podcasts: [...] }
    if (response.data.success && response.data.podcasts) {
      // Parse transcript if it's a string (from database JSON field)
      return response.data.podcasts.map(podcast => ({
        ...podcast,
        transcript: typeof podcast.transcript === 'string' 
          ? JSON.parse(podcast.transcript) 
          : podcast.transcript,
      }));
    }
    return [];
  } catch (error) {
    // Return empty array on error instead of throwing
    console.error('Error fetching podcasts:', error);
    return [];
  }
};

/**
 * Generate a new podcast from a note (async with microservice)
 * @param data - Podcast generation parameters
 */
export const generatePodcast = async (data: GeneratePodcastRequest): Promise<GeneratePodcastResponse> => {
  try {
    const response = await apiClient.post<GeneratePodcastResponse>('/podcast/generate', data);
    // Backend returns the response directly without nesting under 'data'
    return response.data;
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
    const response = await apiClient.get<{ success: boolean; job: PodcastJob }>(`/podcast/status/${jobId}`);
    // Backend returns { success: true, job: {...} }
    if (response.data.success && response.data.job) {
      return response.data.job;
    }
    throw new Error('Invalid job status response');
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
