import { NextRequest, NextResponse } from 'next/server';
import { getUserSubscriptionPlan } from '@/lib/usage';

export async function GET(request: NextRequest) {
  try {
    const plan = await getUserSubscriptionPlan();
    
    return NextResponse.json({ 
      success: true,
      plan,
      isPro: plan === 'pro'
    });
  } catch (error) {
    console.error('Subscription plan check error:', error);
    
    if (error instanceof Error && error.message.includes('User not authenticated')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to check subscription plan'
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Server error',
        message: 'Failed to check subscription plan'
      },
      { status: 500 }
    );
  }
}
