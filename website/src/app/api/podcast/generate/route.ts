import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { podcastService } from '@/lib/services/podcast-service';
import { ApiSuccessResponse, ApiErrorResponse } from '@/lib/types/api.types';
import { PodcastGenerationOptions, PodcastMode, QualityPreset, DurationScale } from '@/lib/types/podcast';
import { z } from 'zod';

// Validation schema for podcast generation request
const PodcastGenerationSchema = z.object({
  noteId: z.string().min(1, 'Note ID is required'),
  mode: z.enum(['CONVERSATION', 'BULLETIN']),
  voiceSettings: z.object({
    hostVoiceId: z.string().min(1, 'Host voice ID is required'),
    guestVoiceId: z.string().optional(),
  }),
  qualityPreset: z.enum(['STANDARD', 'HIGH', 'HIGHEST', 'ULTRA', 'ULTRA_LOSSLESS']),
  durationScale: z.enum(['SHORT', 'DEFAULT', 'LONG']),
  language: z.string().optional(),
  intro: z.string().max(1000, 'Intro text cannot exceed 1000 characters').optional(),
  outro: z.string().max(1000, 'Outro text cannot exceed 1000 characters').optional(),
});

// Additional validation for conversation mode
const validateConversationMode = (data: z.infer<typeof PodcastGenerationSchema>) => {
  if (data.mode === 'CONVERSATION' && !data.voiceSettings.guestVoiceId) {
    throw new Error('Guest voice ID is required for conversation mode');
  }
};

/**
 * POST /api/podcast/generate
 * Generate a new podcast from note content
 * Requirements: 1.3, 1.4, 6.1
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Authentication required',
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Invalid JSON in request body',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate request data
    let validatedData;
    try {
      validatedData = PodcastGenerationSchema.parse(requestBody);
      validateConversationMode(validatedData);
    } catch (validationError) {
      let errorMessage = 'Invalid request data';
      
      if (validationError instanceof z.ZodError) {
        const errors = validationError.issues.map((err: any) => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ');
        errorMessage = `Validation failed: ${errors}`;
      } else if (validationError instanceof Error) {
        errorMessage = validationError.message;
      }

      const errorResponse: ApiErrorResponse = {
        success: false,
        error: errorMessage,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Convert validated data to service options
    const generationOptions: PodcastGenerationOptions = {
      mode: validatedData.mode as PodcastMode,
      voiceSettings: {
        hostVoiceId: validatedData.voiceSettings.hostVoiceId,
        guestVoiceId: validatedData.voiceSettings.guestVoiceId,
      },
      qualityPreset: validatedData.qualityPreset as QualityPreset,
      durationScale: validatedData.durationScale as DurationScale,
      language: validatedData.language,
      intro: validatedData.intro,
      outro: validatedData.outro,
    };

    // Generate podcast using service
    const service = podcastService.getInstance();
    const result = await service.generatePodcast(
      validatedData.noteId,
      generationOptions,
      userId
    );

    // Handle service response
    if (!result.success) {
      let statusCode = 500;
      
      // Map error codes to appropriate HTTP status codes
      switch (result.code) {
        case 'NOTE_NOT_FOUND':
          statusCode = 404;
          break;
        case 'UNAUTHORIZED':
          statusCode = 403;
          break;
        case 'EMPTY_CONTENT':
        case 'INVALID_OPTIONS':
          statusCode = 400;
          break;
        case 'ELEVENLABS_ERROR':
          statusCode = 502; // Bad Gateway - external service error
          break;
        default:
          statusCode = 500;
      }

      const errorResponse: ApiErrorResponse = {
        success: false,
        error: result.error || 'Failed to generate podcast',
        message: result.error,
      };
      return NextResponse.json(errorResponse, { status: statusCode });
    }

    // Return success response
    const successResponse: ApiSuccessResponse = {
      success: true,
      data: {
        podcast: result.podcast,
        message: 'Podcast generation started successfully',
      },
    };
    return NextResponse.json(successResponse, { status: 201 });

  } catch (error) {
    console.error('Error in podcast generation API:', error);
    
    // Handle different types of errors
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for specific error types
      if (error.message.includes('Database')) {
        statusCode = 503; // Service Unavailable
        errorMessage = 'Database service is currently unavailable';
      } else if (error.message.includes('ElevenLabs')) {
        statusCode = 502; // Bad Gateway
        errorMessage = 'External podcast generation service is unavailable';
      } else if (error.message.includes('Authentication')) {
        statusCode = 401;
      } else if (error.message.includes('Authorization') || error.message.includes('permission')) {
        statusCode = 403;
      }
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Failed to generate podcast',
      message: errorMessage,
    };
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

/**
 * GET /api/podcast/generate
 * Get information about podcast generation capabilities
 * This endpoint provides metadata about available options
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Authentication required',
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // Return available options and configuration
    const generationInfo = {
      modes: [
        {
          value: 'CONVERSATION',
          label: 'Conversation',
          description: 'Two-person conversation format with host and guest',
          requiresGuestVoice: true,
        },
        {
          value: 'BULLETIN',
          label: 'Bulletin',
          description: 'Single-host news bulletin format',
          requiresGuestVoice: false,
        },
      ],
      qualityPresets: [
        {
          value: 'STANDARD',
          label: 'Standard',
          description: 'Good quality, faster generation',
        },
        {
          value: 'HIGH',
          label: 'High',
          description: 'Better quality, moderate generation time',
        },
        {
          value: 'HIGHEST',
          label: 'Highest',
          description: 'Best quality, slower generation',
        },
        {
          value: 'ULTRA',
          label: 'Ultra',
          description: 'Ultra-high quality, longest generation time',
        },
        {
          value: 'ULTRA_LOSSLESS',
          label: 'Ultra Lossless',
          description: 'Lossless quality, maximum generation time',
        },
      ],
      durationScales: [
        {
          value: 'SHORT',
          label: 'Short',
          description: 'Concise podcast, shorter duration',
        },
        {
          value: 'DEFAULT',
          label: 'Default',
          description: 'Standard podcast length',
        },
        {
          value: 'LONG',
          label: 'Long',
          description: 'Extended podcast, longer duration',
        },
      ],
      limits: {
        maxIntroLength: 1000,
        maxOutroLength: 1000,
        maxContentLength: 50000,
      },
      supportedLanguages: [
        'en', 'es', 'fr', 'de', 'it', 'pt', 'pl', 'tr', 'ru', 'nl', 'cs', 'ar', 'zh', 'ja', 'hu', 'ko'
      ],
    };

    const successResponse: ApiSuccessResponse = {
      success: true,
      data: generationInfo,
    };
    return NextResponse.json(successResponse);

  } catch (error) {
    console.error('Error getting podcast generation info:', error);
    
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Failed to get podcast generation information',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}