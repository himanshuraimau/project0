/**
 * API Usage Examples
 * 
 * This file demonstrates common API usage patterns for the mobile app.
 * Copy these examples into your components and modify as needed.
 */

import {
  notesApi,
  transcriptsApi,
  audioApi,
  pdfApi,
  podcastApi,
  userApi,
  subscriptionApi,
  courseApi,
  chapterApi,
} from '@/lib/api';
import type { Note, PodcastMode, QualityPreset } from '@/lib/api/types';
import type { Podcast } from '@/lib/api/podcast';

// ==================== Notes Examples ====================

/**
 * Example: Fetch and display user notes
 */
export const fetchUserNotes = async () => {
  try {
    const notes = await notesApi.getNotes();
    return notes;
  } catch (error) {
    console.error('Failed to fetch notes:', error);
    throw error;
  }
};

/**
 * Example: Create a new note
 */
export const createNewNote = async (title: string, content: string, transcriptId: string) => {
  try {
    const note = await notesApi.createNote({
      title,
      content,
      transcriptId,
    });
    console.log('Note created:', note.id);
    return note;
  } catch (error) {
    console.error('Failed to create note:', error);
    throw error;
  }
};

/**
 * Example: Generate AI note from transcript
 */
export const generateAINoteFromTranscript = async (transcriptId: string) => {
  try {
    const note = await notesApi.generateAINote({ transcriptId });
    console.log('AI note generated:', note.id);
    return note;
  } catch (error) {
    console.error('Failed to generate AI note:', error);
    throw error;
  }
};

/**
 * Example: Generate flashcards from a note
 */
export const generateFlashcardsForNote = async (noteId: string) => {
  try {
    // Check if flashcards already exist
    try {
      const existing = await notesApi.getFlashcards(noteId);
      console.log('Flashcards already exist');
      return existing;
    } catch {
      // Generate new flashcards
      const flashcards = await notesApi.generateFlashcards({ noteId });
      console.log('Flashcards generated:', flashcards.id);
      return flashcards;
    }
  } catch (error) {
    console.error('Failed to generate flashcards:', error);
    throw error;
  }
};

/**
 * Example: Translate a note to Spanish
 */
export const translateNoteToSpanish = async (noteId: string) => {
  try {
    const translation = await notesApi.translateNote(noteId, { language: 'es' });
    console.log('Translation created:', translation.id);
    return translation;
  } catch (error) {
    console.error('Failed to translate note:', error);
    throw error;
  }
};

// ==================== Audio Examples ====================

/**
 * Example: Transcribe audio file
 */
export const transcribeAudioFile = async (audioUri: string, fileName: string) => {
  try {
    const formData = new FormData();
    formData.append('audio', {
      uri: audioUri,
      type: 'audio/m4a', // or appropriate mime type
      name: fileName,
    } as any);

    const result = await audioApi.transcribeAudio(formData);
    console.log('Audio transcribed:', result.transcript.id);
    return result;
  } catch (error) {
    console.error('Failed to transcribe audio:', error);
    throw error;
  }
};

// ==================== PDF Examples ====================

/**
 * Example: Process a PDF file
 */
export const processPDFFile = async (pdfUri: string, fileName: string) => {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri: pdfUri,
      type: 'application/pdf',
      name: fileName,
    } as any);

    const result = await pdfApi.processPDF(formData);
    console.log('PDF processed:', result);
    return result;
  } catch (error) {
    console.error('Failed to process PDF:', error);
    throw error;
  }
};

/**
 * Example: Ask AI about a PDF
 */
export const askPDFQuestion = async (pdfId: string, question: string) => {
  try {
    const response = await pdfApi.askPDFAI(pdfId, question);
    console.log('AI response:', response);
    return response;
  } catch (error) {
    console.error('Failed to get AI response:', error);
    throw error;
  }
};

// ==================== Podcast Examples ====================

/**
 * Example: Generate a podcast from a note
 */
export const generatePodcastFromNote = async (noteId: string) => {
  try {
    const podcast = await podcastApi.generatePodcast({
      noteId,
      mode: 'CONVERSATION' as PodcastMode,
      hostVoiceId: 'default-host-voice',
      guestVoiceId: 'default-guest-voice',
      qualityPreset: 'HIGH' as QualityPreset,
    });
    console.log('Podcast generation started:', podcast.id);
    return podcast;
  } catch (error) {
    console.error('Failed to generate podcast:', error);
    throw error;
  }
};

/**
 * Example: Check podcast generation status
 */
export const checkPodcastStatus = async (podcastId: string) => {
  try {
    const podcast = await podcastApi.getPodcastById(podcastId);
    console.log('Podcast status:', podcast.status, podcast.progress);
    return podcast;
  } catch (error) {
    console.error('Failed to check podcast status:', error);
    throw error;
  }
};

// ==================== User & Subscription Examples ====================

/**
 * Example: Get user profile and credits
 */
export const getUserInfo = async () => {
  try {
    const [profile, credits] = await Promise.all([
      userApi.getUserProfile(),
      userApi.getUserCredits(),
    ]);
    console.log('User profile:', profile);
    console.log('Credits remaining:', credits.credits);
    return { profile, credits };
  } catch (error) {
    console.error('Failed to get user info:', error);
    throw error;
  }
};

/**
 * Example: Check subscription status
 */
export const checkSubscription = async () => {
  try {
    const subscription = await subscriptionApi.getSubscriptionStatus();
    const isActive = subscription.status === 'ACTIVE';
    console.log('Subscription active:', isActive);
    return { subscription, isActive };
  } catch (error) {
    console.error('Failed to check subscription:', error);
    return { subscription: null, isActive: false };
  }
};

/**
 * Example: Create a subscription
 */
export const createNewSubscription = async (billingInterval: 'monthly' | 'yearly' = 'monthly') => {
  try {
    const result = await subscriptionApi.createSubscription({
      billingInterval,
      successUrl: 'flinote://payment-status',
      cancelUrl: 'flinote://payment-status',
    });
    console.log('Subscription checkout URL:', result.checkoutUrl);
    return result;
  } catch (error) {
    console.error('Failed to create subscription:', error);
    throw error;
  }
};

// ==================== Course Examples ====================

/**
 * Example: Get all courses and their progress
 */
export const getCoursesWithProgress = async () => {
  try {
    const courses = await courseApi.getCourses();
    const coursesWithProgress = await Promise.all(
      courses.map(async (course) => {
        try {
          const progress = await courseApi.getCourseProgress(course.id);
          return { ...course, progress };
        } catch {
          return { ...course, progress: null };
        }
      })
    );
    return coursesWithProgress;
  } catch (error) {
    console.error('Failed to get courses:', error);
    throw error;
  }
};

/**
 * Example: Mark chapter as completed
 */
export const markChapterComplete = async (chapterId: string) => {
  try {
    const progress = await chapterApi.updateChapterProgress(chapterId, {
      isCompleted: true,
    });
    console.log('Chapter completed:', progress);
    return progress;
  } catch (error) {
    console.error('Failed to mark chapter complete:', error);
    throw error;
  }
};

/**
 * Example: Chat with chapter content
 */
export const chatWithChapter = async (chapterId: string, message: string) => {
  try {
    const response = await chapterApi.sendChapterChat(chapterId, { message });
    console.log('AI response:', response.content);
    return response;
  } catch (error) {
    console.error('Failed to chat with chapter:', error);
    throw error;
  }
};

// ==================== Complete Workflow Example ====================

/**
 * Example: Complete workflow from audio to study materials
 */
export const createStudyMaterialsFromAudio = async (
  audioUri: string,
  fileName: string,
  title: string
) => {
  try {
    // Step 1: Transcribe audio
    console.log('Step 1: Transcribing audio...');
    const { transcript } = await transcribeAudioFile(audioUri, fileName);

    // Step 2: Generate AI note
    console.log('Step 2: Generating AI note...');
    const note = await notesApi.generateAINote({ transcriptId: transcript.id });

    // Step 3: Generate flashcards
    console.log('Step 3: Generating flashcards...');
    const flashcards = await notesApi.generateFlashcards({ noteId: note.id });

    // Step 4: Generate quiz
    console.log('Step 4: Generating quiz...');
    const quiz = await notesApi.generateQuiz({ noteId: note.id });

    // Step 5: Generate podcast (optional)
    console.log('Step 5: Generating podcast...');
    const podcast = await generatePodcastFromNote(note.id);

    console.log('Study materials created successfully!');
    return {
      transcript,
      note,
      flashcards,
      quiz,
      podcast,
    };
  } catch (error) {
    console.error('Failed to create study materials:', error);
    throw error;
  }
};

// ==================== Error Handling Example ====================

/**
 * Example: Error handling with user feedback
 */
export const safeApiCall = async <T>(
  apiFunction: () => Promise<T>,
  errorMessage: string = 'An error occurred'
): Promise<T | null> => {
  try {
    return await apiFunction();
  } catch (error: any) {
    console.error(errorMessage, error);
    
    // Handle specific error types
    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      // Token expired - redirect to login
      console.log('Session expired, please login again');
    } else if (error.message?.includes('403')) {
      // Insufficient permissions - show upgrade prompt
      console.log('This feature requires a subscription');
    } else if (error.message?.includes('Network')) {
      // Network error
      console.log('Network error, please check your connection');
    } else {
      // Generic error
      console.log(errorMessage);
    }
    
    return null;
  }
};

// Usage:
// const notes = await safeApiCall(() => notesApi.getNotes(), 'Failed to load notes');
