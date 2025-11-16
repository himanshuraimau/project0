import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAuth } from '@/lib/auth-helper';
import { NoteCloneService } from '@/lib/note-clone-service';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromAuth(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const clonedNotes = await NoteCloneService.getClonedNotes(userId);

    return NextResponse.json({
      success: true,
      data: clonedNotes,
    });
  } catch (error) {
    console.error('Error fetching cloned notes:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch cloned notes',
      },
      { status: 500 }
    );
  }
}
