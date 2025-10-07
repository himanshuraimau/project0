import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

// Credit system has been replaced with subscription-based access
// This endpoint is deprecated - please use /api/subscription/status instead
export async function GET() {
  return NextResponse.json(
    { 
      error: 'Credit system deprecated',
      message: 'This endpoint has been replaced with subscription-based access. Please use /api/subscription/status instead.'
    },
    { status: 410 } // Gone
  )
}

export async function POST() {
  return NextResponse.json(
    { 
      error: 'Credit system deprecated',
      message: 'This endpoint has been replaced with subscription-based access. Features are now gated by subscription status.'
    },
    { status: 410 } // Gone
  )
}
