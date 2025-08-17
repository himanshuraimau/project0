import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { UserService } from '@/lib/user-service'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await UserService.getOrCreateUser(userId)
    
    return NextResponse.json({
      success: true,
      credits: user.creditBalance
    })
  } catch (error) {
    console.error('Error fetching user credits:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { action, credits = 1, resourceId } = await request.json()

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    // Check if user has enough credits
    const hasEnough = await UserService.hasEnoughCredits(credits)
    if (!hasEnough) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 402 } // Payment Required
      )
    }

    // Deduct credits
    const updatedUser = await UserService.deductCredits(action, credits, resourceId)
    
    return NextResponse.json({
      success: true,
      creditsRemaining: updatedUser.creditBalance,
      creditsDeducted: credits
    })
  } catch (error) {
    console.error('Error deducting credits:', error)
    
    if (error instanceof Error && error.message === 'Insufficient credits') {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 402 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to deduct credits' },
      { status: 500 }
    )
  }
}
