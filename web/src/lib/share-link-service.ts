import { prisma } from '@/lib/prisma';
import { TokenGenerator } from '@/lib/utils/token-generator';
import { SubscriptionService } from '@/lib/subscription-service';

export class ShareLinkService {
  /**
   * Create a shareable link for a note
   */
  static async createShareLink(noteId: string, userId: string, expiresAt?: Date) {
    // Verify user owns the note
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      select: { id: true, userId: true, title: true },
    });

    if (!note) {
      throw new Error('Note not found');
    }

    if (note.userId !== userId) {
      throw new Error('You do not have permission to share this note');
    }

    // Check subscription
    const hasSubscription = await SubscriptionService.hasActiveSubscription(userId);
    if (!hasSubscription) {
      throw new Error('Active subscription required to share notes');
    }

    // Check if link already exists
    const existingLink = await prisma.sharedLink.findFirst({
      where: { noteId, isActive: true },
    });

    if (existingLink) {
      return existingLink;
    }

    // Create new share link
    const token = TokenGenerator.generateShareToken();
    
    return await prisma.sharedLink.create({
      data: {
        noteId,
        token,
        createdBy: userId,
        expiresAt,
      },
    });
  }

  /**
   * Get share link by token
   */
  static async getShareLinkByToken(token: string) {
    if (!TokenGenerator.isValidToken(token)) {
      throw new Error('Invalid share token format');
    }

    const shareLink = await prisma.sharedLink.findUnique({
      where: { token },
      include: {
        note: {
          include: {
            transcript: {
              select: {
                id: true,
                originalName: true,
                type: true,
              },
            },
            quiz: true,
            mindmap: true,
            flashcard: true,
            podcasts: true,
          },
        },
      },
    });

    if (!shareLink) {
      throw new Error('Share link not found');
    }

    if (!shareLink.isActive) {
      throw new Error('This share link has been deactivated');
    }

    // Check expiry
    if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
      throw new Error('This share link has expired');
    }

    // Increment view count (non-blocking)
    prisma.sharedLink.update({
      where: { id: shareLink.id },
      data: { viewCount: { increment: 1 } },
    }).catch(err => console.error('Failed to increment view count:', err));

    return shareLink;
  }

  /**
   * Revoke/deactivate a share link
   */
  static async revokeShareLink(linkId: string, userId: string) {
    const shareLink = await prisma.sharedLink.findUnique({
      where: { id: linkId },
    });

    if (!shareLink) {
      throw new Error('Share link not found');
    }

    if (shareLink.createdBy !== userId) {
      throw new Error('You do not have permission to revoke this link');
    }

    return await prisma.sharedLink.update({
      where: { id: linkId },
      data: { isActive: false },
    });
  }

  /**
   * Get all share links for a note
   */
  static async getShareLinksForNote(noteId: string, userId: string) {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      select: { userId: true },
    });

    if (!note || note.userId !== userId) {
      throw new Error('Access denied');
    }

    return await prisma.sharedLink.findMany({
      where: { noteId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
