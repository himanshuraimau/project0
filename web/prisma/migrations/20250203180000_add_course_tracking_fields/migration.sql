-- AlterTable
ALTER TABLE "users" ADD COLUMN     "coursesCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastCourseResetDate" TIMESTAMP(3);
