import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { UserService } from '@/lib/services/user-service'

export async function DELETE() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log(`Starting account deletion process for user: ${userId}`)

    // Delete user from database using UserService (this deletes all related data)
    await UserService.deleteUser(userId)
    console.log(`Successfully deleted database records for user: ${userId}`)

    // Delete user from Clerk
    try {
      const client = await clerkClient()
      await client.users.deleteUser(userId)
      console.log(`Successfully deleted Clerk user: ${userId}`)
    } catch (clerkError) {
      console.error('Error deleting user from Clerk:', clerkError)
      // Don't throw here as database deletion was successful
      // The user might already be deleted from Clerk or there might be a temporary issue
    }

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