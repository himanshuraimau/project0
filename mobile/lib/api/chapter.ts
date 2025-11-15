import apiClient, { handleApiResponse, handleApiError } from './client';
import {
  Chapter,
  Question,
  Flashcard,
  UserChapterProgress,
  ChapterInfoRequest,
  CreateChapterProgressRequest,
  ChapterChatRequest,
  ChapterChatMessage,
  ApiResponse,
} from './types';

/**
 * Chapter API Module
 * Handles chapter operations, quizzes, flashcards, progress, and chat
 */

/**
 * Get a specific chapter by ID
 * @param chapterId - Chapter ID
 */
export const getChapterById = async (chapterId: string): Promise<Chapter> => {
  try {
    const response = await apiClient.get<ApiResponse<Chapter>>(`/chapter/${chapterId}`);
    return handleApiResponse<Chapter>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get chapter transcript
 * @param chapterId - Chapter ID
 */
export const getChapterTranscript = async (chapterId: string): Promise<string> => {
  try {
    const response = await apiClient.get<ApiResponse<string>>(
      `/chapter/${chapterId}/transcript`
    );
    return handleApiResponse<string>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get chapter info (AI-powered Q&A)
 * @param data - Chapter ID and question
 */
export const getChapterInfo = async (data: ChapterInfoRequest): Promise<any> => {
  try {
    const response = await apiClient.post<ApiResponse<any>>('/chapter/info', data);
    return handleApiResponse<any>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

// ==================== Quiz Operations ====================

/**
 * Get quiz for a chapter
 * @param chapterId - Chapter ID
 */
export const getChapterQuiz = async (chapterId: string): Promise<Question[]> => {
  try {
    const response = await apiClient.get<ApiResponse<Question[]>>(`/chapter/${chapterId}/quiz`);
    return handleApiResponse<Question[]>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Create quiz for a chapter
 * @param chapterId - Chapter ID
 * @param data - Quiz data
 */
export const createChapterQuiz = async (chapterId: string, data: any): Promise<Question[]> => {
  try {
    const response = await apiClient.post<ApiResponse<Question[]>>(
      `/chapter/${chapterId}/quiz`,
      data
    );
    return handleApiResponse<Question[]>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Delete quiz for a chapter
 * @param chapterId - Chapter ID
 */
export const deleteChapterQuiz = async (chapterId: string): Promise<{ message: string }> => {
  try {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/chapter/${chapterId}/quiz`
    );
    return handleApiResponse<{ message: string }>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

// ==================== Flashcards Operations ====================

/**
 * Get flashcards for a chapter
 * @param chapterId - Chapter ID
 */
export const getChapterFlashcards = async (chapterId: string): Promise<Flashcard> => {
  try {
    const response = await apiClient.get<ApiResponse<Flashcard>>(
      `/chapter/${chapterId}/flashcards`
    );
    return handleApiResponse<Flashcard>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Create flashcards for a chapter
 * @param chapterId - Chapter ID
 * @param data - Flashcards data
 */
export const createChapterFlashcards = async (chapterId: string, data: any): Promise<Flashcard> => {
  try {
    const response = await apiClient.post<ApiResponse<Flashcard>>(
      `/chapter/${chapterId}/flashcards`,
      data
    );
    return handleApiResponse<Flashcard>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

// ==================== Progress Operations ====================

/**
 * Get chapter progress for the authenticated user
 * @param chapterId - Chapter ID
 */
export const getChapterProgress = async (chapterId: string): Promise<UserChapterProgress> => {
  try {
    const response = await apiClient.get<ApiResponse<UserChapterProgress>>(
      `/chapter/${chapterId}/progress`
    );
    return handleApiResponse<UserChapterProgress>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Update chapter progress (mark as completed)
 * @param chapterId - Chapter ID
 * @param data - Progress data
 */
export const updateChapterProgress = async (
  chapterId: string,
  data: CreateChapterProgressRequest
): Promise<UserChapterProgress> => {
  try {
    const response = await apiClient.post<ApiResponse<UserChapterProgress>>(
      `/chapter/${chapterId}/progress`,
      data
    );
    return handleApiResponse<UserChapterProgress>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Delete chapter progress
 * @param chapterId - Chapter ID
 */
export const deleteChapterProgress = async (chapterId: string): Promise<{ message: string }> => {
  try {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/chapter/${chapterId}/progress`
    );
    return handleApiResponse<{ message: string }>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

// ==================== Chat Operations ====================

/**
 * Get chat history for a chapter
 * @param chapterId - Chapter ID
 */
export const getChapterChat = async (chapterId: string): Promise<ChapterChatMessage[]> => {
  try {
    const response = await apiClient.get<ApiResponse<ChapterChatMessage[]>>(
      `/chapter/${chapterId}/chat`
    );
    return handleApiResponse<ChapterChatMessage[]>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Send a chat message for a chapter
 * @param chapterId - Chapter ID
 * @param data - Chat message
 */
export const sendChapterChat = async (
  chapterId: string,
  data: ChapterChatRequest
): Promise<ChapterChatMessage> => {
  try {
    const response = await apiClient.post<ApiResponse<ChapterChatMessage>>(
      `/chapter/${chapterId}/chat`,
      data
    );
    return handleApiResponse<ChapterChatMessage>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export default {
  getChapterById,
  getChapterTranscript,
  getChapterInfo,
  getChapterQuiz,
  createChapterQuiz,
  deleteChapterQuiz,
  getChapterFlashcards,
  createChapterFlashcards,
  getChapterProgress,
  updateChapterProgress,
  deleteChapterProgress,
  getChapterChat,
  sendChapterChat,
};
