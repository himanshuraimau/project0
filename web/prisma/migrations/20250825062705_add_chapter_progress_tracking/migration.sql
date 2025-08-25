-- AlterTable
ALTER TABLE "public"."user_course_progress" ADD COLUMN     "completedChapters" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "completionPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalChapters" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."user_chapter_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_chapter_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_chapter_progress_userId_idx" ON "public"."user_chapter_progress"("userId");

-- CreateIndex
CREATE INDEX "user_chapter_progress_chapterId_idx" ON "public"."user_chapter_progress"("chapterId");

-- CreateIndex
CREATE UNIQUE INDEX "user_chapter_progress_userId_chapterId_key" ON "public"."user_chapter_progress"("userId", "chapterId");

-- AddForeignKey
ALTER TABLE "public"."user_chapter_progress" ADD CONSTRAINT "user_chapter_progress_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "public"."chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
