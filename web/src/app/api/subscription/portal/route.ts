// API endpoint to get Dodo customer portal link
// Portal lets users manage subscription, reactivate, update payment method, etc.

import { NextResponse, NextRequest } from 'next/server';
import { getUserFromAuth } from '@/lib/auth-helper';
import { SubscriptionService } from '@/lib/subscription-service';
import { DodoSubscriptionService } from '@/lib/payments/dodo';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromAuth(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const subscription = await SubscriptionService.getUserSubscription(userId);

    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    // Fetch subscription from Dodo to get customer_id (required for portal)
    const dodoSubscription = await DodoSubscriptionService.getSubscription(
      subscription.dodoSubscriptionId
    );

    const customerId = dodoSubscription?.customer?.customer_id;
    if (!customerId) {
      return NextResponse.json(
        { error: 'Could not resolve customer for portal' },
        { status: 400 }
      );
    }

    // Our /customer-portal route uses Dodo CustomerPortal handler; it needs customer_id
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || request.nextUrl.origin;
    const portalUrl = `${baseUrl}/customer-portal?customer_id=${customerId}`;

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
