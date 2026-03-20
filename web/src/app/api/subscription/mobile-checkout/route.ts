import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { PaymentService } from '@/lib/payments';
import type { BillingInterval } from '@/lib/payments';
import {
  createMobileCheckoutToken,
  verifyMobileCheckoutToken,
} from '@/lib/payments/paddle/mobile-checkout-token';
import { getUserFromAuth } from '@/lib/auth-helper';

function isAllowedRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Expo Go uses exp/exps during development, while installed builds use the app scheme.
    return ['http:', 'https:', 'flinote:', 'exp:', 'exps:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let billingInterval: BillingInterval = 'monthly';
    let discountCode: string | undefined;
    let successUrl = process.env.MOBILE_PADDLE_SUCCESS_URL || 'flinote://payment-status?status=success';
    let cancelUrl = process.env.MOBILE_PADDLE_CANCEL_URL || 'flinote://payment-status?status=canceled';

    try {
      const body = await request.json();
      if (body.billingInterval === 'yearly') {
        billingInterval = 'yearly';
      }
      if (body.discountCode && typeof body.discountCode === 'string') {
        discountCode = body.discountCode.trim();
      }
      if (body.successUrl && typeof body.successUrl === 'string') {
        successUrl = body.successUrl;
      }
      if (body.cancelUrl && typeof body.cancelUrl === 'string') {
        cancelUrl = body.cancelUrl;
      }
    } catch {
      // Defaults are fine when body is empty
    }

    if (!isAllowedRedirectUrl(successUrl) || !isAllowedRedirectUrl(cancelUrl)) {
      return NextResponse.json({ error: 'Invalid success or cancel URL' }, { status: 400 });
    }

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    const checkoutData = await PaymentService.getCheckoutData({
      userId,
      userEmail: session.user.email,
      userName: session.user.name || session.user.email.split('@')[0],
      billingInterval,
      discountCode,
    });

    const token = createMobileCheckoutToken({
      priceId: checkoutData.priceId,
      customerEmail: checkoutData.customerEmail,
      customData: checkoutData.customData,
      environment: checkoutData.environment,
      clientToken: checkoutData.clientToken,
      discountCode: checkoutData.discountCode,
      successUrl,
      cancelUrl,
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const checkoutUrl = `${baseUrl}/mobile-checkout?token=${encodeURIComponent(token)}`;

    return NextResponse.json({
      success: true,
      data: {
        checkoutUrl,
      },
    });
  } catch (error: any) {
    console.error('Error creating mobile checkout URL:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create mobile checkout URL' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const payload = verifyMobileCheckoutToken(token);
    return NextResponse.json({
      success: true,
      data: payload,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Invalid mobile checkout token' },
      { status: 400 }
    );
  }
}
