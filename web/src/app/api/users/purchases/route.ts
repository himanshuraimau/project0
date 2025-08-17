import { NextResponse } from 'next/server'
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

    const purchases = await UserService.getUserPurchases()
    const creditUsage = await UserService.getUserCreditUsage()
    
    return NextResponse.json({
      success: true,
      data: {
        purchases,
        creditUsage
      }
    })
  } catch (error) {
    console.error('Error fetching user purchases:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchase history' },
      { status: 500 }
    )
  }
}
