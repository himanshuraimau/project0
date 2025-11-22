import { prisma } from '@/lib/prisma';
import { ShareLinkService } from '@/lib/share-link-service';
import { SubscriptionService } from '@/lib/subscription-service';
import { indexNoteContent } from '@/lib/course/embedding-service';

export class NoteCloneService {
  /**
   * Clone a note to user's account
   */
  static async cloneNote(token: string, userId: string) {
    // Check if user can create more notes (free tier: 3 notes, subscription: unlimited)
    const { FeatureGateService } = await import('@/lib/feature-gate-service');
    const accessCheck = await FeatureGateService.canCreateNote(userId);
    
    if (!accessCheck.allowed) {
      if (accessCheck.reason === 'FREE_TIER_LIMIT_REACHED') {
        throw new Error(`You've reached the free tier limit of ${accessCheck.notesLimit} notes. Upgrade to Pro for unlimited notes.`);
      }
      throw new Error('Unable to save note to your account');
    }

    // Get share link and validate
    const shareLink = await ShareLinkService.getShareLinkByToken(token);
    const originalNote = shareLink.note;

    // Check if user already cloned this note
    const existingClone = await prisma.note.findFirst({
      where: {
        userId,
        sourceNoteId: originalNote.id,
        isCloned: true,
      },
    });

    if (existingClone) {
      return existingClone; // Return existing clone
    }

    // Get the original note with ALL related content
    const originalNoteWithContent = await prisma.note.findUnique({
      where: { id: originalNote.id },
      include: {
        quiz: true,
        mindmap: true,
        flashcard: true,
        podcasts: true,
      },
    });

    if (!originalNoteWithContent) {
      throw new Error('Note not found');
    }

    // Clone the note and all related content in a transaction
    const clonedNote = await prisma.$transaction(async (tx) => {
      // 1. Create the cloned note
      const newNote = await tx.note.create({
        data: {
          title: `${originalNote.title}`,
          content: originalNote.content,
          transcriptId: originalNote.transcriptId,
          userId,
          isCloned: true,
          sourceNoteId: originalNote.id,
          originalAuthor: shareLink.createdBy,
        },
      });

      // 2. Clone quiz if exists (1:1 relation)
      if (originalNoteWithContent.quiz) {
        await tx.quiz.create({
          data: {
            noteId: newNote.id,
            userId,
            content: originalNoteWithContent.quiz.content as any,
          },
        });
      }

      // 3. Clone mindmap if exists (1:1 relation)
      if (originalNoteWithContent.mindmap) {
        await tx.mindMap.create({
          data: {
            noteId: newNote.id,
            userId,
            title: originalNoteWithContent.mindmap.title,
            mermaidCode: originalNoteWithContent.mindmap.mermaidCode,
          },
        });
      }

      // 4. Clone flashcard if exists (1:1 relation)
      if (originalNoteWithContent.flashcard) {
        await tx.flashcard.create({
          data: {
            noteId: newNote.id,
            userId,
            content: originalNoteWithContent.flashcard.content as any,
          },
        });
      }

      // 5. Clone all podcasts (1:many relation)
      if (originalNoteWithContent.podcasts && originalNoteWithContent.podcasts.length > 0) {
        await tx.podcast.createMany({
          data: originalNoteWithContent.podcasts.map((podcast) => ({
            noteId: newNote.id,
            userId,
            title: podcast.title,
            description: podcast.description,
            audioUrl: podcast.audioUrl,
            audioFileKey: podcast.audioFileKey,
            duration: podcast.duration,
            fileSize: podcast.fileSize,
            mode: podcast.mode,
            hostVoiceId: podcast.hostVoiceId,
            guestVoiceId: podcast.guestVoiceId,
            qualityPreset: podcast.qualityPreset,
            durationScale: podcast.durationScale,
            language: podcast.language,
            intro: podcast.intro,
            outro: podcast.outro,
            status: podcast.status,
            metadata: podcast.metadata as any,
          })),
        });
      }

      return newNote;
    });

    // Index the cloned note (non-blocking)
    setTimeout(() => {
      indexNoteContent(clonedNote.id, clonedNote.content)
        .then(() => console.log(`Indexed cloned note: ${clonedNote.id}`))
        .catch(err => console.error(`Error indexing cloned note:`, err));
    }, 0);

    return clonedNote;
  }

  /**
   * Get all cloned notes for a user
   */
  static async getClonedNotes(userId: string) {
    return await prisma.note.findMany({
      where: {
        userId,
        isCloned: true,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        transcript: {
          select: {
            id: true,
            originalName: true,
            type: true,
            createdAt: true,
          },
        },
      },
    });
  }

  /**
   * Get original author info for a cloned note
   */
  static async getOriginalAuthorInfo(noteId: string) {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      select: {
        isCloned: true,
        originalAuthor: true,
        sourceNoteId: true,
      },
    });

    if (!note?.isCloned || !note.originalAuthor) {
      return null;
    }

    // Get author's public info from User table
    const author = await prisma.user.findUnique({
      where: { id: note.originalAuthor },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    return {
      authorId: note.originalAuthor,
      sourceNoteId: note.sourceNoteId,
      authorEmail: author?.email || 'Unknown User',
    };
  }
}
