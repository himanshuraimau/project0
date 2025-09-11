/**
 * API endpoint for podcast generation progress tracking
 * Provides real-time progress updates for podcast generation
 * Requirements: 2.8, 4.1, 4.2, 4.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { PodcastApiErrorHandler } from '@/lib/utils/podcast-api-error-handler';
import { podcastProgressTracker } from '@/lib/utils/podcast-progress-tracker';

interface Params {
  id: string;
}

interface ProgressResponse {
  success: boolean;
  progress?: {
    podcastId: string;
    stage: string;
    progress: number;
    message: string;
    estimatedTimeRemaining?: number;
    startTime: number;
    lastUpdate: number;
    error?: string;
  };
  error?: string;
}

// GET /api/podcasts/[id]/progress - Get current progress for podcast generation
export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  return PodcastApiErrorHandler.withErrorHandling(async () => {
    const { userId } = await auth();
    const { id: podcastId } = await params;

    if (!userId) {
      return PodcastApiErrorHandler.createAuthErrorResponse();
    }

    // Verify podcast exists and user has access
    const podcast = await prisma.podcast.findUnique({
      where: { id: podcastId },
      select: {
        id: true,
        userId: true,
        generationStatus: true,
        generationError: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!podcast) {
      return PodcastApiErrorHandler.createNotFoundResponse('Podcast');
    }

    if (podcast.userId !== userId) {
      return PodcastApiErrorHandler.createErrorResponse(
        'You do not have permission to access this podcast',
        'authorization check',
        403
      );
    }

    // Get progress from tracker
    let progress = podcastProgressTracker.getProgress(podcastId);

    // If no progress in tracker, create from database status
    if (!progress) {
      const stage = mapDatabaseStatusToStage(podcast.generationStatus);
      const progressPercentage = calculateProgressFromStage(stage);
      
      progress = {
        podcastId,
        stage,
        progress: progressPercentage,
        message: getMessageForStage(stage),
        startTime: podcast.createdAt.getTime(),
        lastUpdate: podcast.updatedAt.getTime(),
        error: podcast.generationError || undefined
      };

      // Initialize tracker with current state
      if (stage !== 'completed' && stage !== 'failed') {
        podcastProgressTracker.updateProgress(podcastId, stage, 0);
      }
    }

    const response: ProgressResponse = {
      success: true,
      progress
    };

    return NextResponse.json(response);
  }, 'progress tracking');
}

// POST /api/podcasts/[id]/progress - Update progress (internal use)
export async function POST(request: NextRequest, { params }: { params: Promise<Params> }) {
  return PodcastApiErrorHandler.withErrorHandling(async () => {
    const { userId } = await auth();
    const { id: podcastId } = await params;

    if (!userId) {
      return PodcastApiErrorHandler.createAuthErrorResponse();
    }

    const body = await request.json();
    const { stage, stageProgress = 0, message } = body;

    // Verify podcast exists and user has access
    const podcast = await prisma.podcast.findUnique({
      where: { id: podcastId },
      select: { id: true, userId: true }
    });

    if (!podcast) {
      return PodcastApiErrorHandler.createNotFoundResponse('Podcast');
    }

    if (podcast.userId !== userId) {
      return PodcastApiErrorHandler.createErrorResponse(
        'You do not have permission to access this podcast',
        'authorization check',
        403
      );
    }

    // Update progress
    const updatedProgress = podcastProgressTracker.updateProgress(
      podcastId,
      stage,
      stageProgress,
      message
    );

    if (!updatedProgress) {
      return PodcastApiErrorHandler.createErrorResponse(
        'Failed to update progress',
        'progress update',
        500
      );
    }

    const response: ProgressResponse = {
      success: true,
      progress: updatedProgress
    };

    return NextResponse.json(response);
  }, 'progress update');
}

/**
 * Map database generation status to progress stage
 */
function mapDatabaseStatusToStage(status: string): string {
  switch (status) {
    case 'pending':
      return 'pending';
    case 'generating':
      return 'script_generation';
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    default:
      return 'pending';
  }
}

/**
 * Calculate progress percentage from stage
 */
function calculateProgressFromStage(stage: string): number {
  switch (stage) {
    case 'pending':
      return 0;
    case 'script_generation':
      return 20;
    case 'voice_synthesis':
      return 50;
    case 'audio_processing':
      return 75;
    case 'storage':
      return 90;
    case 'indexing':
      return 95;
    case 'completed':
      return 100;
    case 'failed':
      return 0;
    default:
      return 0;
  }
}

/**
 * Get user-friendly message for stage
 */
function getMessageForStage(stage: string): string {
  switch (stage) {
    case 'pending':
      return 'Initializing podcast generation...';
    case 'script_generation':
      return 'Creating conversational script from your notes...';
    case 'voice_synthesis':
      return 'Converting script to natural speech...';
    case 'audio_processing':
      return 'Combining and optimizing audio segments...';
    case 'storage':
      return 'Uploading and storing your podcast...';
    case 'indexing':
      return 'Preparing transcript for AI chat...';
    case 'completed':
      return 'Your podcast is ready!';
    case 'failed':
      return 'Generation failed';
    default:
      return 'Processing...';
  }
}