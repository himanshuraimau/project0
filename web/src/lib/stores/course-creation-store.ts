import { create } from 'zustand';
import { CourseCreationState, Unit, UnitWithChapters, WizardStep } from '@/lib/types/course.types';
import { ErrorState, CourseCreationErrorInfo } from '@/lib/types/error.types';
import { classifyError, withRetry, DEFAULT_RETRY_CONFIG, fetchWithRetry } from '@/lib/utils/error-handler';
import {
  saveStateToStorage,
  recoverStateFromStorage,
  clearStoredState,
  hasRecoverableState,
  getRecoverableStateSummary,
  validateRecoveredState,
  RecoverableState
} from '@/lib/utils/state-recovery';

/**
 * Batch processing state for chapter generation
 */
interface BatchProcessingState {
  isProcessing: boolean;
  currentBatchIndex: number;
  totalBatches: number;
  completedUnits: string[];
  processingUnits: string[];
  batchSize: number;
  processingProgress: number; // 0-100
}

/**
 * Extended course creation state with error handling and state recovery
 */
interface ExtendedCourseCreationState extends CourseCreationState {
  // Error state
  errorState: ErrorState;

  // Recovery state
  hasRecoveryData: boolean;
  recoveryStateSummary: string | null;

  // Batch processing state
  batchState: BatchProcessingState;

  // Error actions
  setError: (error: CourseCreationErrorInfo | null) => void;
  clearError: () => void;
  retryLastOperation: () => Promise<void>;

  // Recovery actions
  checkForRecoveryData: () => void;
  restoreFromRecovery: () => boolean;
  discardRecoveryData: () => void;

  // Batch processing actions
  initializeBatchProcessing: () => void;
  processNextBatch: () => Promise<void>;
  resetBatchState: () => void;

  // Enhanced actions with error handling and state preservation
  generateUnitsWithRetry: () => Promise<void>;
  generateChaptersWithRetry: () => Promise<void>;
  generateChaptersBatchwise: () => Promise<void>;
  saveCourseWithRetry: () => Promise<string>;
}

/**
 * Zustand store for managing course creation wizard state
 * Handles step navigation, form data, loading states, and comprehensive error handling
 */
export const useCourseCreationStore = create<ExtendedCourseCreationState>((set, get) => ({
  // Initial state
  currentStep: 'title',
  courseTitle: '',
  units: [],
  chapters: [],

  // Loading states
  isGeneratingUnits: false,
  isGeneratingChapters: false,
  isSaving: false,

  // Error state
  errorState: {
    hasError: false,
    error: null,
    retryCount: 0,
    maxRetries: DEFAULT_RETRY_CONFIG.maxRetries
  },

  // Recovery state
  hasRecoveryData: false,
  recoveryStateSummary: null,

  // Batch processing state
  batchState: {
    isProcessing: false,
    currentBatchIndex: 0,
    totalBatches: 0,
    completedUnits: [],
    processingUnits: [],
    batchSize: 4,
    processingProgress: 0
  },

  // Basic setters with state preservation
  setStep: (step: WizardStep) => {
    set({ currentStep: step });
    const state = get();
    saveStateToStorage({
      currentStep: step,
      courseTitle: state.courseTitle,
      units: state.units,
      chapters: state.chapters
    });
  },

  setCourseTitle: (title: string) => {
    set({ courseTitle: title });
    const state = get();
    saveStateToStorage({
      courseTitle: title,
      currentStep: state.currentStep,
      units: state.units,
      chapters: state.chapters
    });
  },

  setUnits: (units: Unit[]) => {
    set({ units });
    const state = get();
    saveStateToStorage({
      units,
      courseTitle: state.courseTitle,
      currentStep: state.currentStep,
      chapters: state.chapters
    });
  },

  setChapters: (chapters: UnitWithChapters[]) => {
    set({ chapters });
    const state = get();
    saveStateToStorage({
      chapters,
      courseTitle: state.courseTitle,
      currentStep: state.currentStep,
      units: state.units
    });
  },

  // Update specific chapter or unit name
  updateChapterName: (unitId: string, chapterId: string, newName: string) => {
    const { chapters } = get();
    const updatedChapters = chapters.map(unit => {
      if (unit.id === unitId) {
        if (chapterId) {
          // Editing a chapter
          return {
            ...unit,
            chapters: unit.chapters.map(chapter =>
              chapter.id === chapterId
                ? { ...chapter, name: newName }
                : chapter
            )
          };
        } else {
          // Editing a unit
          return { ...unit, name: newName };
        }
      }
      return unit;
    });

    set({ chapters: updatedChapters });
  },

  // Delete specific chapter
  deleteChapter: (unitId: string, chapterId: string) => {
    const { chapters } = get();
    const updatedChapters = chapters.map(unit => {
      if (unit.id === unitId) {
        return {
          ...unit,
          chapters: unit.chapters.filter(chapter => chapter.id !== chapterId)
        };
      }
      return unit;
    });

    set({ chapters: updatedChapters });
  },

  // Loading state setters
  setGeneratingUnits: (loading: boolean) => set({ isGeneratingUnits: loading }),
  setGeneratingChapters: (loading: boolean) => set({ isGeneratingChapters: loading }),
  setSaving: (loading: boolean) => set({ isSaving: loading }),

  // Error actions
  setError: (error: CourseCreationErrorInfo | null) => {
    set({
      errorState: {
        hasError: error !== null,
        error,
        retryCount: error ? get().errorState.retryCount : 0,
        maxRetries: DEFAULT_RETRY_CONFIG.maxRetries
      }
    });
  },

  clearError: () => {
    set({
      errorState: {
        hasError: false,
        error: null,
        retryCount: 0,
        maxRetries: DEFAULT_RETRY_CONFIG.maxRetries
      }
    });
  },

  retryLastOperation: async () => {
    const { errorState, currentStep } = get();
    if (!errorState.error || !errorState.error.retryable) return;

    // Increment retry count
    set({
      errorState: {
        ...errorState,
        retryCount: errorState.retryCount + 1
      }
    });

    // Retry based on the current step and error type
    try {
      if (currentStep === 'title' || currentStep === 'units') {
        await get().generateUnitsWithRetry();
      } else if (currentStep === 'chapters') {
        await get().generateChaptersWithRetry();
      }
    } catch (error) {
      // Error will be handled by the individual methods
    }
  },

  // Recovery actions
  checkForRecoveryData: () => {
    const hasData = hasRecoverableState();
    const summary = hasData ? getRecoverableStateSummary() : null;

    set({
      hasRecoveryData: hasData,
      recoveryStateSummary: summary
    });
  },

  restoreFromRecovery: () => {
    const recoveredState = recoverStateFromStorage();
    if (!recoveredState) return false;

    const validation = validateRecoveredState(recoveredState);

    // Restore the state even if there are validation issues
    // User can fix them manually
    set({
      courseTitle: recoveredState.courseTitle,
      units: recoveredState.units,
      chapters: recoveredState.chapters,
      currentStep: recoveredState.currentStep as WizardStep,
      hasRecoveryData: false,
      recoveryStateSummary: null
    });

    return true;
  },

  discardRecoveryData: () => {
    clearStoredState();
    set({
      hasRecoveryData: false,
      recoveryStateSummary: null
    });
  },

  // Enhanced async actions with error handling
  generateUnitsWithRetry: async () => {
    const { courseTitle, setGeneratingUnits, setUnits, setStep, setError, clearError } = get();

    // Clear any previous errors
    clearError();

    if (!courseTitle.trim()) {
      const error = classifyError(new Error('Course title is required'));
      setError(error);
      throw error;
    }

    if (courseTitle.length < 2 || courseTitle.length > 100) {
      const error = classifyError(new Error('Course title must be between 2 and 100 characters'));
      setError(error);
      throw error;
    }

    try {
      setGeneratingUnits(true);

      const response = await withRetry(async () => {
        return await fetchWithRetry('/api/course/generate-units', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: courseTitle }),
        });
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setUnits(data.units);
      setStep('units');
      clearError(); // Clear error on success
    } catch (error) {
      console.error('Error generating units:', error);
      const errorInfo = classifyError(error);
      setError(errorInfo);
      throw errorInfo;
    } finally {
      setGeneratingUnits(false);
    }
  },

  // Legacy method for backward compatibility
  generateUnits: async () => {
    return get().generateUnitsWithRetry();
  },

  generateChaptersWithRetry: async () => {
    // Use the new batch processing approach for better UX
    return get().generateChaptersBatchwise();
  },

  // Legacy method for backward compatibility
  generateChapters: async () => {
    return get().generateChaptersWithRetry();
  },

  saveCourseWithRetry: async () => {
    const { courseTitle, chapters, setSaving, setError, clearError } = get();

    // Clear any previous errors
    clearError();

    if (!courseTitle.trim()) {
      const error = classifyError(new Error('Course title is required'));
      setError(error);
      throw error;
    }

    if (!chapters.length) {
      const error = classifyError(new Error('Course structure is required'));
      setError(error);
      throw error;
    }

    try {
      setSaving(true);

      const response = await withRetry(async () => {
        return await fetchWithRetry('/api/course/create-course', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: courseTitle, units: chapters }),
        });
      });

      const responseData = await response.json();

      if (responseData.error) {
        throw new Error(responseData.error);
      }

      // Handle the enhanced response wrapper
      const data = responseData.success ? responseData.data : responseData;

      clearError(); // Clear error on success
      clearStoredState(); // Clear recovery data on successful save
      return data.courseId;
    } catch (error) {
      console.error('Error saving course:', error);
      const errorInfo = classifyError(error);
      setError(errorInfo);
      throw errorInfo;
    } finally {
      setSaving(false);
    }
  },

  // Legacy method for backward compatibility
  saveCourse: async () => {
    return get().saveCourseWithRetry();
  },

  // Batch processing methods
  initializeBatchProcessing: () => {
    const { units } = get();
    const batchSize = 4; // Process 4 units at a time for optimal performance
    const totalBatches = Math.ceil(units.length / batchSize);
    
    set({
      batchState: {
        isProcessing: true,
        currentBatchIndex: 0,
        totalBatches,
        completedUnits: [],
        processingUnits: [],
        batchSize,
        processingProgress: 0
      }
    });
  },

  processNextBatch: async () => {
    const { courseTitle, units, batchState, setError, clearError } = get();
    
    if (!batchState.isProcessing || batchState.currentBatchIndex >= batchState.totalBatches) {
      return;
    }

    // Clear any previous errors
    clearError();

    const startIndex = batchState.currentBatchIndex * batchState.batchSize;
    const endIndex = Math.min(startIndex + batchState.batchSize, units.length);
    const currentBatchUnits = units.slice(startIndex, endIndex);
    const unitIds = currentBatchUnits.map(u => u.id);

    // Update processing units
    set({
      batchState: {
        ...batchState,
        processingUnits: unitIds
      }
    });

    try {
      // Call the API to generate chapters for this batch
      const response = await withRetry(async () => {
        return await fetchWithRetry('/api/course/generate-chapters-batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            title: courseTitle, 
            units: currentBatchUnits,
            batchIndex: batchState.currentBatchIndex 
          }),
        });
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Update the chapters state with the new batch results
      const { chapters } = get();
      const updatedChapters = [...chapters, ...data.unitsWithChapters];
      
      // Calculate progress
      const newCompletedUnits = [...batchState.completedUnits, ...unitIds];
      const progress = Math.round((newCompletedUnits.length / units.length) * 100);
      
      set({
        chapters: updatedChapters,
        batchState: {
          ...batchState,
          currentBatchIndex: batchState.currentBatchIndex + 1,
          completedUnits: newCompletedUnits,
          processingUnits: [],
          processingProgress: progress
        }
      });

      // Save progress to recovery storage
      const state = get();
      saveStateToStorage({
        courseTitle: state.courseTitle,
        currentStep: state.currentStep,
        units: state.units,
        chapters: state.chapters
      });

      clearError(); // Clear error on successful batch

    } catch (error) {
      console.error('Error processing batch:', error);
      const errorInfo = classifyError(error);
      setError(errorInfo);
      
      // Reset processing units on error
      set({
        batchState: {
          ...batchState,
          processingUnits: []
        }
      });
      
      throw errorInfo;
    }
  },

  generateChaptersBatchwise: async () => {
    const { units, setGeneratingChapters, setStep, setError, clearError } = get();

    // Clear any previous errors
    clearError();

    if (!units.length) {
      const error = classifyError(new Error('Units are required to generate chapters'));
      setError(error);
      throw error;
    }

    try {
      setGeneratingChapters(true);
      
      // Initialize batch processing
      get().initializeBatchProcessing();
      
      // Process batches sequentially
      while (get().batchState.currentBatchIndex < get().batchState.totalBatches) {
        await get().processNextBatch();
      }

      // All batches completed successfully
      get().resetBatchState();
      setStep('chapters');
      clearError();

    } catch (error) {
      console.error('Error in batch chapter generation:', error);
      get().resetBatchState();
      const errorInfo = classifyError(error);
      setError(errorInfo);
      throw errorInfo;
    } finally {
      setGeneratingChapters(false);
    }
  },

  resetBatchState: () => {
    set({
      batchState: {
        isProcessing: false,
        currentBatchIndex: 0,
        totalBatches: 0,
        completedUnits: [],
        processingUnits: [],
        batchSize: 4,
        processingProgress: 0
      }
    });
  },

  // Reset store to initial state
  reset: () => set({
    currentStep: 'title',
    courseTitle: '',
    units: [],
    chapters: [],
    isGeneratingUnits: false,
    isGeneratingChapters: false,
    isSaving: false,
    errorState: {
      hasError: false,
      error: null,
      retryCount: 0,
      maxRetries: DEFAULT_RETRY_CONFIG.maxRetries
    },
    hasRecoveryData: false,
    recoveryStateSummary: null
  }),
}));