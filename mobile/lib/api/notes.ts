import apiClient, { handleApiResponse, handleApiError } from './client';
import {
  Note,
  CreateNoteRequest,
  UpdateNoteRequest,
  GenerateNoteRequest,
  GenerateNoteFromTextRequest,
  GenerateNoteFromTextResponse,
  GenerateFocusedNoteRequest,
  GenerateFlashcardsRequest,
  GenerateQuizRequest,
  TranslateNoteRequest,
  Flashcard,
  Quiz,
  NoteTranslation,
  ApiResponse,
} from './types';

/**
 * Notes API Module
 * Handles all note-related operations including CRUD, AI generation, flashcards, quizzes, and translations
*/

// ==================== Basic CRUD Operations ====================

/**
 * Fetch all notes for the authenticated user
 * @param transcriptId - Optional transcript ID to filter notes
 */
export const getNotes = async (transcriptId?: string): Promise<Note[]> => {
  try {
    const params = transcriptId ? { transcriptId } : {};
    const response = await apiClient.get<ApiResponse<Note[]>>('/notes', { params });
    
    const notes = handleApiResponse<Note[]>(response);
    
    return notes;
  } catch (error) {
    console.error('❌ getNotes error:', error);
    console.error('🔍 Error details:', JSON.stringify(error, null, 2));
    return handleApiError(error);
  }
};

/**
 * Get a specific note by ID
 * @param id - Note ID
 */
export const getNoteById = async (id: string): Promise<Note> => {
  try {
    const response = await apiClient.get<ApiResponse<Note>>(`/notes/${id}`);
    return handleApiResponse<Note>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Create a new note
 * @param data - Note creation data
 */
export const createNote = async (data: CreateNoteRequest): Promise<Note> => {
  try {
    const response = await apiClient.post<ApiResponse<Note>>('/notes', data);
    return handleApiResponse<Note>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Update an existing note
 * @param id - Note ID
 * @param data - Updated note data
 */
export const updateNote = async (id: string, data: UpdateNoteRequest): Promise<Note> => {
  try {
    const response = await apiClient.put<ApiResponse<Note>>(`/notes/${id}`, data);
    return handleApiResponse<Note>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Delete a note
 * @param id - Note ID
 */
export const deleteNote = async (id: string): Promise<{ message: string }> => {
  try {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/notes/${id}`);
    return handleApiResponse<{ message: string }>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

// ==================== AI Generation ====================

/**
 * Generate an AI note from a transcript
 * @param data - Transcript ID
 */
export const generateAINote = async (data: GenerateNoteRequest): Promise<Note> => {
  try {
    // Use longer timeout for AI generation (120 seconds)
    const response = await apiClient.post<ApiResponse<Note>>(
      '/notes/generate', 
      data,
      { timeout: 120000 }
    );
    return handleApiResponse<Note>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Generate a note from raw text input
 * @param data - Text and title
 */
export const generateNoteFromText = async (
  data: GenerateNoteFromTextRequest
): Promise<GenerateNoteFromTextResponse> => {
  try {
    // Use longer timeout for AI generation (120 seconds)
    const response = await apiClient.post<ApiResponse<GenerateNoteFromTextResponse>>(
      '/notes/generate-from-text',
      data,
      { timeout: 120000 }
    );
    return handleApiResponse<GenerateNoteFromTextResponse>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Generate focused notes (summary, detailed, action-items)
 * @param data - Transcript ID and note type
 */
export const generateFocusedNote = async (data: GenerateFocusedNoteRequest): Promise<Note> => {
  try {
    // Use longer timeout for AI generation (120 seconds)
    const response = await apiClient.post<ApiResponse<Note>>(
      '/notes/generate-focused', 
      data,
      { timeout: 120000 }
    );
    return handleApiResponse<Note>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

// ==================== Flashcards ====================

/**
 * Get flashcards for a note
 * @param noteId - Note ID
 */
export const getFlashcards = async (noteId: string): Promise<Flashcard> => {
  try {
    const response = await apiClient.get<ApiResponse<Flashcard>>(`/notes/${noteId}/flashcards`);
    return handleApiResponse<Flashcard>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Generate flashcards from a note
 * @param data - Note ID
 */
export const generateFlashcards = async (data: GenerateFlashcardsRequest): Promise<Flashcard> => {
  try {
    // Use longer timeout for AI generation (120 seconds)
    const response = await apiClient.post<ApiResponse<Flashcard>>(
      '/notes/generate-flashcards', 
      data,
      { timeout: 120000 }
    );
    return handleApiResponse<Flashcard>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Delete flashcards for a note
 * @param noteId - Note ID
 */
export const deleteFlashcards = async (noteId: string): Promise<{ message: string }> => {
  try {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/notes/${noteId}/flashcards`
    );
    return handleApiResponse<{ message: string }>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

// ==================== Quizzes ====================

/**
 * Get quiz for a note
 * @param noteId - Note ID
 */
export const getQuiz = async (noteId: string): Promise<Quiz> => {
  try {
    const response = await apiClient.get<ApiResponse<Quiz>>(`/notes/${noteId}/quiz`);
    return handleApiResponse<Quiz>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Generate a quiz from a note
 * @param data - Note ID
 */
export const generateQuiz = async (data: GenerateQuizRequest): Promise<Quiz> => {
  try {
    // Use longer timeout for AI generation (120 seconds)
    const response = await apiClient.post<ApiResponse<Quiz>>(
      '/notes/generate-quiz', 
      data,
      { timeout: 120000 }
    );
    return handleApiResponse<Quiz>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Delete quiz for a note
 * @param noteId - Note ID
 */
export const deleteQuiz = async (noteId: string): Promise<{ message: string }> => {
  try {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/notes/${noteId}/quiz`
    );
    return handleApiResponse<{ message: string }>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

// ==================== Translations ====================

/**
 * Get translation for a note in a specific language
 * @param noteId - Note ID
 * @param language - Language code (e.g., 'es', 'fr', 'de')
 */
export const getTranslation = async (noteId: string, language: string): Promise<NoteTranslation> => {
  try {
    const response = await apiClient.get<ApiResponse<NoteTranslation>>(
      `/notes/${noteId}/translate`,
      {
        params: { language },
      }
    );
    return handleApiResponse<NoteTranslation>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Translate a note to a specific language
 * @param noteId - Note ID
 * @param data - Language to translate to
 */
export const translateNote = async (
  noteId: string,
  data: TranslateNoteRequest
): Promise<NoteTranslation> => {
  try {
    // Use longer timeout for AI translation (120 seconds)
    const response = await apiClient.post<ApiResponse<NoteTranslation>>(
      `/notes/${noteId}/translate`,
      data,
      { timeout: 120000 }
    );
    return handleApiResponse<NoteTranslation>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Delete translation for a note
 * @param noteId - Note ID
 * @param language - Language code
 */
export const deleteTranslation = async (
  noteId: string,
  language: string
): Promise<{ deleted: boolean }> => {
  try {
    const response = await apiClient.delete<ApiResponse<{ deleted: boolean }>>(
      `/notes/${noteId}/translate`,
      {
        params: { language },
      }
    );
    return handleApiResponse<{ deleted: boolean }>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

// ==================== Chat ====================

/**
 * Chat with AI about a note's content
 * @param noteId - Note ID to chat about
 * @param message - User's message
 */
export const chatWithNote = async (noteId: string, message: string): Promise<string> => {
  try {
    // Use longer timeout for AI chat responses (60 seconds)
    const response = await apiClient.post('/chatbot', {
      noteId,
      message,
    }, { timeout: 60000 });
    
    // Handle different response formats
    if (typeof response.data === 'string') {
      return response.data;
    } else if (response.data && typeof response.data === 'object') {
      // If response is an object, try to extract text
      return response.data.text || response.data.message || JSON.stringify(response.data);
    }
    
    return 'Sorry, I received an unexpected response format.';
  } catch (error) {
    console.error('Chat API error:', error);
    throw new Error('Failed to send message. Please try again.');
  }
};

export default {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  generateAINote,
  generateNoteFromText,
  generateFocusedNote,
  getFlashcards,
  generateFlashcards,
  deleteFlashcards,
  getQuiz,
  generateQuiz,
  deleteQuiz,
  getTranslation,
  translateNote,
  deleteTranslation,
  chatWithNote,
};
