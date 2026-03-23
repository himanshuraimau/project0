import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/user-service'
import { SubscriptionService } from '@/lib/subscription-service'
import { getUserFromAuth } from '@/lib/auth-helper'

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserFromAuth(request)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check subscription status before deletion
    const hasActiveSubscription = await SubscriptionService.hasActiveSubscription(userId)
    
    if (hasActiveSubscription) {
      return NextResponse.json(
        { error: 'Cannot delete account with active subscription. Please cancel your subscription first.' },
        { status: 400 }
      )
    }

    console.log(`Starting account deletion process for user: ${userId}`)

    // Delete user from database using UserService (this deletes all related data including Better Auth sessions)
    await UserService.deleteUser(userId)
    console.log(`Successfully deleted database records for user: ${userId}`)

    return NextResponse.json({
      success: true,
      message: 'User account and all associated data deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting user account:', error)
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}