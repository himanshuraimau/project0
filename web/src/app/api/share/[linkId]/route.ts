import { NextRequest, NextResponse } from 'next/server';
import { ShareLinkService } from '@/lib/share-link-service';
import { clerkClient } from '@clerk/nextjs/server';

interface Params {
  linkId: string;
}

// Public endpoint - no auth required
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token required' },
        { status: 400 }
      );
    }

    const shareLink = await ShareLinkService.getShareLinkByToken(token);
    
    // Get author's public info
    const clerk = await clerkClient();
    let authorName = 'Anonymous';
    try {
      const user = await clerk.users.getUser(shareLink.createdBy);
      authorName = user.firstName || user.username || 'Anonymous';
    } catch (err) {
      console.warn('Could not fetch author info:', err);
    }

    return NextResponse.json({
      success: true,
      data: {
        note: {
          id: shareLink.note.id,
          title: shareLink.note.title,
          content: shareLink.note.content,
          createdAt: shareLink.note.createdAt,
        },
        // Include all related content for preview
        quiz: shareLink.note.quiz || null,
        mindmap: shareLink.note.mindmap || null,
        flashcard: shareLink.note.flashcard || null,
        podcasts: shareLink.note.podcasts || [],
        author: {
          name: authorName,
          userId: shareLink.createdBy,
        },
        shareInfo: {
          viewCount: shareLink.viewCount,
          createdAt: shareLink.createdAt,
          expiresAt: shareLink.expiresAt,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching shared note:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch shared note',
      },
      { status: 404 }
    );
  }
}
