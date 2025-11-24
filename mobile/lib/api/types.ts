// ==================== Enums ====================
export enum SubscriptionStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

export enum PodcastMode {
  CONVERSATION = 'CONVERSATION',
  BULLETIN = 'BULLETIN',
}

export enum PodcastStatus {
  GENERATING = 'GENERATING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  SUPERSEDED = 'SUPERSEDED',
}

export enum QualityPreset {
  STANDARD = 'STANDARD',
  HIGH = 'HIGH',
  HIGHEST = 'HIGHEST',
  ULTRA = 'ULTRA',
  ULTRA_LOSSLESS = 'ULTRA_LOSSLESS',
}

export enum DurationScale {
  SHORT = 'SHORT',
  DEFAULT = 'DEFAULT',
  LONG = 'LONG',
}

export type NoteType = 'summary' | 'detailed' | 'action-items';

// ==================== Base Models ====================
export interface User {
  id: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  dodoSubscriptionId: string;
  productId: string;
  status: SubscriptionStatus;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  nextBillingDate?: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string;
  trialEnd?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Transcript {
  id: string;
  fileName: string;
  originalName: string;
  content: string;
  cleanContent: string;
  pages?: number;
  metadata?: any;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  type: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  transcriptId: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  translations?: NoteTranslation[]; // Optional array of translations
}

export interface NoteTranslation {
  id: string;
  noteId: string;
  language: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Flashcard {
  id: string;
  noteId: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  content: any;
}

export interface Quiz {
  id: string;
  noteId: string;
  content: any;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MindMap {
  id: string;
  title: string;
  mermaidCode: string;
  noteId: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Podcast {
  id: string;
  noteId: string;
  userId?: string;
  elevenLabsProjectId?: string;
  mode: PodcastMode;
  hostVoiceId: string;
  guestVoiceId?: string;
  qualityPreset: QualityPreset;
  durationScale: DurationScale;
  language?: string;
  intro?: string;
  outro?: string;
  status: PodcastStatus;
  progress?: number;
  errorMessage?: string;
  audioUrl?: string;
  audioFileKey?: string;
  duration?: number;
  fileSize?: number;
  title: string;
  description?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Course {
  id: string;
  name: string;
  image: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Unit {
  id: string;
  courseId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  unitId: string;
  name: string;
  youtubeSearchQuery: string;
  videoId?: string;
  notes?: string;
  transcript?: string;
  flashcards?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  chapterId: string;
  question: string;
  answer: string;
  options: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserCourseProgress {
  id: string;
  userId: string;
  courseId: string;
  completedChapters: number;
  totalChapters: number;
  completionPercentage: number;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserChapterProgress {
  id: string;
  userId: string;
  chapterId: string;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== API Response Types ====================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface NoteLimitError {
  error: string;
  message: string;
  notesUsed?: number;
  notesLimit?: number;
  upgradeUrl?: string;
}

// ==================== Notes API ====================
export interface CreateNoteRequest {
  title: string;
  content: string;
  transcriptId: string;
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
}

export interface GenerateNoteRequest {
  transcriptId: string;
}

export interface GenerateNoteFromTextRequest {
  text: string;
  title: string;
}

export interface GenerateNoteFromTextResponse {
  transcript: Transcript;
  note: Note;
}

export interface GenerateFocusedNoteRequest {
  transcriptId: string;
  noteType: NoteType;
}

export interface GenerateFlashcardsRequest {
  noteId: string;
}

export interface GenerateQuizRequest {
  noteId: string;
}

export interface TranslateNoteRequest {
  language: string;
}

// ==================== Transcripts API ====================
export interface CreateTranscriptRequest {
  fileName: string;
  originalName: string;
  content: string;
  cleanContent: string;
  pages?: number;
  metadata?: any;
  type?: string;
}

// ==================== Audio API ====================
export interface TranscribeAudioRequest {
  audioFile: File | Blob;
}

export interface TranscribeAudioResponse {
  transcription: string;
  transcript: Transcript;
  note?: Note; // Optional: backend may generate note automatically
}

// ==================== PDF API ====================
export interface ParsePDFRequest {
  file: File | Blob;
}

export interface ProcessPDFRequest {
  file: File | Blob;
}

export interface PDFAIRequest {
  pdfId: string;
  question: string;
}

export interface PDFFile {
  id: string;
  name: string;
  url: string;
  pages: number;
  createdAt: string;
}

// ==================== Podcast API ====================
export interface GeneratePodcastRequest {
  noteId: string;
  mode: PodcastMode;
  hostVoiceId: string;
  guestVoiceId?: string;
  qualityPreset?: QualityPreset;
  durationScale?: DurationScale;
  language?: string;
  intro?: string;
  outro?: string;
}

// ==================== Course API ====================
export interface CreateCourseRequest {
  name: string;
  units: string[];
}

export interface GenerateUnitsRequest {
  topic: string;
  numberOfUnits: number;
}

export interface GenerateChaptersRequest {
  unitName: string;
  numberOfChapters: number;
}

// ==================== Chapter API ====================
export interface ChapterInfoRequest {
  chapterId: string;
  question: string;
}

export interface CreateChapterProgressRequest {
  isCompleted: boolean;
}

export interface ChapterChatRequest {
  message: string;
}

export interface ChapterChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ==================== MindMap API ====================
export interface GenerateMindMapRequest {
  noteId: string;
}

export interface UpdateMindMapRequest {
  title?: string;
  mermaidCode?: string;
}

// ==================== User API ====================
export interface UserProfile {
  id: string;
  email?: string;
  name?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserProfileRequest {
  name?: string;
  email?: string;
}

export interface UserCredits {
  credits: number;
  userId: string;
}

export interface UserPurchase {
  id: string;
  userId: string;
  productId: string;
  amount: number;
  status: string;
  createdAt: string;
}

// ==================== Subscription API ====================
export interface CreateSubscriptionRequest {
  planId: string;
  customerEmail: string;
  customerName: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateSubscriptionResponse {
  checkoutUrl: string;
  sessionId: string;
}

export interface SubscriptionPortalResponse {
  portalUrl: string;
}

// ==================== Documents API ====================
export interface CreateDocumentRequest {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface UpdateDocumentRequest {
  name?: string;
}

// ==================== Webpage API ====================
export interface ProcessWebpageRequest {
  url: string;
}

export interface ProcessWebpageResponse {
  transcript: Transcript;
  content: string;
  note?: Note; // Optional: backend may generate note automatically
}

// ==================== Search API ====================
export interface SemanticSearchRequest {
  query: string;
  noteId?: string;
  limit?: number;
}

export interface SemanticSearchResult {
  id: string;
  text: string;
  score: number;
  noteId: string;
}
