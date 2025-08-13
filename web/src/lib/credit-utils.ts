import 'server-only';
import { checkUserHasCredits } from './usage';

/**
 * Server-side only functions for credit checking and management.
 * These should never be imported in client components.
 */

/**
 * Check if user has credits (server-side only)
 * @returns Promise resolving to true if user has credits, false otherwise
 */
export async function checkUserCreditsServer(): Promise<boolean> {
  try {
    return await checkUserHasCredits();
  } catch (error) {
    console.error('Error checking credits on server:', error);
    // Default to allowing usage in case of errors
    return true;
  }
}
