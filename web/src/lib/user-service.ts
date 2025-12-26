import { prisma } from '@/lib/prisma'

// NOTE: Credit plans have been removed in favor of subscription-based access
// See subscription-service.ts for the new subscription implementation

export class UserService {
  /**
   * Get or create a user in our database
   */
  static async getOrCreateUser(userId: string, email: string = '') {
    try {
      let user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
      })

      if (!user) {
        user = await prisma.user.create({
          data: {
            id: userId,
            email: email || `user-${userId}@generated.local`
          },
          include: { subscription: true }
        })
        console.log(`Created new user in database: ${userId}`)
      }

      return user
    } catch (error) {
      console.error('Error getting or creating user:', error)
      throw new Error('Failed to get or create user')
    }
  }

  /**
   * Update user email
   */
  static async updateUserEmail(userId: string, email: string) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { email }
      })
      return user
    } catch (error) {
      console.error('Error updating user email:', error)
      throw new Error('Failed to update user email')
    }
  }

  /**
   * Delete user and all associated data
   */
  static async deleteUser(userId: string) {
    try {
      console.log(`Starting deletion process for user: ${userId}`)

      // First check if user exists in our database
      const existingUser = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!existingUser) {
        console.log(`User ${userId} not found in database, but proceeding to clean up any orphaned data`)
      } else {
        console.log(`Found user ${userId} in database, proceeding with full deletion`)
      }

      // Use a transaction with increased timeout to ensure all deletions happen atomically
      await prisma.$transaction(async (tx) => {
        // Delete in batches and optimize order to reduce foreign key constraint issues

        // 1. Delete progress records first (no foreign key dependencies)
        const [courseProgressCount, chapterProgressCount] = await Promise.all([
          tx.userCourseProgress.deleteMany({ where: { userId } }),
          tx.userChapterProgress.deleteMany({ where: { userId } })
        ])
        console.log(`Deleted progress records: ${courseProgressCount.count + chapterProgressCount.count}`)

        // 2. Delete subscription if exists
        const subscriptionCount = await tx.subscription.deleteMany({ where: { userId } })
        console.log(`Deleted subscriptions: ${subscriptionCount.count}`)

        // 3. Clean up podcast audio files before deleting podcasts
        // Note: Podcast audio files are managed by the microservice
        // No need to clean up audio files here

        // 4. Delete study materials that depend on notes (in parallel for efficiency)
        const [mindmapCount, quizCount, flashcardCount, podcastCount] = await Promise.all([
          tx.mindMap.deleteMany({ where: { userId } }),
          tx.quiz.deleteMany({ where: { userId } }),
          tx.flashcard.deleteMany({ where: { userId } }),
          tx.podcast.deleteMany({ where: { userId } })
        ])
        console.log(`Deleted study materials: ${mindmapCount.count + quizCount.count + flashcardCount.count + podcastCount.count}`)

        // 5. Delete notes (this will cascade to note chunks)
        const noteCount = await tx.note.deleteMany({
          where: { userId }
        })
        console.log(`Deleted notes: ${noteCount.count}`)

        // 6. Delete transcripts
        const transcriptCount = await tx.transcript.deleteMany({
          where: { userId }
        })
        console.log(`Deleted transcripts: ${transcriptCount.count}`)

        // 7. Delete courses (this will cascade to units, chapters, questions, etc.)
        const courseCount = await tx.course.deleteMany({
          where: { userId }
        })
        console.log(`Deleted courses: ${courseCount.count}`)

        // 8. Finally, delete the user if it exists
        if (existingUser) {
          await tx.user.delete({
            where: { id: userId }
          })
          console.log(`Deleted user: ${userId}`)
        }
      }, {
        timeout: 30000 // Increase timeout to 30 seconds
      })

      console.log(`Successfully deleted all data for user: ${userId}`)
    } catch (error) {
      console.error('Error deleting user:', error)
      if (error instanceof Error) {
        throw new Error(`Failed to delete user and associated data: ${error.message}`)
      }
      throw new Error('Failed to delete user and associated data')
    }
  }

  // NOTE: All credit-related methods have been removed in favor of subscription-based access
  // See subscription-service.ts and feature-gate-service.ts for the new implementation
}
