/**
 * Database model types aligned with Prisma schema
 * These types represent the exact structure of database entities
 */

// Base Prisma model types - exact representations of database entities

export interface TranscriptModel {
  id: string;
  fileName: string;
  originalName: string;
  content: string;
  cleanContent: string;
  pages: number | null;
  metadata: Record<string, unknown> | null;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
  type: string;
}

export interface NoteModel {
  id: string;
  title: string;
  content: string;
  transcriptId: string;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FlashcardModel {
  id: string;
  noteId: string;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
  content: Record<string, unknown>;
}

export interface QuizModel {
  id: string;
  noteId: string;
  content: Record<string, unknown>;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteChunkModel {
  id: number;
  note_id: string;
  chunk_text: string;
  embedding: unknown; // Vector type from PostgreSQL
}

export interface UsageModel {
  key: string;
  points: number;
  expire: Date | null;
}

// Extended types with relations - commonly used combinations

export interface TranscriptWithNotes extends TranscriptModel {
  notes: NoteModel[];
}

export interface NoteWithTranscript extends NoteModel {
  transcript: Pick<TranscriptModel, 'id' | 'originalName' | 'fileName' | 'createdAt' | 'type'>;
}

export interface NoteWithFlashcard extends NoteModel {
  flashcard: FlashcardModel | null;
}

export interface NoteWithQuiz extends NoteModel {
  quiz: QuizModel | null;
}

export interface NoteWithChunks extends NoteModel {
  chunks: NoteChunkModel[];
}

export interface NoteWithRelations extends NoteModel {
  transcript: Pick<TranscriptModel, 'id' | 'originalName' | 'fileName' | 'createdAt' | 'type'>;
  flashcard: FlashcardModel | null;
  quiz: QuizModel | null;
  chunks: NoteChunkModel[];
}

export interface FlashcardWithNote extends FlashcardModel {
  note: Pick<NoteModel, 'id' | 'title' | 'createdAt'>;
}

export interface QuizWithNote extends QuizModel {
  note: Pick<NoteModel, 'id' | 'title' | 'createdAt'>;
}

// Input types for database operations

export interface CreateTranscriptData {
  fileName: string;
  originalName: string;
  content: string;
  cleanContent: string;
  pages?: number | null;
  metadata?: Record<string, unknown> | null;
  userId?: string | null;
  type?: string;
}

export interface UpdateTranscriptData {
  fileName?: string;
  originalName?: string;
  content?: string;
  cleanContent?: string;
  pages?: number | null;
  metadata?: Record<string, unknown> | null;
  userId?: string | null;
  type?: string;
}

export interface CreateNoteData {
  title: string;
  content: string;
  transcriptId: string;
  userId?: string | null;
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
  transcriptId?: string;
  userId?: string | null;
}

export interface CreateFlashcardData {
  noteId: string;
  userId?: string | null;
  content: Record<string, unknown>;
}

export interface UpdateFlashcardData {
  content?: Record<string, unknown>;
  userId?: string | null;
}

export interface CreateQuizData {
  noteId: string;
  content: Record<string, unknown>;
  userId?: string | null;
}

export interface UpdateQuizData {
  content?: Record<string, unknown>;
  userId?: string | null;
}

export interface CreateNoteChunkData {
  note_id: string;
  chunk_text: string;
  embedding: unknown;
}

export interface CreateUsageData {
  key: string;
  points: number;
  expire?: Date | null;
}

export interface UpdateUsageData {
  points?: number;
  expire?: Date | null;
}