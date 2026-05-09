import { NextResponse, NextRequest } from 'next/server';
import { getUserFromAuth } from '@/lib/auth-helper';
import { SubscriptionService } from '@/lib/subscription-service';
import { PaddleSubscriptionService } from '@/lib/payments/paddle';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromAuth(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await SubscriptionService.getUserSubscription(userId);

    if (!subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    if (subscription.provider === 'REVENUECAT') {
      const metadata = subscription.metadata as Record<string, unknown> | null;
      const managementUrl =
        (metadata?.management_url as string) ||
        (metadata?.managementURL as string) ||
        null;
      if (managementUrl) {
        return NextResponse.json({
          portalUrl: managementUrl,
          subscription: {
            id: subscription.id,
            status: subscription.status,
          },
        });
      }

      return NextResponse.json(
        { error: 'Manage your subscription in your Apple ID settings' },
        { status: 400 }
      );
    }

    let customerId = subscription.user?.paddleCustomerId;

    if (!subscription.paddleSubscriptionId) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // If customer ID is missing, fetch it from Paddle and save it
    if (!customerId && subscription.paddleSubscriptionId) {
      const paddleSub = await PaddleSubscriptionService.getSubscription(subscription.paddleSubscriptionId);
      const fetchedCustomerId = (paddleSub as any)?.customerId;
      if (fetchedCustomerId) {
        customerId = fetchedCustomerId;
        await prisma.user.update({
          where: { id: userId },
          data: { paddleCustomerId: fetchedCustomerId },
        }).catch(() => {});
      }
    }

    if (!customerId) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 400 });
    }

    const portalUrl = await PaddleSubscriptionService.getPortalUrl(
      customerId,
      subscription.paddleSubscriptionId
    );

    if (!portalUrl) {
      return NextResponse.json({ error: 'Failed to generate portal link' }, { status: 500 });
    }

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
