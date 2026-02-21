import { NextResponse, NextRequest } from 'next/server';
import { PaymentService, type PaymentRegion } from '@/lib/payments';
import { getUserFromAuth } from '@/lib/auth-helper';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import type { BillingInterval } from '@/lib/payments';

// Valid payment regions
const VALID_REGIONS: PaymentRegion[] = ['IN', 'US', 'EU', 'DEFAULT'];

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromAuth(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let billingInterval: BillingInterval = 'monthly';
    let discountCode: string | undefined;
    let region: PaymentRegion | undefined;
    let phoneNumber: string | undefined;
    let zipcode: string | undefined;

    try {
      const body = await request.json();
      if (body.billingInterval === 'yearly') {
        billingInterval = 'yearly';
      }
      if (body.discountCode && typeof body.discountCode === 'string') {
        discountCode = body.discountCode.trim();
      }
      // Parse regional payment options
      if (body.region && VALID_REGIONS.includes(body.region)) {
        region = body.region;
      }
      if (body.phoneNumber && typeof body.phoneNumber === 'string') {
        phoneNumber = body.phoneNumber.trim();
      }
      if (body.zipcode && typeof body.zipcode === 'string') {
        zipcode = body.zipcode.trim();
      }
    } catch {
      // Default to monthly if no body
    }

    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const email = session.user.email;
    if (!email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    const result = await PaymentService.createSubscription({
      userId,
      userEmail: email,
      userName: session.user.name || email.split('@')[0],
      billingInterval,
      discountCode,
      region,
      phoneNumber,
      zipcode,
    });

    return NextResponse.json({
      success: true,
      data: {
        checkoutUrl: result.checkoutUrl,
        sessionId: result.sessionId,
      },
      message: region === 'IN' 
        ? 'Redirecting to checkout. UPI and Google Pay available for India.' 
        : 'Redirecting to checkout to complete payment.',
    });
  } catch (error: any) {
    console.error('Error creating subscription:', error);

    if (error.message?.includes('already')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: error.message || 'Failed to create subscription' }, { status: 500 });
  }
}
