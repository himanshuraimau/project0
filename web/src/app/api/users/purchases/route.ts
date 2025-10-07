import { NextResponse } from 'next/server'

// Credit-based purchase history endpoint - DEPRECATED
// This endpoint has been replaced with subscription-based access
// Use /api/subscription/status for current subscription information

export async function GET() {
  return NextResponse.json(
    { 
      error: 'Endpoint deprecated',
      message: 'Credit-based purchase system has been replaced with subscription-based access. Please use /api/subscription/status for subscription information.'
    },
    { status: 410 } // Gone
  )
}
