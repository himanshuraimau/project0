// Test endpoint to verify Dodo Payments connection

import { NextResponse } from 'next/server';
import { getDodoClient } from '@/lib/utils/dodo/client';
import { DODO_CONFIG } from '@/lib/utils/dodo/constants';

export async function GET() {
  try {
    console.log('Testing Dodo Payments connection...');
    console.log('Environment:', DODO_CONFIG.environment);
    console.log('API Key prefix:', DODO_CONFIG.apiKey?.substring(0, 15) + '...');
    console.log('Product ID:', DODO_CONFIG.subscriptionProductId);
    console.log('Base URL:', DODO_CONFIG.baseUrl);

    const client = getDodoClient();

    // Try to list subscriptions (should work even if empty)
    const subscriptions = await client.subscriptions.list({ page_size: 1 });

    return NextResponse.json({
      success: true,
      message: 'Dodo Payments connection successful!',
      config: {
        environment: DODO_CONFIG.environment,
        hasApiKey: !!DODO_CONFIG.apiKey,
        productId: DODO_CONFIG.subscriptionProductId,
        baseUrl: DODO_CONFIG.baseUrl,
      },
      testResult: 'API connection successful',
    });
  } catch (error) {
    console.error('Dodo connection test failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error && typeof error === 'object' ? {
          status: (error as any).status,
          message: (error as any).message,
        } : null,
      },
      { status: 500 }
    );
  }
}
