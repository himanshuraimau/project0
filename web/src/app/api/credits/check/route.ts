import { NextRequest, NextResponse } from 'next/server';
import { checkUserHasCredits } from '@/lib/usage';

export async function GET(request: NextRequest) {
  try {
    const hasCredits = await checkUserHasCredits();
    
    return NextResponse.json({ 
      success: true,
      hasCredits
    });
  } catch (error) {
    console.error('Credit check error:', error);
    
    if (error instanceof Error && error.message.includes('User not authenticated')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to check credits'
        },
        { status: 401 }
      );
    }
    
    if (error instanceof Error && error.message.includes('Insufficient credits')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Insufficient credits',
          message: error.message
        },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to check credits',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
