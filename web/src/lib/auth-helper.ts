import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

export type UserRole = 'USER' | 'ADMIN';

/**
 * Universal authentication helper that works for both same-origin (web) and cross-origin (mobile) requests.
 * 
 * This function attempts authentication using Better Auth:
 * 1. Uses auth.api.getSession() with headers for same-origin requests (web app)
 * 2. For cross-origin requests, the Authorization header is automatically handled by Better Auth
 * 
 * @param request - The NextRequest object
 * @returns The authenticated user ID, or null if authentication fails
 */
export async function getUserFromAuth(request: NextRequest): Promise<string | null> {
  try {
    // Get session using Better Auth
    const session = await auth.api.getSession({
      headers: await headers()
    });
    
    if (session?.user?.id) {
      return session.user.id;
    }

    // If no session from headers, check for Authorization header (mobile app)
    const authHeader = request.headers.get('authorization');
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      // Verify token with Better Auth
      // Better Auth will automatically validate the session token
      const tokenSession = await auth.api.getSession({
        headers: new Headers({
          'authorization': `Bearer ${token}`
        })
      });
      
      if (tokenSession?.user?.id) {
        return tokenSession.user.id;
      }
    }

    return null;
    
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

/**
 * Check if the authenticated user has the given role.
 * Fetches the user from the database (role is only stored in DB, not in session).
 */
export async function getUserRole(request: NextRequest): Promise<UserRole | null> {
  const userId = await getUserFromAuth(request);
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role ?? null;
}

/**
 * Returns true if the authenticated user is an admin. Use for admin-only routes or UI.
 */
export async function isAdmin(request: NextRequest): Promise<boolean> {
  const role = await getUserRole(request);
  return role === 'ADMIN';
}

/**
 * Throws if the current user is not an admin. Use at the start of admin-only API routes.
 */
export async function requireAdmin(request: NextRequest): Promise<string> {
  const userId = await requireAuth(request);
  const role = await getUserRole(request);
  if (role !== 'ADMIN') {
    throw new Error('Admin access required');
  }
  return userId;
}

