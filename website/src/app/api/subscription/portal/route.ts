// API endpoint to get Dodo customer portal link

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { SubscriptionService } from '@/lib/services/subscription-service';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's subscription
    const subscription = await SubscriptionService.getUserSubscription(userId);

    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    // Generate portal link for Dodo customer portal
    // Note: Adjust this based on actual Dodo portal implementation
    const portalUrl = `${process.env.DODO_PORTAL_URL || 'https://portal.dodopayments.com'}?subscription_id=${subscription.dodoSubscriptionId}`;

    return NextResponse.json({
      portalUrl,
      subscription: {
        id: subscription.id,
        status: subscription.status,
      },
    });
  } catch (error: any) {
    console.error('Error generating portal link:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate portal link' },
      { status: 500 }
    );
  }
}
