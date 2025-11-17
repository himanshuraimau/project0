import apiClient, { handleApiResponse, handleApiError } from './client';
import { TranscribeAudioResponse, ApiResponse } from './types';

/**
 * Audio API Module
 * Handles audio transcription operations
 */

/**
 * Transcribe audio file to text
 * @param audioFile - Audio file to transcribe
 */
export const transcribeAudio = async (audioFile: FormData): Promise<TranscribeAudioResponse> => {
  try {
    // Use longer timeout for audio transcription and AI generation (180 seconds)
    const response = await apiClient.post<ApiResponse<TranscribeAudioResponse>>(
      '/audio/transcribe',
      audioFile,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 180000, // 3 minutes for transcription + note generation
      }
    );
    return handleApiResponse<TranscribeAudioResponse>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export default {
  transcribeAudio,
};
