/**
 * Note-related types and interfaces
 * All types related to note creation, management, and processing
 */

import { BaseEntity } from './common.types';
import { ApiResponse } from './api.types';

// Core note types
export interface Note extends BaseEntity {
  title: string;
  content: string | null;
  transcriptId: string;
  userId: string | null;
  folderId?: string | null;
  transcript?: {
    id: string;
    originalName: string;
    createdAt: string;
  };
  translations?: NoteTranslation[];
}

// Note translation types
export interface NoteTranslation {
  id: string;
  noteId: string;
  language: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export const SUPPORTED_LANGUAGES = {
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  zh: 'Chinese (Simplified)',
  hi: 'Hindi'
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

export interface TranslateNoteRequest {
  language: LanguageCode;
}

export interface TranslationResponse {
  id: string;
  noteId: string;
  language: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// Note creation and update types
export interface NoteData {
  title: string;
  content: string;
  transcriptId: string;
  userId?: string;
  folderId?: string;
}

export interface CreateNoteRequest {
  title: string;
  content: string;
  transcriptId: string;
  folderId?: string;
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  folderId?: string;
}

// Note generation types
export type NoteType = 'summary' | 'detailed' | 'action-items' | 'technical' | 'executive';

export interface GenerateNoteRequest {
  transcriptId?: string;
  noteType?: NoteType;
  folderId?: string;
  progressJobId?: string;
}

export interface GenerateNotesFromTextRequest {
  text: string;
  title?: string;
  folderId?: string;
  progressJobId?: string;
}

// PDF processing and note generation
export interface ProcessPDFOptions {
  extractImages?: boolean;
  maxPages?: number;
  generateNotes?: boolean;
  folderId?: string | null;
  progressJobId?: string;
}

export interface ProcessPDFResult {
  transcript: {
    id: string;
    text: string;
    cleanText: string;
    pages: number;
    metadata?: Record<string, unknown>;
    imageCount: number;
    extractedFiles?: Record<string, unknown>;
  };
  note?: Note | { 
    error: string; 
    message: string;
    redirectUrl?: string;
  };
  redirectUrl?: string;
}

// API response types
export type NoteResponse = ApiResponse<Note>;
export type NotesResponse = ApiResponse<Note[]>;
export type ProcessPDFResponse = ApiResponse<ProcessPDFResult>;

// Hook return types
export interface UseNotesReturn {
  loading: boolean;
  error: string | null;
  processPDFWithNotes: (file: File, options?: ProcessPDFOptions) => Promise<ProcessPDFResult | null>;
  generateNotesFromTranscript: (transcriptId: string) => Promise<Note | null>;
  generateFocusedNotes: (transcriptId: string, noteType?: NoteType) => Promise<Note | null>;
  generateNotesFromText: (text: string, title?: string, folderId?: string | null, progressJobId?: string) => Promise<ProcessPDFResult | null>;
  getNotes: (transcriptId?: string) => Promise<Note[] | null>;
  getNote: (id: string) => Promise<Note | null>;
  createNote: (noteData: CreateNoteRequest) => Promise<Note | null>;
  updateNote: (id: string, updates: UpdateNoteRequest) => Promise<Note | null>;
  deleteNote: (id: string) => Promise<boolean>;
}

// Service types
export interface NoteServiceOptions {
  userId?: string;
}

export interface GeneratedNoteResult {
  id: string;
  title: string;
  content: string;
}

export interface NotesFromContentResult {
  title: string;
  content: string;
}

// Search and filtering
export interface NoteFilters {
  transcriptId?: string;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
}

export interface NotesQuery extends NoteFilters {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

// Extended note types with relations
export interface NoteWithTranscript extends Note {
  folderId?: string | null;
  transcript: {
    id: string;
    originalName: string;
    fileName: string;
    createdAt: string;
    type: string;
  };
}

export interface NoteWithFlashcard extends Note {
  flashcard: {
    id: string;
    content: Record<string, unknown>;
    createdAt: Date;
  } | null;
}

export interface NoteWithQuiz extends Note {
  quiz: {
    id: string;
    content: Record<string, unknown>;
    createdAt: Date;
  } | null;
}

export interface NoteWithRelations extends Note {
  transcript: {
    id: string;
    originalName: string;
    fileName: string;
    createdAt: string;
    type: string;
  };
  flashcard: {
    id: string;
    content: Record<string, unknown>;
    createdAt: Date;
  } | null;
  quiz: {
    id: string;
    content: Record<string, unknown>;
    createdAt: Date;
  } | null;
}
