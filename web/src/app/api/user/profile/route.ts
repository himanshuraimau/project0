import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/user-service'
import { getUserFromAuth } from '@/lib/auth-helper'
import { prisma } from '@/lib/prisma'

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
          priceId: user.subscription.priceId,
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

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getUserFromAuth(request)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { image } = await request.json()

    if (typeof image !== 'string' || !image.startsWith('https://')) {
      return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { image },
      select: { id: true, image: true },
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Error updating profile image:', error)
    return NextResponse.json({ error: 'Failed to update profile image' }, { status: 500 })
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
          priceId: user.subscription.priceId,
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