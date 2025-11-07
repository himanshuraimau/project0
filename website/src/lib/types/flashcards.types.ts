/**
 * Flashcard-related types and interfaces
 * All types related to flashcard creation, study sessions, and spaced repetition
 */

import { BaseEntity } from './common.types';
import { ApiResponse } from './api.types';

// Core flashcard types
export interface FlashcardItem {
  id: number;
  question: string;
  answer: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
}

export interface Flashcard extends BaseEntity {
  noteId: string;
  content: FlashcardItem[];
  userId: string | null;
  note?: {
    id: string;
    title: string;
    createdAt: Date;
  };
}

// Flashcard creation and update types
export interface CreateFlashcardRequest {
  noteId: string;
}

export interface UpdateFlashcardRequest {
  content?: FlashcardItem[];
}

export interface GenerateFlashcardRequest {
  noteId: string;
  cardCount?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  includeDefinitions?: boolean;
  includeExamples?: boolean;
}

// Study session types
export interface StudySession {
  id: string;
  flashcardId: string;
  userId: string;
  startedAt: Date;
  completedAt?: Date;
  totalCards: number;
  studiedCards: number;
  correctAnswers: number;
  incorrectAnswers: number;
  averageResponseTime: number;
}

export interface CardReview {
  cardId: number;
  response: 'again' | 'hard' | 'good' | 'easy';
  responseTime: number; // in milliseconds
  timestamp: Date;
}

export interface StudyProgress {
  cardId: number;
  easeFactor: number;
  interval: number; // days until next review
  repetitions: number;
  nextReviewDate: Date;
  lastReviewDate?: Date;
  totalReviews: number;
  correctStreak: number;
  difficulty: 'new' | 'learning' | 'review' | 'relearning';
}

// Spaced repetition algorithm types
export interface SpacedRepetitionConfig {
  algorithm: 'sm2' | 'anki' | 'fsrs';
  initialInterval: number; // days
  easyBonus: number;
  hardInterval: number;
  newInterval: number;
  graduatingInterval: number;
  easyInterval: number;
  maximumInterval: number;
}

export interface ReviewSchedule {
  cardId: number;
  nextReviewDate: Date;
  interval: number;
  easeFactor: number;
  repetitions: number;
}

// Study statistics and analytics
export interface FlashcardStats {
  totalCards: number;
  newCards: number;
  learningCards: number;
  reviewCards: number;
  masteredCards: number;
  totalStudySessions: number;
  totalStudyTime: number; // in minutes
  averageAccuracy: number;
  streakDays: number;
  cardsStudiedToday: number;
  cardsScheduledToday: number;
}

export interface CardStats {
  cardId: number;
  question: string;
  answer: string;
  totalReviews: number;
  correctReviews: number;
  accuracy: number;
  averageResponseTime: number;
  easeFactor: number;
  interval: number;
  nextReviewDate: Date;
  difficulty: string;
  tags: string[];
}

// API response types
export type FlashcardResponse = ApiResponse<Flashcard>;
export type FlashcardItemsResponse = ApiResponse<FlashcardItem[]>;
export type StudySessionResponse = ApiResponse<StudySession>;
export type FlashcardStatsResponse = ApiResponse<FlashcardStats>;

// Hook return types
export interface UseFlashcardsReturn {
  flashcards: FlashcardItem[];
  loading: boolean;
  error: string | null;
  generateFlashcards: (noteId: string) => Promise<FlashcardItem[]>;
  getFlashcards: (noteId: string) => Promise<FlashcardItem[]>;
  deleteFlashcards: (noteId: string) => Promise<void>;
  setFlashcards: (flashcards: FlashcardItem[]) => void;
}

// Service types
export interface FlashcardServiceOptions {
  userId?: string;
  cardCount?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface GeneratedFlashcardResult {
  id: string;
  content: FlashcardItem[];
  noteId: string;
}

// Study mode types
export type StudyMode = 'review' | 'learn' | 'cram' | 'test';

export interface StudyModeConfig {
  mode: StudyMode;
  cardLimit?: number;
  timeLimit?: number; // in minutes
  shuffleCards?: boolean;
  showAnswerFirst?: boolean;
  autoAdvance?: boolean;
  autoAdvanceDelay?: number; // in seconds
}

// Deck and collection types
export interface FlashcardDeck {
  id: string;
  name: string;
  description?: string;
  flashcardIds: string[];
  userId: string;
  isPublic: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DeckStats {
  deckId: string;
  totalCards: number;
  newCards: number;
  learningCards: number;
  reviewCards: number;
  averageEaseFactor: number;
  estimatedStudyTime: number; // in minutes
}

// Extended flashcard types with relations
export interface FlashcardWithNote extends Flashcard {
  note: {
    id: string;
    title: string;
    content: string;
    createdAt: Date;
    transcript: {
      id: string;
      originalName: string;
    };
  };
}

export interface FlashcardWithProgress extends Flashcard {
  progress: StudyProgress[];
  stats: FlashcardStats;
  nextReviewCards: FlashcardItem[];
}

// Filtering and search types
export interface FlashcardFilters {
  noteId?: string;
  userId?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  studyStatus?: 'new' | 'learning' | 'review' | 'mastered';
}

export interface FlashcardQuery extends FlashcardFilters {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'difficulty' | 'nextReview';
  sortOrder?: 'asc' | 'desc';
}

// Import/Export types
export interface FlashcardExport {
  version: string;
  exportDate: Date;
  flashcards: Array<{
    question: string;
    answer: string;
    tags: string[];
    difficulty: string;
    stats?: {
      totalReviews: number;
      accuracy: number;
      easeFactor: number;
    };
  }>;
}

export interface FlashcardImport {
  source: 'anki' | 'quizlet' | 'csv' | 'json';
  data: FlashcardExport | string;
  options?: {
    mergeDuplicates?: boolean;
    preserveStats?: boolean;
    defaultDifficulty?: 'easy' | 'medium' | 'hard';
  };
}