/**
 * Credit system and subscription types
 */

// Basic credit information structure
export interface CreditInfo {
  total: number;
  used: number;
  remaining: number;
  isPro: boolean;
}

// Subscription status information
export interface SubscriptionStatus {
  isPro: boolean;
  loading: boolean;
  error: string | null;
}

// Credit status API response
export interface CreditStatusResponse {
  success: boolean;
  credits?: CreditInfo;
  error?: string;
  message?: string;
}

// Subscription check API response
export interface SubscriptionCheckResponse {
  success: boolean;
  isPro: boolean;
  error?: string;
  message?: string;
}

// Credit check API response
export interface CreditCheckResponse {
  success: boolean;
  hasCredits: boolean;
  error?: string;
  message?: string;
}

// Credit error with redirection information
export interface CreditError extends Error {
  redirectToPricing?: boolean;
  redirectUrl?: string;
  code?: 'INSUFFICIENT_CREDITS' | 'UNAUTHORIZED' | 'SERVER_ERROR';
}

// Usage status information
export interface UsageStatus {
  totalUsage: number;
  remainingPoints: number;
  isOverLimit: boolean;
}

// Credit operation result
export interface CreditOperationResult {
  success: boolean;
  hasCredits: boolean;
  shouldRedirect?: boolean;
  redirectUrl?: string;
  error?: string;
}

// Subscription plan types
export type SubscriptionPlan = 'free' | 'pro';

// Credit transaction types
export type CreditTransactionType = 
  | 'note_generation'
  | 'quiz_generation' 
  | 'flashcard_generation'
  | 'pdf_processing'
  | 'audio_transcription'
  | 'semantic_search';

// Credit transaction record
export interface CreditTransaction {
  id: string;
  userId: string;
  type: CreditTransactionType;
  amount: number;
  description?: string;
  createdAt: Date;
}

// Credit balance information
export interface CreditBalance {
  current: number;
  total: number;
  used: number;
  percentage: number;
}

// Subscription metadata
export interface SubscriptionMetadata {
  plan: SubscriptionPlan;
  startDate?: Date;
  endDate?: Date;
  features: string[];
}

// Hook return types
export type UseSubscriptionStatusReturn = SubscriptionStatus;

export interface UseCreditStatusReturn {
  credits: CreditInfo | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}