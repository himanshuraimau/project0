'use client';

/**
 * Client-side API for checking and managing credits
 * 
 * Credit System Rules:
 * - YouTube Video Upload + Transcription + Notes: 1 credit
 * - Audio Upload + Transcription + Notes: 1 credit
 * - PDF Upload + Processing + Notes: 1 credit
 * - Text-to-Notes Generation: 1 credit
 * - Course Generation: 2 credits  
 * - Flashcards, Quizzes, Transcripts: FREE (once content exists)
 * - Notes from existing content: FREE
 */

/**
 * Checks if the current user has available credits
 * @param requiredCredits Number of credits required (default: 1)
 * @returns Promise resolving to true if user has enough credits, false otherwise
 */
export async function checkUserCredits(requiredCredits: number = 1): Promise<boolean> {
  try {
    // Check user's credit balance using the existing API
    const response = await fetch('/api/users/credits');
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.success && data.credits >= requiredCredits;
  } catch (error) {
    console.error('Error checking credits:', error);
    // Default to allowing usage in case of errors
    return true;
  }
}

/**
 * Checks if the user has available credits and redirects to credits page if not.
 * This is a client-side only function.
 * @param requiredCredits Number of credits required (default: 1)
 * @returns A promise that resolves to true if the user has enough credits, false otherwise
 */
export async function checkCreditsAndRedirect(requiredCredits: number = 1): Promise<boolean> {
  try {
    const hasCredits = await checkUserCredits(requiredCredits);
    
    if (!hasCredits) {
      // Redirect to credits page instead of showing alert
      if (typeof window !== 'undefined') {
        const reason = requiredCredits > 1 ? 'insufficient_course' : 'insufficient';
        window.location.href = `/credits?reason=${reason}&required=${requiredCredits}`;
      }
      
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking credits:', error);
    // If there's an error, allow the user to proceed
    return true;
  }
}

/**
 * Get current user's credit balance
 * @returns Promise resolving to credit balance number, or 0 if error
 */
export async function getCurrentCredits(): Promise<number> {
  try {
    const response = await fetch('/api/users/credits');
    
    if (!response.ok) {
      return 0;
    }
    
    const data = await response.json();
    return data.success ? data.credits : 0;
  } catch (error) {
    console.error('Error fetching credits:', error);
    return 0;
  }
}
