// Subscription limits configuration for Web App
// Defines feature allowances for Pro plan and free tier

/**
 * Pro Plan Limits (for paid subscribers)
 * Note: null = unlimited
 */
export const PRO_PLAN_LIMITS = {
  notesPerMonth: null,            // Unlimited notes
  coursesPerMonth: 5,              // 5 courses per month
  pdfProcessingPerMonth: null,     // Unlimited PDF processing
  videoProcessingPerMonth: null,   // Unlimited video processing
  audioProcessingPerMonth: null,   // Unlimited audio processing
} as const;

/**
 * Free Tier Limits (for non-subscribers)
 */
export const FREE_TIER_LIMITS = {
  notesPerMonth: 1,                // 1 free note
  coursesPerMonth: 0,              // No courses (requires subscription)
  pdfProcessingPerMonth: 0,        // No PDF processing (requires subscription)
  videoProcessingPerMonth: 0,      // No video processing (requires subscription)
  audioProcessingPerMonth: 0,      // No audio processing (requires subscription)
} as const;

/**
 * Feature names for display and tracking
 */
export const FEATURE_NAMES = {
  notes: 'Notes',
  courses: 'Courses',
  pdfProcessing: 'PDF Processing',
  videoProcessing: 'Video Processing',
  audioProcessing: 'Audio Processing',
} as const;

/**
 * Get display text for limit (handles null = unlimited)
 */
export function getLimitDisplay(limit: number | null): string {
  if (limit === null) return 'Unlimited';
  if (limit === 0) return 'Not available';
  return `${limit} per month`;
}

/**
 * Check if usage is approaching limit (80% threshold)
 */
export function isApproachingLimit(used: number, limit: number | null): boolean {
  if (limit === null) return false;
  return used >= limit * 0.8;
}

/**
 * Calculate usage percentage
 */
export function getUsagePercentage(used: number, limit: number | null): number {
  if (limit === null) return 0;
  if (limit === 0) return 100;
  return Math.min(100, Math.round((used / limit) * 100));
}

/**
 * Type definitions
 */
export type FeatureLimits = {
  notesPerMonth: number | null;
  coursesPerMonth: number;
  pdfProcessingPerMonth: number | null;
  videoProcessingPerMonth: number | null;
  audioProcessingPerMonth: number | null;
};

export type UsageStats = {
  usedNotesThisMonth: number;
  usedCoursesThisMonth: number;
  usedPdfProcessingThisMonth: number;
  usedVideoProcessingThisMonth: number;
  usedAudioProcessingThisMonth: number;
  lastUsageResetDate: Date | null;
};
