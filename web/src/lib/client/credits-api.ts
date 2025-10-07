'use client';

/**
 * Client-side API for checking subscription access
 * (Formerly credit-based system, now subscription-based)
 * 
 * Access Control Rules:
 * - All features require an active subscription
 * - YouTube Video Upload + Transcription + Notes: Requires subscription
 * - Audio Upload + Transcription + Notes: Requires subscription
 * - PDF Upload + Processing + Notes: Requires subscription
 * - Text-to-Notes Generation: Requires subscription
 * - Course Generation: Requires subscription
 * - Flashcards, Quizzes, Transcripts: Requires subscription
 * - Notes from existing content: Requires subscription
 */

/**
 * Checks if the current user has an active subscription
 * @param requiredCredits Ignored (kept for backward compatibility)
 * @returns Promise resolving to true if user has subscription, false otherwise
 */
export async function checkUserCredits(requiredCredits: number = 1): Promise<boolean> {
  try {
    // Check subscription status instead of credits
    const response = await fetch('/api/subscription/status');
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.hasSubscription && data.access?.hasAccess === true;
  } catch (error) {
    console.error('Error checking subscription:', error);
    // Default to false - redirect to pricing
    return false;
  }
}

/**
 * Checks if the user has an active subscription and redirects to pricing page if not.
 * This is a client-side only function.
 * @param requiredCredits Ignored (kept for backward compatibility)
 * @returns A promise that resolves to true if the user has subscription, false otherwise
 */
export async function checkCreditsAndRedirect(requiredCredits: number = 1): Promise<boolean> {
  try {
    const hasAccess = await checkUserCredits(requiredCredits);
    
    if (!hasAccess) {
      // Redirect to pricing page instead of credits page
      if (typeof window !== 'undefined') {
        window.location.href = '/pricing?reason=no-subscription';
      }
      
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking subscription:', error);
    // If there's an error, redirect to pricing
    if (typeof window !== 'undefined') {
      window.location.href = '/pricing?reason=error';
    }
    return false;
  }
}

/**
 * Get subscription status (replaces credit balance check)
 * @returns Promise resolving to large number if subscribed, 0 if not
 */
export async function getCurrentCredits(): Promise<number> {
  try {
    const response = await fetch('/api/subscription/status');
    
    if (!response.ok) {
      return 0;
    }
    
    const data = await response.json();
    // Return high number if subscribed, 0 if not (backward compatibility)
    return (data.hasSubscription && data.access?.hasAccess) ? 999999 : 0;
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return 0;
  }
}
