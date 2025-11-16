import { NextResponse } from 'next/server';

export async function GET() {
  console.log('📡 Health check endpoint called');
  
  return NextResponse.json({
    success: true,
    message: 'Backend is running and accessible',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
}