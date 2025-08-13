import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUsageStatus, getUserRemainingPoints, FREE_POINTS } from '@/lib/usage';

/*
 * Get the current user's credit status
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, has } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to check credit status'
        },
        { status: 401 }
      );
    }
    
    // Check if the user has pro plan using Clerk's has() method
    const hasPro = has({ plan: 'pro' });
    
    if (hasPro) {
      // Pro users have unlimited credits
      return NextResponse.json({
        success: true,
        credits: {
          total: Infinity,
          used: 0,
          remaining: Infinity,
          isPro: true
        }
      });
    }
    
    // For regular users, get their actual usage directly from the database
    const remainingPoints = await getUserRemainingPoints();
    
    // Also get the usage status for additional metrics
    const usageStatus = await getUsageStatus();
    
    console.log('Debug - API retrieved credit data:', {
      userId: userId,
      totalCredits: FREE_POINTS, 
      remainingPoints,
      usedPoints: FREE_POINTS - remainingPoints,
      usageStatus
    });
    
    // Use the imported FREE_POINTS constant from usage module to ensure consistency
    const totalCredits = FREE_POINTS; // Use the same constant as in the usage module
    
    return NextResponse.json({
      success: true,
      credits: {
        total: totalCredits, 
        used: totalCredits - remainingPoints, // Calculate used credits
        remaining: remainingPoints, // Get directly from database
        isPro: false
      }
    });
  } catch (error) {
    console.error('Error getting credit status:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get credit status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
