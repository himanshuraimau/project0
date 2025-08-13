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
    // First check if the user is on Pro plan
    const proResponse = await fetch('/api/subscription/check');
    
    if (proResponse.ok) {
      const proData = await proResponse.json();
      
      // Pro users always have credits
      if (proData.success && proData.isPro) {
        return true;
      }
    }
    
    // If not a Pro user, check regular credits
    const response = await fetch('/api/credits/check');
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.hasCredits;
  } catch (error) {
    console.error('Error checking credits:', error);
    // Default to allowing usage in case of errors
    return true;
  }
}

/**
 * Checks if the user has available credits and redirects to pricing page if not.
 * This is a client-side only function.
 * @returns A promise that resolves to true if the user has credits, false otherwise
 */
export async function checkCreditsAndRedirect(): Promise<boolean> {
  try {
    const hasCredits = await checkUserCredits();
    
    if (!hasCredits) {
      // Show a message to the user
      alert('Insufficient credits. Please purchase more to continue using this feature.');
      
      // Redirect to pricing page
      setTimeout(() => {
        window.location.href = '/pricing';
      }, 1000);
      
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking credits:', error);
    // If there's an error, allow the user to proceed
    return true;
  }
}
