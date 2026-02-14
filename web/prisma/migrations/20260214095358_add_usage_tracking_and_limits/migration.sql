-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "amount" INTEGER,
ADD COLUMN     "audioProcessingPerMonth" INTEGER,
ADD COLUMN     "coursesPerMonth" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "dodoDiscountId" TEXT,
ADD COLUMN     "notesPerMonth" INTEGER,
ADD COLUMN     "pdfProcessingPerMonth" INTEGER,
ADD COLUMN     "videoProcessingPerMonth" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lastUsageResetDate" TIMESTAMP(3),
ADD COLUMN     "usedAudioProcessingThisMonth" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "usedCoursesThisMonth" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "usedNotesThisMonth" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "usedPdfProcessingThisMonth" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "usedVideoProcessingThisMonth" INTEGER NOT NULL DEFAULT 0;
