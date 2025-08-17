'use client';

/**
 * Client-side API for checking and managing credits
 */

/**
 * Checks if the current user has available credits
 * @returns Promise resolving to true if user has credits, false otherwise
 */
export async function checkUserCredits(): Promise<boolean> {
  try {
    // Check user's credit balance using the existing API
    const response = await fetch('/api/users/credits');
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.success && data.credits > 0;
  } catch (error) {
    console.error('Error checking credits:', error);
    // Default to allowing usage in case of errors
    return true;
  }
}

/**
 * Checks if the user has available credits and shows an alert if not.
 * This is a client-side only function.
 * @returns A promise that resolves to true if the user has credits, false otherwise
 */
export async function checkCreditsAndRedirect(): Promise<boolean> {
  try {
    const hasCredits = await checkUserCredits();
    
    if (!hasCredits) {
      // Redirect to credits page instead of showing alert
      if (typeof window !== 'undefined') {
        window.location.href = '/credits?reason=insufficient';
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
