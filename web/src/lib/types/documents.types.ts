/**
 * Document and transcript-related types and interfaces
 * All types related to document processing, transcripts, and file management
 */

import { BaseEntity } from './common.types';
import { ApiResponse } from './api.types';

// Core document types
export interface Document extends BaseEntity {
  fileName: string;
  originalName: string;
  pages: number | null;
  userId: string | null;
}

export interface DocumentWithContent extends Document {
  content: string;
  cleanContent: string;
  metadata: Record<string, unknown> | null;
}

// Transcript types (documents are stored as transcripts in the database)
export interface Transcript extends BaseEntity {
  fileName: string;
  originalName: string;
  content: string;
  cleanContent: string;
  pages: number | null;
  metadata: Record<string, unknown> | null;
  userId: string | null;
  type: string;
}

export interface TranscriptWithNotes extends Transcript {
  notes: Array<{
    id: string;
    title: string;
    createdAt: Date;
  }>;
}

// Document creation and update types
export interface DocumentData {
  fileName: string;
  originalName: string;
  content: string;
  cleanContent: string;
  pages: number;
  metadata?: Record<string, unknown>;
  userId?: string;
}

export interface TranscriptData extends DocumentData {
  type?: string;
}

export interface CreateDocumentRequest {
  fileName: string;
  originalName: string;
  content: string;
  cleanContent: string;
  pages: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateDocumentRequest {
  fileName?: string;
  originalName?: string;
  content?: string;
  cleanContent?: string;
  pages?: number;
  metadata?: Record<string, unknown>;
}

// YouTube transcript types
export interface YouTubeTranscriptResponse {
  videoId: string;
  transcript_only_text: string;
  title?: string;
  duration?: number;
  [key: string]: unknown;
}

export interface YouTubeProcessRequest {
  url: string;
  generateNotes?: boolean;
  progressJobId?: string;
}

export interface YouTubeProcessResult {
  transcript: Transcript;
  note?: {
    id: string;
    title: string;
    content: string;
  };
}

// File upload types
export interface FileUploadOptions {
  extractImages?: boolean;
  maxPages?: number;
  generateNotes?: boolean;
}

export interface FileProcessingResult {
  transcript: {
    id: string;
    fileName: string;
    originalName: string;
    content: string;
    cleanContent: string;
    pages: number;
    metadata?: Record<string, unknown>;
  };
  extractedFiles?: Array<{
    name: string;
    type: string;
    size: number;
    url: string;
  }>;
  imageCount?: number;
}

// API response types
export type DocumentResponse = ApiResponse<Document>;
export type DocumentsResponse = ApiResponse<Document[]>;
export type DocumentWithContentResponse = ApiResponse<DocumentWithContent>;
export type TranscriptResponse = ApiResponse<Transcript>;
export type TranscriptsResponse = ApiResponse<Transcript[]>;
export type FileProcessingResponse = ApiResponse<FileProcessingResult>;

// Hook return types
export interface UseDocumentsReturn {
  documents: Document[];
  loading: boolean;
  error: string | null;
  fetchDocuments: () => Promise<void>;
  getDocument: (id: string) => Promise<DocumentWithContent | null>;
  deleteDocument: (id: string) => Promise<void>;
}

// Service types
export interface DocumentServiceOptions {
  userId?: string;
}

// Search and filtering
export interface DocumentFilters {
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
  fileType?: string;
  minPages?: number;
  maxPages?: number;
}

export interface DocumentsQuery extends DocumentFilters {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'originalName' | 'pages';
  sortOrder?: 'asc' | 'desc';
}

// PDF processing types
export interface PDFParseOptions {
  extractImages?: boolean;
  maxPages?: number;
  preserveFormatting?: boolean;
}

export interface PDFParseResult {
  text: string;
  cleanText: string;
  pages: number;
  metadata?: Record<string, unknown>;
  images?: string[];
  extractedFiles?: {
    textFile?: string;
    imagesDir?: string;
  };
  documentId?: string;
}

// Audio transcription types
export interface AudioTranscriptionOptions {
  language?: string;
  model?: string;
  temperature?: number;
}

export interface AudioTranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
  confidence?: number;
}

// Document metadata types
export interface DocumentMetadata {
  author?: string;
  title?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  keywords?: string[];
  pageCount?: number;
  fileSize?: number;
  mimeType?: string;
  language?: string;
}

// Processing status types
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ProcessingJob {
  id: string;
  status: ProcessingStatus;
  progress?: number;
  error?: string;
  result?: FileProcessingResult;
  createdAt: Date;
  updatedAt: Date;
}
