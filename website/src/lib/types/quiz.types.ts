/**
 * Quiz and assessment-related types and interfaces
 * All types related to quiz creation, questions, and assessment functionality
 */

import { BaseEntity } from './common.types';
import { ApiResponse } from './api.types';

// Core quiz types
export type QuestionType = 'multiple_choice' | 'true_false';

export interface QuizQuestion {
  id: number;
  type: QuestionType;
  question: string;
  options?: string[];
  correct_answer: string | boolean;
  correctAnswer?: string; // Alternative naming for compatibility
  explanation: string;
}

export interface QuizData {
  quiz: QuizQuestion[];
}

export interface Quiz extends BaseEntity {
  noteId: string;
  content: QuizData;
  userId: string | null;
  note?: {
    id: string;
    title: string;
    createdAt: Date;
  };
}

// Quiz creation and update types
export interface CreateQuizRequest {
  noteId: string;
}

export interface UpdateQuizRequest {
  content?: QuizData;
}

export interface GenerateQuizRequest {
  noteId: string;
  questionCount?: number;
  questionTypes?: QuestionType[];
  difficulty?: 'easy' | 'medium' | 'hard';
}

// Quiz session and scoring types
export interface QuizAnswer {
  questionId: number;
  answer: string | boolean;
  isCorrect?: boolean;
  timeSpent?: number;
}

export interface QuizSession {
  id: string;
  quizId: string;
  userId: string;
  answers: QuizAnswer[];
  score?: number;
  totalQuestions?: number;
  startedAt: Date;
  completedAt?: Date;
  timeSpent?: number;
}

export interface QuizResult {
  sessionId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  percentage: number;
  timeSpent: number;
  answers: Array<{
    questionId: number;
    question: string;
    userAnswer: string | boolean;
    correctAnswer: string | boolean;
    isCorrect: boolean;
    explanation: string;
  }>;
}

// Quiz statistics and analytics
export interface QuizStats {
  totalQuizzes: number;
  totalAttempts: number;
  averageScore: number;
  bestScore: number;
  worstScore: number;
  averageTimeSpent: number;
  completionRate: number;
  questionStats: Array<{
    questionId: number;
    question: string;
    correctRate: number;
    averageTimeSpent: number;
    totalAttempts: number;
  }>;
}

// API response types
export type QuizResponse = ApiResponse<Quiz>;
export type QuizQuestionsResponse = ApiResponse<QuizQuestion[]>;
export type QuizResultResponse = ApiResponse<QuizResult>;
export type QuizStatsResponse = ApiResponse<QuizStats>;

// Hook return types
export interface UseQuizReturn {
  quiz: QuizQuestion[];
  loading: boolean;
  error: string | null;
  generateQuiz: (noteId: string) => Promise<QuizQuestion[]>;
  getQuiz: (noteId: string) => Promise<QuizQuestion[]>;
  deleteQuiz: (noteId: string) => Promise<void>;
  setQuiz: (quiz: QuizQuestion[]) => void;
}

// Service types
export interface QuizServiceOptions {
  userId?: string;
  questionCount?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface GeneratedQuizResult {
  id: string;
  content: QuizData;
  noteId: string;
}

// Quiz configuration types
export interface QuizConfig {
  questionCount: number;
  questionTypes: QuestionType[];
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit?: number; // in minutes
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showExplanations?: boolean;
  allowRetake?: boolean;
  passingScore?: number; // percentage
}

// Question generation types
export interface QuestionGenerationOptions {
  type: QuestionType;
  difficulty: 'easy' | 'medium' | 'hard';
  topic?: string;
  context?: string;
}

export interface MultipleChoiceOptions {
  correctAnswer: string;
  incorrectOptions: string[];
  explanation: string;
}

export interface TrueFalseOptions {
  correctAnswer: boolean;
  explanation: string;
}

// Quiz templates and presets
export interface QuizTemplate {
  id: string;
  name: string;
  description: string;
  config: QuizConfig;
  questionTemplates: Array<{
    type: QuestionType;
    template: string;
    variables: string[];
  }>;
}

// Extended quiz types with relations
export interface QuizWithNote extends Quiz {
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

export interface QuizWithSessions extends Quiz {
  sessions: QuizSession[];
  stats: {
    totalAttempts: number;
    averageScore: number;
    bestScore: number;
  };
}

// Quiz filtering and search
export interface QuizFilters {
  noteId?: string;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minScore?: number;
  maxScore?: number;
}

export interface QuizQuery extends QuizFilters {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'score';
  sortOrder?: 'asc' | 'desc';
}