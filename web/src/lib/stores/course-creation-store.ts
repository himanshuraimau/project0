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
 * Batch processing state for chapter content generation (YouTube videos, etc.)
 */
interface BatchProcessingState {
  isProcessing: boolean;
  currentBatchIndex: number;
  totalBatches: number;
  completedChapters: string[];
  processingChapters: string[];
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

  // Course ID after saving
  savedCourseId: string | null;

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
    completedChapters: [],
    processingChapters: [],
    batchSize: 4,
    processingProgress: 0
  },

  // Course ID after saving
  savedCourseId: null,

  // Basic setters with state preservation
  setStep: (step: WizardStep) => {
    set({ currentStep: step });
    
    // Initialize batch processing when transitioning to content-generation
    if (step === 'content-generation') {
      get().initializeBatchProcessing();
    }
    
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

  // Course ID setter
  setSavedCourseId: (courseId: string | null) => set({ savedCourseId: courseId }),

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
    const { courseTitle, units, setGeneratingChapters, setChapters, setStep, setError, clearError } = get();

    // Clear any previous errors
    clearError();

    if (!courseTitle.trim()) {
      const error = classifyError(new Error('Course title is required'));
      setError(error);
      throw error;
    }

    if (!units.length) {
      const error = classifyError(new Error('Units are required to generate chapters'));
      setError(error);
      throw error;
    }

    try {
      setGeneratingChapters(true);

      const response = await withRetry(async () => {
        return await fetchWithRetry('/api/course/generate-chapters', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: courseTitle, units }),
        });
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setChapters(data.unitsWithChapters);
      setStep('chapters');
      clearError(); // Clear error on success
    } catch (error) {
      console.error('Error generating chapters:', error);
      const errorInfo = classifyError(error);
      setError(errorInfo);
      throw errorInfo;
    } finally {
      setGeneratingChapters(false);
    }
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

      // Update chapter IDs with the actual database IDs
      if (data.chapters && data.chapters.length > 0) {
        const { chapters } = get();
        const updatedChapters = [...chapters];
        
        // Map the database chapters back to the frontend structure
        let chapterIndex = 0;
        for (let unitIndex = 0; unitIndex < updatedChapters.length; unitIndex++) {
          const unit = updatedChapters[unitIndex];
          for (let i = 0; i < unit.chapters.length; i++) {
            if (data.chapters[chapterIndex]) {
              // Update the chapter with the real database ID
              unit.chapters[i] = {
                ...unit.chapters[i],
                id: data.chapters[chapterIndex].id
              };
              chapterIndex++;
            }
          }
        }
        
        set({ chapters: updatedChapters });
      }

      clearError(); // Clear error on success
      clearStoredState(); // Clear recovery data on successful save
      set({ savedCourseId: data.courseId }); // Store the course ID
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
    const { chapters } = get();
    // Count total chapters across all units
    const totalChapters = chapters.reduce((total, unit) => total + unit.chapters.length, 0);
    const batchSize = 4; // Process 4 chapters at a time for optimal performance
    const totalBatches = Math.ceil(totalChapters / batchSize);
    
    set({
      batchState: {
        isProcessing: true,
        currentBatchIndex: 0,
        totalBatches,
        completedChapters: [],
        processingChapters: [],
        batchSize,
        processingProgress: 0
      }
    });
  },

  processNextBatch: async () => {
    const { courseTitle, chapters, batchState, setError, clearError } = get();
    
    if (!batchState.isProcessing || batchState.currentBatchIndex >= batchState.totalBatches) {
      return;
    }

    // Clear any previous errors
    clearError();

    // Flatten all chapters and get the current batch
    const allChapters: Array<{ chapterId: string; unitId: string; chapter: any }> = [];
    chapters.forEach(unit => {
      unit.chapters.forEach(chapter => {
        allChapters.push({
          chapterId: chapter.id,
          unitId: unit.id,
          chapter: chapter
        });
      });
    });

    const startIndex = batchState.currentBatchIndex * batchState.batchSize;
    const endIndex = Math.min(startIndex + batchState.batchSize, allChapters.length);
    const currentBatchChapters = allChapters.slice(startIndex, endIndex);
    const chapterIds = currentBatchChapters.map(c => c.chapterId);

    // Update processing chapters
    set({
      batchState: {
        ...batchState,
        processingChapters: chapterIds
      }
    });

    try {
      // Call the API to generate content for this batch of chapters
      const response = await withRetry(async () => {
        return await fetchWithRetry('/api/course/generate-chapter-content-batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            courseTitle, 
            chapters: currentBatchChapters.map(c => ({
              id: c.chapterId,
              name: c.chapter.name,
              youtubeSearchQuery: c.chapter.youtubeSearchQuery,
              unitId: c.unitId
            })),
            batchIndex: batchState.currentBatchIndex 
          }),
        });
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Calculate progress
      const newCompletedChapters = [...batchState.completedChapters, ...chapterIds];
      const progress = Math.round((newCompletedChapters.length / allChapters.length) * 100);
      
      set({
        batchState: {
          ...batchState,
          currentBatchIndex: batchState.currentBatchIndex + 1,
          completedChapters: newCompletedChapters,
          processingChapters: [],
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
      console.error('Error processing chapter content batch:', error);
      const errorInfo = classifyError(error);
      setError(errorInfo);
      
      // Reset processing chapters on error
      set({
        batchState: {
          ...batchState,
          processingChapters: []
        }
      });
      
      throw errorInfo;
    }
  },

  generateChaptersBatchwise: async () => {
    const { chapters, setSaving, setStep, setError, clearError } = get();

    // Clear any previous errors
    clearError();

    if (!chapters.length) {
      const error = classifyError(new Error('Chapters are required for content generation'));
      setError(error);
      throw error;
    }

    try {
      setSaving(true); // Use saving state for content generation
      
      // Initialize batch processing for chapter content
      get().initializeBatchProcessing();
      
      // Process batches sequentially
      while (get().batchState.currentBatchIndex < get().batchState.totalBatches) {
        await get().processNextBatch();
      }

      // All batches completed successfully
      get().resetBatchState();
      setStep('content-generation'); // Move to content generation complete
      clearError();

    } catch (error) {
      console.error('Error in batch chapter content generation:', error);
      get().resetBatchState();
      const errorInfo = classifyError(error);
      setError(errorInfo);
      throw errorInfo;
    } finally {
      setSaving(false);
    }
  },

  resetBatchState: () => {
    set({
      batchState: {
        isProcessing: false,
        currentBatchIndex: 0,
        totalBatches: 0,
        completedChapters: [],
        processingChapters: [],
        batchSize: 4,
        processingProgress: 0
      }
    });
  },

  // Reset store to initial state
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
    recoveryStateSummary: null,
    batchState: {
      isProcessing: false,
      currentBatchIndex: 0,
      totalBatches: 0,
      completedChapters: [],
      processingChapters: [],
      batchSize: 4,
      processingProgress: 0
    },
    savedCourseId: null
  }),
}));