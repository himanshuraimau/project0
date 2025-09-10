/**
 * Progress tracking service for podcast generation
 * Provides real-time progress updates and status monitoring
 * Requirements: 2.8, 4.1, 4.2, 4.3
 */

export interface PodcastGenerationProgress {
  podcastId: string;
  stage: 'pending' | 'script_generation' | 'voice_synthesis' | 'audio_processing' | 'storage' | 'indexing' | 'completed' | 'failed';
  progress: number; // 0-100
  message: string;
  estimatedTimeRemaining?: number; // seconds
  startTime: number;
  lastUpdate: number;
  error?: string;
}

export interface PodcastGenerationStage {
  name: string;
  description: string;
  weight: number; // Relative weight for progress calculation
  estimatedDuration: number; // seconds
}

/**
 * Manages progress tracking for podcast generation operations
 */
export class PodcastProgressTracker {
  private static instance: PodcastProgressTracker;
  private progressMap = new Map<string, PodcastGenerationProgress>();
  private listeners = new Map<string, Set<(progress: PodcastGenerationProgress) => void>>();

  // Define generation stages with weights and estimated durations
  private readonly stages: Record<string, PodcastGenerationStage> = {
    pending: {
      name: 'Initializing',
      description: 'Preparing podcast generation...',
      weight: 5,
      estimatedDuration: 2
    },
    script_generation: {
      name: 'Generating Script',
      description: 'Creating conversational script from your notes...',
      weight: 30,
      estimatedDuration: 15
    },
    voice_synthesis: {
      name: 'Synthesizing Voices',
      description: 'Converting script to natural speech...',
      weight: 40,
      estimatedDuration: 30
    },
    audio_processing: {
      name: 'Processing Audio',
      description: 'Combining and optimizing audio segments...',
      weight: 15,
      estimatedDuration: 10
    },
    storage: {
      name: 'Saving Podcast',
      description: 'Uploading and storing your podcast...',
      weight: 5,
      estimatedDuration: 5
    },
    indexing: {
      name: 'Indexing Content',
      description: 'Preparing transcript for AI chat...',
      weight: 5,
      estimatedDuration: 3
    },
    completed: {
      name: 'Completed',
      description: 'Your podcast is ready!',
      weight: 0,
      estimatedDuration: 0
    },
    failed: {
      name: 'Failed',
      description: 'Generation failed',
      weight: 0,
      estimatedDuration: 0
    }
  };

  static getInstance(): PodcastProgressTracker {
    if (!PodcastProgressTracker.instance) {
      PodcastProgressTracker.instance = new PodcastProgressTracker();
    }
    return PodcastProgressTracker.instance;
  }

  /**
   * Initialize progress tracking for a new podcast generation
   */
  initializeProgress(podcastId: string): PodcastGenerationProgress {
    const now = Date.now();
    const progress: PodcastGenerationProgress = {
      podcastId,
      stage: 'pending',
      progress: 0,
      message: this.stages.pending.description,
      estimatedTimeRemaining: this.calculateTotalEstimatedTime(),
      startTime: now,
      lastUpdate: now
    };

    this.progressMap.set(podcastId, progress);
    this.notifyListeners(podcastId, progress);
    return progress;
  }

  /**
   * Update progress for a specific stage
   */
  updateProgress(
    podcastId: string, 
    stage: PodcastGenerationProgress['stage'], 
    stageProgress: number = 0,
    customMessage?: string
  ): PodcastGenerationProgress | null {
    const current = this.progressMap.get(podcastId);
    if (!current) {
      console.warn(`No progress tracking found for podcast ${podcastId}`);
      return null;
    }

    const stageInfo = this.stages[stage];
    const overallProgress = this.calculateOverallProgress(stage, stageProgress);
    const estimatedTimeRemaining = this.calculateEstimatedTimeRemaining(current.startTime, overallProgress);

    const updated: PodcastGenerationProgress = {
      ...current,
      stage,
      progress: overallProgress,
      message: customMessage || stageInfo.description,
      estimatedTimeRemaining,
      lastUpdate: Date.now()
    };

    this.progressMap.set(podcastId, updated);
    this.notifyListeners(podcastId, updated);
    return updated;
  }

  /**
   * Mark generation as completed
   */
  completeProgress(podcastId: string): PodcastGenerationProgress | null {
    const current = this.progressMap.get(podcastId);
    if (!current) return null;

    const completed: PodcastGenerationProgress = {
      ...current,
      stage: 'completed',
      progress: 100,
      message: this.stages.completed.description,
      estimatedTimeRemaining: 0,
      lastUpdate: Date.now()
    };

    this.progressMap.set(podcastId, completed);
    this.notifyListeners(podcastId, completed);
    
    // Clean up after a delay
    setTimeout(() => {
      this.cleanupProgress(podcastId);
    }, 30000); // 30 seconds

    return completed;
  }

  /**
   * Mark generation as failed
   */
  failProgress(podcastId: string, error: string): PodcastGenerationProgress | null {
    const current = this.progressMap.get(podcastId);
    if (!current) return null;

    const failed: PodcastGenerationProgress = {
      ...current,
      stage: 'failed',
      message: 'Generation failed',
      error,
      estimatedTimeRemaining: 0,
      lastUpdate: Date.now()
    };

    this.progressMap.set(podcastId, failed);
    this.notifyListeners(podcastId, failed);
    return failed;
  }

  /**
   * Get current progress for a podcast
   */
  getProgress(podcastId: string): PodcastGenerationProgress | null {
    return this.progressMap.get(podcastId) || null;
  }

  /**
   * Subscribe to progress updates for a specific podcast
   */
  subscribe(podcastId: string, callback: (progress: PodcastGenerationProgress) => void): () => void {
    if (!this.listeners.has(podcastId)) {
      this.listeners.set(podcastId, new Set());
    }
    
    this.listeners.get(podcastId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(podcastId);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(podcastId);
        }
      }
    };
  }

  /**
   * Clean up progress tracking for a podcast
   */
  cleanupProgress(podcastId: string): void {
    this.progressMap.delete(podcastId);
    this.listeners.delete(podcastId);
  }

  /**
   * Calculate overall progress based on current stage and stage progress
   */
  private calculateOverallProgress(stage: string, stageProgress: number): number {
    const stageOrder = ['pending', 'script_generation', 'voice_synthesis', 'audio_processing', 'storage', 'indexing'];
    const currentStageIndex = stageOrder.indexOf(stage);
    
    if (currentStageIndex === -1) return 0;

    let totalWeight = 0;
    let completedWeight = 0;

    // Calculate completed weight from previous stages
    for (let i = 0; i < currentStageIndex; i++) {
      const stageInfo = this.stages[stageOrder[i]];
      totalWeight += stageInfo.weight;
      completedWeight += stageInfo.weight;
    }

    // Add current stage weight
    const currentStageInfo = this.stages[stage];
    totalWeight += currentStageInfo.weight;
    completedWeight += (currentStageInfo.weight * stageProgress) / 100;

    // Add remaining stages to total weight
    for (let i = currentStageIndex + 1; i < stageOrder.length; i++) {
      totalWeight += this.stages[stageOrder[i]].weight;
    }

    return Math.min(100, Math.round((completedWeight / totalWeight) * 100));
  }

  /**
   * Calculate estimated time remaining based on elapsed time and progress
   */
  private calculateEstimatedTimeRemaining(startTime: number, progress: number): number {
    if (progress <= 0) return this.calculateTotalEstimatedTime();
    
    const elapsed = (Date.now() - startTime) / 1000; // seconds
    const estimatedTotal = (elapsed / progress) * 100;
    const remaining = Math.max(0, estimatedTotal - elapsed);
    
    return Math.round(remaining);
  }

  /**
   * Calculate total estimated time for all stages
   */
  private calculateTotalEstimatedTime(): number {
    return Object.values(this.stages).reduce((total, stage) => total + stage.estimatedDuration, 0);
  }

  /**
   * Notify all listeners for a specific podcast
   */
  private notifyListeners(podcastId: string, progress: PodcastGenerationProgress): void {
    const listeners = this.listeners.get(podcastId);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(progress);
        } catch (error) {
          console.error('Error in progress listener:', error);
        }
      });
    }
  }
}

// Export singleton instance
export const podcastProgressTracker = PodcastProgressTracker.getInstance();

// Note: React hooks are exported from separate hook file to avoid import issues