/**
 * Course creation types for the AI-generated course flow
 * These types support the multi-step wizard interface
 */

// Base interfaces for course creation
export interface Unit {
  id: string;
  name: string;
  isEditing?: boolean;
}

export interface Chapter {
  id: string;
  name: string;
  youtubeSearchQuery: string;
  isEditing?: boolean;
}

export interface UnitWithChapters extends Unit {
  chapters: Chapter[];
}

// Course creation data structure
export interface CourseStructure {
  title: string;
  userId: string;
  units: UnitWithChapters[];
}

// Wizard step types
export type WizardStep = 'title' | 'units' | 'chapters';

// Wizard state interface
export interface WizardState {
  step: WizardStep;
  courseTitle: string;
  units: Unit[];
  chapters: UnitWithChapters[];
  isLoading: boolean;
}

// Component prop interfaces
export interface CourseCreationWizardProps {
  onComplete: (courseId: string) => void;
}

export interface TitleInputStepProps {
  title: string;
  onTitleChange: (title: string) => void;
  onGenerateUnits: () => void;
  isLoading: boolean;
}

export interface UnitsGenerationStepProps {
  units: Unit[];
  onUnitsChange: (units: Unit[]) => void;
  onFinalize: () => void;
  isLoading: boolean;
}

export interface ChaptersReviewStepProps {
  courseTitle: string;
  units: UnitWithChapters[];
  onSave: () => void;
  onEdit: (unitId: string, chapterId: string, newName: string) => void;
  onDeleteChapter: (unitId: string, chapterId: string) => void;
  isLoading: boolean;
}

export interface BatchProgressStepProps {
  courseTitle: string;
  units: Unit[];
  batchState: {
    isProcessing: boolean;
    currentBatchIndex: number;
    totalBatches: number;
    completedUnits: string[];
    processingUnits: string[];
    batchSize: number;
    processingProgress: number;
  };
  errorState: {
    hasError: boolean;
    error: any;
  };
  onProcessNextBatch: () => Promise<void>;
  onRetry: () => void;
  onComplete: () => void;
}

// Store state interface
export interface CourseCreationState {
  // Wizard state
  currentStep: WizardStep;
  courseTitle: string;
  units: Unit[];
  chapters: UnitWithChapters[];
  
  // Loading states
  isGeneratingUnits: boolean;
  isGeneratingChapters: boolean;
  isSaving: boolean;
  
  // Actions
  setStep: (step: WizardStep) => void;
  setCourseTitle: (title: string) => void;
  setUnits: (units: Unit[]) => void;
  setChapters: (chapters: UnitWithChapters[]) => void;
  updateChapterName: (unitId: string, chapterId: string, newName: string) => void;
  deleteChapter: (unitId: string, chapterId: string) => void;
  
  // Loading state setters
  setGeneratingUnits: (loading: boolean) => void;
  setGeneratingChapters: (loading: boolean) => void;
  setSaving: (loading: boolean) => void;
  
  // Async actions
  generateUnits: () => Promise<void>;
  generateChapters: () => Promise<void>;
  saveCourse: () => Promise<string>;
  
  // Reset
  reset: () => void;
}

// API request/response types
export interface GenerateUnitsRequest {
  title: string;
}

export interface GenerateUnitsResponse {
  units: Unit[];
}

export interface GenerateChaptersRequest {
  title: string;
  units: Unit[];
}

export interface GenerateChaptersResponse {
  unitsWithChapters: UnitWithChapters[];
}

export interface CreateCourseRequest {
  title: string;
  units: UnitWithChapters[];
}

export interface CreateCourseResponse {
  courseId: string;
}