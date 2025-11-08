import { NextRequest, NextResponse } from 'next/server';
import { webhookService } from '@/lib/services/webhook-service';
import { ApiSuccessResponse, ApiErrorResponse } from '@/lib/types/api.types';

/**
 * POST /api/podcast/webhook
 * Receive ElevenLabs webhook notifications for podcast generation status updates
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    let rawBody: string;
    try {
      rawBody = await request.text();
    } catch (error) {
      console.error('Error reading webhook request body:', error);
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Failed to read request body',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Get webhook signature from headers
    const signature = request.headers.get('x-elevenlabs-signature') || 
                     request.headers.get('x-signature') || 
                     request.headers.get('signature') || '';

    if (!signature) {
      console.error('No webhook signature provided');
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Missing webhook signature',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Extract headers for additional context
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Process webhook using webhook service
    const service = webhookService.getInstance();
    const result = await service.handleWebhook(rawBody, signature, headers);

    // Handle processing result
    if (!result.success) {
      let statusCode = 400;
      
      // Map error codes to appropriate HTTP status codes
      switch (result.error) {
        case 'INVALID_SIGNATURE':
          statusCode = 401; // Unauthorized
          break;
        case 'INVALID_JSON':
        case 'MISSING_FIELDS':
          statusCode = 400; // Bad Request
          break;
        case 'UNKNOWN_EVENT_TYPE':
          statusCode = 422; // Unprocessable Entity
          break;
        case 'PODCAST_NOT_FOUND':
          statusCode = 404; // Not Found
          break;
        default:
          statusCode = 500; // Internal Server Error
      }

      const errorResponse: ApiErrorResponse = {
        success: false,
        error: result.message,
        message: result.error,
      };
      return NextResponse.json(errorResponse, { status: statusCode });
    }

    // Return success response
    const successResponse: ApiSuccessResponse = {
      success: true,
      data: {
        message: result.message,
        processed: result.processed,
      },
    };

    // Return 200 for successful processing, 202 for duplicate (already processed)
    const statusCode = result.processed ? 200 : 202;
    return NextResponse.json(successResponse, { status: statusCode });

  } catch (error) {
    console.error('Error processing webhook:', error);
    
    // Handle different types of errors
    let errorMessage = 'Internal server error processing webhook';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for specific error types
      if (error.message.includes('Database')) {
        statusCode = 503; // Service Unavailable
        errorMessage = 'Database service is currently unavailable';
      } else if (error.message.includes('timeout')) {
        statusCode = 504; // Gateway Timeout
        errorMessage = 'Request timeout while processing webhook';
      }
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Failed to process webhook',
      message: errorMessage,
    };
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

/**
 * GET /api/podcast/webhook
 * Get webhook configuration and status information
 * This endpoint is useful for debugging and health checks
 */
export async function GET(request: NextRequest) {
  try {
    const service = webhookService.getInstance();
    
    // Get configuration status
    const configStatus = service.getConfigurationStatus();
    const processingStats = service.getProcessingStats();
    
    // Check if webhook service is properly configured
    if (!configStatus.configured) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Webhook service is not properly configured',
        message: 'Missing required environment variables',
      };
      return NextResponse.json(errorResponse, { status: 503 });
    }

    // Return webhook status information
    const webhookInfo = {
      configured: configStatus.configured,
      webhookSecret: configStatus.webhookSecret,
      processingStats: {
        totalProcessed: processingStats.totalProcessed,
        cacheSize: processingStats.cacheSize,
        oldestEntry: processingStats.oldestEntry ? new Date(processingStats.oldestEntry).toISOString() : null,
      },
      supportedEvents: [
        'generation_started',
        'generation_completed', 
        'generation_failed'
      ],
      endpoint: '/api/podcast/webhook',
      method: 'POST',
      requiredHeaders: [
        'x-elevenlabs-signature',
        'content-type: application/json'
      ],
    };

    const successResponse: ApiSuccessResponse = {
      success: true,
      data: webhookInfo,
    };
    return NextResponse.json(successResponse);

  } catch (error) {
    console.error('Error getting webhook status:', error);
    
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Failed to get webhook status',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * OPTIONS /api/podcast/webhook
 * Handle preflight requests for CORS
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-elevenlabs-signature, x-signature, signature',
      'Access-Control-Max-Age': '86400',
    },
  });
}