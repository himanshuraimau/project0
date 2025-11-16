import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAuth } from '@/lib/auth-helper';
import { NoteCloneService } from '@/lib/note-clone-service';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromAuth(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Share token required' },
        { status: 400 }
      );
    }

    const clonedNote = await NoteCloneService.cloneNote(token, userId);

    return NextResponse.json({
      success: true,
      data: clonedNote,
      message: 'Note saved to your account',
    });
  } catch (error) {
    console.error('Error cloning note:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to clone note',
      },
      { status: error instanceof Error && error.message.includes('subscription') ? 403 : 500 }
    );
  }
}
