import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/user-service'
import { getUserFromAuth } from '@/lib/auth-helper'

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromAuth(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get or create user (this will create if doesn't exist)
    const user = await UserService.getOrCreateUser(userId)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        hasSubscription: !!user.subscription,
        subscription: user.subscription ? {
          status: user.subscription.status,
          productId: user.subscription.productId,
          currentPeriodStart: user.subscription.currentPeriodStart,
          currentPeriodEnd: user.subscription.currentPeriodEnd,
          nextBillingDate: user.subscription.nextBillingDate,
          cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
          cancelledAt: user.subscription.cancelledAt,
          trialEnd: user.subscription.trialEnd,
        } : null
      }
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromAuth(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { email } = await request.json()

    // Force create/update user with email
    const user = await UserService.getOrCreateUser(userId, email)

    return NextResponse.json({
      success: true,
      message: 'User profile created/updated successfully',
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        hasSubscription: !!user.subscription,
        subscription: user.subscription ? {
          status: user.subscription.status,
          productId: user.subscription.productId,
          currentPeriodStart: user.subscription.currentPeriodStart,
          currentPeriodEnd: user.subscription.currentPeriodEnd,
          nextBillingDate: user.subscription.nextBillingDate,
          cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
          cancelledAt: user.subscription.cancelledAt,
          trialEnd: user.subscription.trialEnd,
        } : null
      }
    })
  } catch (error) {
    console.error('Error creating/updating user profile:', error)
    return NextResponse.json(
      { error: 'Failed to create/update user profile' },
      { status: 500 }
    )
  }
}