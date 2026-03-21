import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { isValidRevenueCatWebhookAuth } from '@/lib/revenuecat';
import { syncRevenueCatSubscriber } from '@/lib/revenuecat';
import type { RevenueCatWebhookEvent, RevenueCatWebhookPayload } from '@/lib/revenuecat';

function getWebhookEvent(payload: RevenueCatWebhookPayload): RevenueCatWebhookEvent | null {
  if (payload.event) return payload.event;
  if ('type' in payload || 'app_user_id' in payload || 'original_app_user_id' in payload) {
    return payload as RevenueCatWebhookEvent;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader =
      request.headers.get('authorization') || request.headers.get('x-revenuecat-auth');

    if (!isValidRevenueCatWebhookAuth(authHeader)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = (await request.json()) as RevenueCatWebhookPayload;
    const event = getWebhookEvent(payload);

    if (!event) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
    }

    const eventId = event.id || payload.id;
    if (!eventId) {
      return NextResponse.json({ error: 'Missing event id' }, { status: 400 });
    }

    try {
      await prisma.webhookEvent.create({
        data: {
          provider: 'REVENUECAT',
          eventId,
          payload,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return NextResponse.json({ received: true, duplicate: true });
      }
      throw error;
    }

    const appUserId = event.app_user_id || event.original_app_user_id;

    try {
      if (appUserId) {
        await syncRevenueCatSubscriber(appUserId, event);
      } else {
        console.warn('RevenueCat webhook missing app_user_id:', event.type);
      }
    } catch (error) {
      console.error('RevenueCat webhook sync failed:', error);
      await prisma.webhookEvent.deleteMany({
        where: {
          provider: 'REVENUECAT',
          eventId,
        },
      }).catch(() => {});
      throw error;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing RevenueCat webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
