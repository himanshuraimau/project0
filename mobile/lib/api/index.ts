/**
 * API Module Index
 * 
 * Centralized exports for all API modules in the mobile app.
 * This provides a clean interface for importing API functions throughout the application.
 * 
 * Usage:
 * import { notesApi, transcriptsApi, audioApi } from '@/lib/api';
 * 
 * Or import specific functions:
 * import { getNotes, createNote } from '@/lib/api/notes';
 */

// Export API client and utilities
export { default as apiClient, handleApiResponse, handleApiError } from './client';

// Export all types
export * from './types';

// Export API modules
export { default as audioApi } from './audio';
export { default as chapterApi } from './chapter';
export { default as courseApi } from './course';
export { default as documentsApi } from './documents';
export { default as mindmapApi } from './mindmap';
export { default as notesApi } from './notes';
export { default as pdfApi } from './pdf';
export { default as podcastApi } from './podcast';
export { default as searchApi } from './search';
export { default as subscriptionApi } from './subscription';
export { default as transcriptsApi } from './transcripts';
export { default as userApi } from './user';
export { default as webpageApi } from './webpage';

// Named exports for convenience
export * as audio from './audio';
export * as chapter from './chapter';
export * as course from './course';
export * as documents from './documents';
export * as mindmap from './mindmap';
export * as notes from './notes';
export * as pdf from './pdf';
export * as podcast from './podcast';
export * as search from './search';
export * as subscription from './subscription';
export * as transcripts from './transcripts';
export * as user from './user';
export * as webpage from './webpage';
