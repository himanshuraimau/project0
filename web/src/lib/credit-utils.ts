'use client'

import { subscriptionCache } from './subscription-cache';

/**
 * Helper functions for subscription-based access control
 * (Formerly credit-based system)
 * 
 * Access Control Rules:
 * - All features require an active subscription
 * - YouTube Video Upload + Transcription + Notes: Requires subscription
 * - Course Generation: Requires subscription
 * - Flashcards, Quizzes, Transcripts: Requires subscription
 * - Notes from existing content: Requires subscription
 */

/**
 * Check if user has subscription access
 * @deprecated Use subscription status check instead
 */
export async function useCredits(action: string, credits: number = 1, resourceId?: string) {
  try {
    // Use cached subscription data with request deduplication
    const data = await subscriptionCache.getStatus();

    if (!data.access?.hasAccess) {
      // No active subscription
      throw new Error('INSUFFICIENT_CREDITS') // Keep error name for backward compatibility
    }

    return {
      success: true,
      hasAccess: true
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'INSUFFICIENT_CREDITS') {
      throw error
    }
    console.error('Error checking subscription:', error)
    throw new Error('Failed to check subscription access')
  }
}

/**
 * Get subscription status (replaces credit balance check)
 * @deprecated Use subscription status directly
 */
export async function getCurrentCredits() {
  try {
    // Use cached subscription data with request deduplication
    const data = await subscriptionCache.getStatus();
    
    // Return a high number if user has subscription, 0 if not
    // This maintains backward compatibility
    return data.access?.hasAccess ? 999999 : 0
  } catch (error) {
    console.error('Error fetching subscription status:', error)
    return 0
  }
}

/**
 * Handle missing subscription (replaces insufficient credits)
 */
export function handleInsufficientCredits() {
  // Redirect to pricing page instead of credits page
  window.location.href = '/pricing?reason=no-subscription'
}
