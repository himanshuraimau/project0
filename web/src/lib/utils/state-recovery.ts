/**
 * State recovery utilities for preserving user input during errors
 * Requirements: 8.2, 8.4
 */

import { Unit, UnitWithChapters } from '@/lib/types/course.types';

const STORAGE_PREFIX = 'course_creation_';
const STORAGE_KEYS = {
  TITLE: `${STORAGE_PREFIX}title`,
  UNITS: `${STORAGE_PREFIX}units`,
  CHAPTERS: `${STORAGE_PREFIX}chapters`,
  STEP: `${STORAGE_PREFIX}step`,
  TIMESTAMP: `${STORAGE_PREFIX}timestamp`
} as const;

// Maximum age for stored data (24 hours)
const MAX_STORAGE_AGE = 24 * 60 * 60 * 1000;

/**
 * Course creation state for recovery
 */
export interface RecoverableState {
  courseTitle: string;
  units: Unit[];
  chapters: UnitWithChapters[];
  currentStep: string;
  timestamp: number;
}

/**
 * Saves the current course creation state to localStorage
 */
export function saveStateToStorage(state: Partial<RecoverableState>): void {
  try {
    const timestamp = Date.now();
    
    if (state.courseTitle !== undefined) {
      localStorage.setItem(STORAGE_KEYS.TITLE, state.courseTitle);
    }
    
    if (state.units !== undefined) {
      localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(state.units));
    }
    
    if (state.chapters !== undefined) {
      localStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify(state.chapters));
    }
    
    if (state.currentStep !== undefined) {
      localStorage.setItem(STORAGE_KEYS.STEP, state.currentStep);
    }
    
    localStorage.setItem(STORAGE_KEYS.TIMESTAMP, timestamp.toString());
  } catch (error) {
    console.warn('Failed to save state to localStorage:', error);
  }
}

/**
 * Recovers the course creation state from localStorage
 */
export function recoverStateFromStorage(): RecoverableState | null {
  try {
    const timestampStr = localStorage.getItem(STORAGE_KEYS.TIMESTAMP);
    if (!timestampStr) return null;
    
    const timestamp = parseInt(timestampStr, 10);
    const age = Date.now() - timestamp;
    
    // Check if stored data is too old
    if (age > MAX_STORAGE_AGE) {
      clearStoredState();
      return null;
    }
    
    const courseTitle = localStorage.getItem(STORAGE_KEYS.TITLE) || '';
    const currentStep = localStorage.getItem(STORAGE_KEYS.STEP) || 'title';
    
    let units: Unit[] = [];
    let chapters: UnitWithChapters[] = [];
    
    try {
      const unitsStr = localStorage.getItem(STORAGE_KEYS.UNITS);
      if (unitsStr) {
        units = JSON.parse(unitsStr);
      }
    } catch (error) {
      console.warn('Failed to parse stored units:', error);
    }
    
    try {
      const chaptersStr = localStorage.getItem(STORAGE_KEYS.CHAPTERS);
      if (chaptersStr) {
        chapters = JSON.parse(chaptersStr);
      }
    } catch (error) {
      console.warn('Failed to parse stored chapters:', error);
    }
    
    // Only return state if we have meaningful data
    if (courseTitle.trim() || units.length > 0 || chapters.length > 0) {
      return {
        courseTitle,
        units,
        chapters,
        currentStep,
        timestamp
      };
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to recover state from localStorage:', error);
    return null;
  }
}

/**
 * Clears all stored course creation state
 */
export function clearStoredState(): void {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.warn('Failed to clear stored state:', error);
  }
}

/**
 * Checks if there is recoverable state available
 */
export function hasRecoverableState(): boolean {
  const state = recoverStateFromStorage();
  return state !== null;
}

/**
 * Gets a summary of recoverable state for display to user
 */
export function getRecoverableStateSummary(): string | null {
  const state = recoverStateFromStorage();
  if (!state) return null;
  
  const parts: string[] = [];
  
  if (state.courseTitle.trim()) {
    parts.push(`Course: "${state.courseTitle}"`);
  }
  
  if (state.units.length > 0) {
    parts.push(`${state.units.length} units`);
  }
  
  if (state.chapters.length > 0) {
    const totalChapters = state.chapters.reduce((total, unit) => total + unit.chapters.length, 0);
    parts.push(`${totalChapters} chapters`);
  }
  
  if (parts.length === 0) return null;
  
  const timeAgo = getTimeAgo(state.timestamp);
  return `${parts.join(', ')} (saved ${timeAgo})`;
}

/**
 * Formats timestamp as "time ago" string
 */
function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  
  return 'earlier today';
}

/**
 * Validates recovered state to ensure it's still usable
 */
export function validateRecoveredState(state: RecoverableState): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Validate course title
  if (state.courseTitle && (state.courseTitle.length < 2 || state.courseTitle.length > 100)) {
    issues.push('Course title length is invalid');
  }
  
  // Validate units
  if (state.units.length > 0) {
    const emptyUnits = state.units.filter(unit => !unit.name.trim());
    if (emptyUnits.length > 0) {
      issues.push(`${emptyUnits.length} unit(s) have empty names`);
    }
  }
  
  // Validate chapters
  if (state.chapters.length > 0) {
    for (const unit of state.chapters) {
      if (!unit.name.trim()) {
        issues.push('Some units have empty names');
        break;
      }
      
      const emptyChapters = unit.chapters.filter(chapter => !chapter.name.trim());
      if (emptyChapters.length > 0) {
        issues.push('Some chapters have empty names');
        break;
      }
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}