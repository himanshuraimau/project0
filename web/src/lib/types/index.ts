/**
 * Barrel exports for centralized types system
 * Re-exports commonly used types for easy importing across the application
 */

// Common types - foundational types used across domains
export type {
  LoadingState,
  BaseEntity,
  UserContext,
  PaginationParams,
  SortParams,
  FilterParams,
  QueryParams,
  EntityStatus,
  TimestampedEntity,
  UserOwnedEntity,
  NamedEntity
} from './common.types';

// API types - standardized request/response patterns
export type {
  ApiResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
  PaginatedResponse,
  ApiError,
  ValidationError,
  BaseApiRequest,
  PaginatedRequest,
  SearchRequest,
  HttpMethod,
  ApiEndpoint,
  RequestOptions,
  FileUploadRequest,
  FileUploadResponse
} from './api.types';

// Database types - Prisma-aligned model interfaces
export type {
  TranscriptModel,
  NoteModel,
  FlashcardModel,
  QuizModel,
  NoteChunkModel,
  TranscriptWithNotes as DatabaseTranscriptWithNotes,
  NoteWithTranscript as DatabaseNoteWithTranscript,
  NoteWithFlashcard as DatabaseNoteWithFlashcard,
  NoteWithQuiz as DatabaseNoteWithQuiz,
  NoteWithChunks,
  NoteWithRelations as DatabaseNoteWithRelations,
  FlashcardWithNote as DatabaseFlashcardWithNote,
  QuizWithNote as DatabaseQuizWithNote,
  CreateTranscriptData,
  UpdateTranscriptData,
  CreateNoteData,
  UpdateNoteData,
  CreateFlashcardData,
  UpdateFlashcardData,
  CreateQuizData,
  UpdateQuizData,
  CreateNoteChunkData
} from './database.types';

// Notes types - note-related interfaces and types
export type {
  Note,
  NoteData,
  CreateNoteRequest,
  UpdateNoteRequest,
  NoteType,
  GenerateNoteRequest,
  GenerateNotesFromTextRequest,
  ProcessPDFOptions,
  ProcessPDFResult,
  NoteResponse,
  NotesResponse,
  ProcessPDFResponse,
  UseNotesReturn,
  NoteServiceOptions,
  GeneratedNoteResult,
  NotesFromContentResult,
  NoteFilters,
  NotesQuery,
  NoteWithTranscript as NotesNoteWithTranscript,
  NoteWithFlashcard as NotesNoteWithFlashcard,
  NoteWithQuiz as NotesNoteWithQuiz,
  NoteWithRelations as NotesNoteWithRelations,
  NoteTranslation,
  LanguageCode,
  TranslateNoteRequest,
  TranslationResponse
} from './notes.types';

export { SUPPORTED_LANGUAGES } from './notes.types';

// Documents types - document and transcript types
export type {
  Document,
  DocumentWithContent,
  Transcript,
  TranscriptWithNotes as DocumentsTranscriptWithNotes,
  DocumentData,
  CreateDocumentRequest,
  UpdateDocumentRequest,
  YouTubeTranscriptResponse,
  YouTubeProcessRequest,
  YouTubeProcessResult,
  FileUploadOptions,
  FileProcessingResult,
  DocumentResponse,
  DocumentsResponse,
  DocumentWithContentResponse,
  TranscriptsResponse,
  FileProcessingResponse,
  UseDocumentsReturn,
  DocumentServiceOptions,
  DocumentFilters,
  DocumentsQuery,
  PDFParseOptions,
  PDFParseResult,
  AudioTranscriptionOptions,
  AudioTranscriptionResult,
  DocumentMetadata,
  ProcessingStatus,
  ProcessingJob
} from './documents.types';

// Quiz types - quiz and assessment types
export type {
  QuestionType,
  QuizQuestion,
  QuizData,
  Quiz,
  CreateQuizRequest,
  UpdateQuizRequest,
  GenerateQuizRequest,
  QuizAnswer,
  QuizSession,
  QuizResult,
  QuizStats,
  QuizResponse,
  QuizQuestionsResponse,
  QuizResultResponse,
  QuizStatsResponse,
  UseQuizReturn,
  QuizServiceOptions,
  GeneratedQuizResult,
  QuizConfig,
  QuestionGenerationOptions,
  MultipleChoiceOptions,
  TrueFalseOptions,
  QuizTemplate,
  QuizWithNote as QuizQuizWithNote,
  QuizWithSessions,
  QuizFilters,
  QuizQuery
} from './quiz.types';

// Flashcards types - flashcard-related interfaces
export type {
  FlashcardItem,
  Flashcard,
  CreateFlashcardRequest,
  UpdateFlashcardRequest,
  GenerateFlashcardRequest,
  StudySession,
  CardReview,
  StudyProgress,
  SpacedRepetitionConfig,
  ReviewSchedule,
  FlashcardStats,
  CardStats,
  FlashcardResponse,
  FlashcardItemsResponse,
  StudySessionResponse,
  FlashcardStatsResponse,
  UseFlashcardsReturn,
  FlashcardServiceOptions,
  GeneratedFlashcardResult,
  StudyMode,
  StudyModeConfig,
  FlashcardDeck,
  DeckStats,
  FlashcardWithNote as FlashcardsFlashcardWithNote,
  FlashcardWithProgress,
  FlashcardFilters,
  FlashcardQuery,
  FlashcardExport,
  FlashcardImport
} from './flashcards.types';

// Search types - semantic search functionality types
export type {
  SearchChunk,
  SearchResult,
  SearchNote,
  UseSemanticSearchOptions,
  SemanticSearchRequest,
  SemanticSearchResponse,
  UseSemanticSearchReturn,
  DatabaseChunk,
  GeneralSearchRequest,
  SearchError
} from './search.types';

// Podcast types - podcast generation and management types
export type {
  Podcast,
  PodcastMode,
  PodcastStatus,
  QualityPreset,
  DurationScale,
  PodcastGenerationOptions,
  VoiceSettings,
  PodcastGenerationForm,
  PodcastGenerationResponse,
  ElevenLabsWebhookPayload,
  GenerationStartedPayload,
  GenerationCompletedPayload,
  GenerationFailedPayload,
  AudioPlayerState,
  TranscriptSyncState,
  TranscriptSyncData,
  TimestampData,
  TextChunk,
  AudioMetadata,
  ErrorResponse
} from './podcast';






// Course types - course creation and management types
export type {
  Unit,
  Chapter,
  UnitWithChapters,
  CourseStructure,
  WizardStep,
  WizardState,
  CourseCreationWizardProps,
  TitleInputStepProps,
  UnitsGenerationStepProps,
  ChaptersReviewStepProps,
  CourseCreationState,
  GenerateUnitsRequest,
  GenerateUnitsResponse,
  GenerateChaptersRequest,
  GenerateChaptersResponse,
  CreateCourseRequest,
  CreateCourseResponse
} from './course.types';

// UI types - UI component and interaction types
export type {
  BaseComponentProps,
  LoadingState as UILoadingState,
  ButtonVariant,
  ButtonSize,
  ComponentSize,
  Theme,
  ModalProps,
  FormFieldProps,
  InputProps,
  TextareaProps,
  SidebarProps,
  NavigationItem,
  NavbarProps,
  DashboardLayoutProps,
  ChatbotProps,
  InlineChatbotProps,
  ChatWithNoteButtonProps,
  AudioRecorderProps,
  RecordAudioProps,
  PDFProcessorProps,
  SimplePDFProcessorProps,
  YouTubeProcessorProps,
  NotesViewerProps,
  QuizViewerProps,
  FlashcardViewerProps,
  MDXRendererProps,
  UserControlProps,
  ThemeProviderProps,
  ProgressProps,
  BadgeProps,
  CardProps,
  AccordionProps,
  AvatarProps,
  DropdownMenuProps,
  DropdownMenuItem,
  ErrorMessageProps,
  ProcessPDFResult as UIProcessPDFResult,

  NotificationType,
  Notification,
  ToastProps
} from './ui.types';