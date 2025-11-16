import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { verifyToken } from '@clerk/backend';
import { cookies } from 'next/headers';

/**
 * Universal authentication helper that works for both same-origin (web) and cross-origin (mobile) requests.
 * 
 * This function attempts two authentication strategies:
 * 1. Standard Clerk auth() - for same-origin requests (web app)
 * 2. Token verification from Authorization header - for cross-origin requests (mobile app)
 * 
 * @param request - The NextRequest object
 * @returns The authenticated user ID, or null if authentication fails
 */
export async function getUserFromAuth(request: NextRequest): Promise<string | null> {
  try {
    // First try the standard Clerk auth (for same-origin requests)
    const { userId } = await auth();
    
    if (userId) {
      return userId;
    }

    // If no userId, try to validate from Authorization header (for cross-origin requests)
    const authHeader = request.headers.get('authorization');
    const cookieStore = await cookies();
    const sessToken = cookieStore.get('__session')?.value;
    
    const bearerToken = authHeader?.replace('Bearer ', '');
    const token = sessToken || bearerToken;

    if (!token) {
      return null;
    }

    // Verify the JWT token with Clerk
    const verifiedToken = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    
    return verifiedToken.sub;
    
  } catch (error) {
    console.error('Auth error:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Convenience wrapper that throws an error if authentication fails.
 * Use this when you want to ensure the user is authenticated.
 */
export async function requireAuth(request: NextRequest): Promise<string> {
  const userId = await getUserFromAuth(request);
  if (!userId) {
    throw new Error('Authentication required');
  }
  return userId;
}
