-- CreateTable
CREATE TABLE "public"."user_course_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_course_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_course_progress_userId_idx" ON "public"."user_course_progress"("userId");

-- CreateIndex
CREATE INDEX "user_course_progress_courseId_idx" ON "public"."user_course_progress"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "user_course_progress_userId_courseId_key" ON "public"."user_course_progress"("userId", "courseId");

-- AddForeignKey
ALTER TABLE "public"."user_course_progress" ADD CONSTRAINT "user_course_progress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
