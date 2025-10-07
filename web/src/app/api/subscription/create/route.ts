// API endpoint to create a new subscription and get payment link

import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { SubscriptionService } from '@/lib/subscription-service';
import { DodoSubscriptionService } from '@/lib/utils/dodo/subscription';

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user already has an active subscription
    const existingSubscription = await SubscriptionService.getUserSubscription(userId);
    
    if (existingSubscription && existingSubscription.status === 'ACTIVE') {
      return NextResponse.json(
        { 
          error: 'You already have an active subscription',
          subscription: existingSubscription,
        },
        { status: 400 }
      );
    }

    // Get user details from Clerk
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Get product ID from environment
    const productId = process.env.DODO_PRODUCT_ID;
    if (!productId) {
      throw new Error('DODO_PRODUCT_ID not configured');
    }

    // Create subscription with Dodo using simple billing address
    const dodoSubscription = await DodoSubscriptionService.createSubscription({
      userId,
      userEmail: email,
      userName: user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}`
        : email.split('@')[0],
      billingAddress: {
        city: 'Default City',
        country: 'US',
        state: 'CA',
        street: 'Default Street',
        zipcode: '00000',
      },
      trialDays: 7, // 7-day trial
    });

    if (!dodoSubscription.success || !dodoSubscription.subscriptionId) {
      throw new Error(dodoSubscription.error || 'Failed to create subscription with Dodo');
    }

    // Create subscription record in database
    const subscription = await SubscriptionService.createSubscription({
      userId,
      dodoSubscriptionId: dodoSubscription.subscriptionId,
      productId,
      status: 'PENDING', // Will be updated via webhook
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
      },
      paymentLink: dodoSubscription.paymentLink,
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