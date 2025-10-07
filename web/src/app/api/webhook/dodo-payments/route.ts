import { NextResponse } from 'next/server'

// Old credit-based Dodo Payments webhook - DEPRECATED
// Credit system has been replaced with subscription-based access
// New webhook is at /api/webhook/dodo-subscription

export async function POST() {
  return NextResponse.json(
    { 
      error: 'Webhook endpoint deprecated',
      message: 'Credit-based payment system has been replaced. Please use /api/webhook/dodo-subscription for subscription webhooks.'
    },
    { status: 410 } // Gone
  )
}