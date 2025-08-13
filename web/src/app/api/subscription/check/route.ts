import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

/**
 * Check if the current user has a Pro subscription
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to check subscription status'
        },
        { status: 401 }
      );
    }
    
    // Get list of Pro users from environment
    const proUserIds = process.env.PRO_USER_IDS?.split(',') || [];
    
    // Check if user is in the Pro users list
    const isPro = proUserIds.includes(userId);
    
    return NextResponse.json({ 
      success: true,
      isPro
    });
    
  } catch (error) {
    console.error('Error checking subscription status:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to check subscription status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
