// API endpoint to create a new subscription and get payment link

import { NextResponse, NextRequest } from 'next/server';
import { SubscriptionService } from '@/lib/subscription-service';
import { UserService } from '@/lib/user-service';
import { DodoSubscriptionService, type BillingInterval } from '@/lib/payments/dodo';
import { getUserFromAuth } from '@/lib/auth-helper';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromAuth(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body for billing interval
    let billingInterval: BillingInterval = 'monthly';
    try {
      const body = await request.json();
      if (body.billingInterval === 'yearly') {
        billingInterval = 'yearly';
      }
    } catch {
      // No body or invalid JSON - default to monthly
    }

    // Check if user already has a subscription (sync with Dodo to reconcile)
    const existingSubscription = await SubscriptionService.getSubscriptionWithSync(userId);

    if (existingSubscription) {
      if (existingSubscription.status === 'ACTIVE') {
        return NextResponse.json(
          {
            error: 'You already have an active subscription',
            subscription: existingSubscription,
          },
          { status: 400 }
        );
      }

      // If user has a PENDING subscription, cancel it first
      if (existingSubscription.status === 'PENDING') {
        console.log('User has pending subscription, cancelling it first...');
        try {
          await DodoSubscriptionService.cancelSubscription(
            existingSubscription.dodoSubscriptionId,
            false
          );
          await SubscriptionService.deleteSubscription(userId);
        } catch (error) {
          console.error('Error cancelling pending subscription:', error);
          // Continue anyway - we'll try to create a new one
        }
      }
    }

    // Get user details from Better Auth session
    const session = await auth.api.getSession({
      headers: await headers()
    });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const email = session.user.email;
    if (!email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Get product ID from environment based on billing interval
    const productId = billingInterval === 'yearly'
      ? process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_PRO_SUBSCRIPTION_YEARLY
      : process.env.NEXT_PUBLIC_DODO_PAYMENT_SUBSCRIPTION_ID;
    
    if (!productId) {
      const envVar = billingInterval === 'yearly'
        ? 'NEXT_PUBLIC_DODO_PRODUCT_ID_PRO_SUBSCRIPTION_YEARLY'
        : 'NEXT_PUBLIC_DODO_PAYMENT_SUBSCRIPTION_ID';
      throw new Error(`${envVar} not configured`);
    }

    // Create subscription with Dodo using simple billing address
    const dodoSubscription = await DodoSubscriptionService.createSubscription({
      userId,
      userEmail: email,
      userName: session.user.name || email.split('@')[0],
      billingAddress: {
        city: 'Default City',
        country: 'US',
        state: 'CA',
        street: 'Default Street',
        zipcode: '00000',
      },
      billingInterval,
      // No trial - matches Dodo product configuration
    });

    if (!dodoSubscription.success || !dodoSubscription.subscriptionId) {
      throw new Error(dodoSubscription.error || 'Failed to create subscription with Dodo');
    }

    // Ensure the user exists in our database (avoid FK constraint issues)
    await UserService.getOrCreateUser(userId, email);

    // Create subscription record in database
    // Store payment link in metadata for later retrieval
    const subscription = await SubscriptionService.createSubscription({
      userId,
      dodoSubscriptionId: dodoSubscription.subscriptionId,
      productId,
      status: 'PENDING', // Will be updated via webhook
      metadata: {
        paymentLink: dodoSubscription.paymentLink,
        createdAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        checkoutUrl: dodoSubscription.paymentLink,
        sessionId: dodoSubscription.subscriptionId,
        subscription: {
          id: subscription.id,
          status: subscription.status,
        },
      },
      message: 'Subscription created successfully. Please complete payment.',
    });
  } catch (error: any) {
    console.error('Error creating subscription:', error);

    // Handle specific error cases
    if (error.message?.includes('already exists')) {
      return NextResponse.json(
        { error: 'A subscription already exists for this user' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    );
  }
}