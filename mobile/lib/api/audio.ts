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
    const response = await apiClient.post<ApiResponse<TranscribeAudioResponse>>(
      '/audio/transcribe',
      audioFile,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
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
