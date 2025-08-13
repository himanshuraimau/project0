/**
 * Client-side utility for checking credits and handling redirection
 * This file should not import any server-side code
 */

/**
 * Checks if the user has available credits and redirects to pricing page if not.
 * Makes an API call to check credits instead of using server-side code directly.
 * @returns A promise that resolves to true if the user has credits, false otherwise
 */
export async function checkCreditsAndRedirect(): Promise<boolean> {
  try {
    // Call our API endpoint to check credits
    const response = await fetch('/api/credits/check');
    const data = await response.json();
    
    if (!response.ok || data.hasCredits === false) {
      // Show a message to the user
      alert('Insufficient credits. Please purchase more to continue using this feature.');
      
      // Redirect to pricing page - using the correct path
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = '/pricing';
        }, 1000);
      }
      
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking credits:', error);
    // If there's an error, allow the user to proceed
    // We'll catch credit issues during actual processing
    return true;
  }
}
