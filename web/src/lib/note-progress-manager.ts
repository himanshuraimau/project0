type NoteProgressStage =
  | "uploading"
  | "processing"
  | "generating"
  | "completed"
  | "error";

export interface NoteProgressEvent {
  jobId: string;
  progress: number;
  stage: NoteProgressStage;
  message: string;
  updatedAt: number;
}

type ProgressListener = (event: NoteProgressEvent) => void;

class NoteProgressManager {
  private readonly latestByJob = new Map<string, NoteProgressEvent>();
  private readonly listenersByJob = new Map<string, Set<ProgressListener>>();

  publish(event: Omit<NoteProgressEvent, "updatedAt">) {
    const normalized: NoteProgressEvent = {
      ...event,
      progress: Math.max(0, Math.min(100, Math.round(event.progress))),
      updatedAt: Date.now(),
    };

    this.latestByJob.set(normalized.jobId, normalized);

    const listeners = this.listenersByJob.get(normalized.jobId);
    if (!listeners || listeners.size === 0) {
      console.log('[Progress Manager] No listeners for jobId:', normalized.jobId);
      return;
    }

    console.log('[Progress Manager] Publishing to', listeners.size, 'listener(s):', normalized);

    for (const listener of listeners) {
      try {
        listener(normalized);
      } catch (error) {
        console.error('[Progress Manager] Error in listener callback:', error);
      }
    }
  }

  getLatest(jobId: string) {
    return this.latestByJob.get(jobId);
  }

  subscribe(jobId: string, listener: ProgressListener) {
    const listeners = this.listenersByJob.get(jobId) ?? new Set<ProgressListener>();
    listeners.add(listener);
    this.listenersByJob.set(jobId, listeners);

    return () => {
      const nextListeners = this.listenersByJob.get(jobId);
      if (!nextListeners) {
        return;
      }

      nextListeners.delete(listener);
      if (nextListeners.size === 0) {
        this.listenersByJob.delete(jobId);
      }
    };
  }
}

const globalForNoteProgress = globalThis as typeof globalThis & {
  __noteProgressManager?: NoteProgressManager;
};

export const noteProgressManager =
  globalForNoteProgress.__noteProgressManager ??
  (globalForNoteProgress.__noteProgressManager = new NoteProgressManager());
