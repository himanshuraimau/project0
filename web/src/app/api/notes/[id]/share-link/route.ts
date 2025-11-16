import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAuth } from '@/lib/auth-helper';
import { ShareLinkService } from '@/lib/share-link-service';

interface Params {
  id: string;
}

// POST - Create a new share link
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const userId = await getUserFromAuth(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: noteId } = await params;
    const body = await request.json().catch(() => ({}));
    const { expiresAt } = body;

    const shareLink = await ShareLinkService.createShareLink(
      noteId,
      userId,
      expiresAt ? new Date(expiresAt) : undefined
    );

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${shareLink.id}?token=${shareLink.token}`;

    return NextResponse.json({
      success: true,
      data: {
        ...shareLink,
        shareUrl,
      },
    });
  } catch (error) {
    console.error('Error creating share link:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create share link',
      },
      { status: error instanceof Error && error.message.includes('subscription') ? 403 : 500 }
    );
  }
}

// GET - Get all share links for a note
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const userId = await getUserFromAuth(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: noteId } = await params;
    const shareLinks = await ShareLinkService.getShareLinksForNote(noteId, userId);

    return NextResponse.json({
      success: true,
      data: shareLinks,
    });
  } catch (error) {
    console.error('Error fetching share links:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch share links',
      },
      { status: 500 }
    );
  }
}

// DELETE - Revoke a share link
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const userId = await getUserFromAuth(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get('linkId');

    if (!linkId) {
      return NextResponse.json(
        { error: 'Link ID required' },
        { status: 400 }
      );
    }

    await ShareLinkService.revokeShareLink(linkId, userId);

    return NextResponse.json({
      success: true,
      message: 'Share link revoked',
    });
  } catch (error) {
    console.error('Error revoking share link:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to revoke share link',
      },
      { status: 500 }
    );
  }
}
