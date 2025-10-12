/*
  Warnings:

  - You are about to drop the column `actualDuration` on the `podcasts` table. All the data in the column will be lost.
  - You are about to drop the column `customInstructions` on the `podcasts` table. All the data in the column will be lost.
  - You are about to drop the column `durationPreset` on the `podcasts` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedDuration` on the `podcasts` table. All the data in the column will be lost.
  - You are about to drop the column `generationError` on the `podcasts` table. All the data in the column will be lost.
  - You are about to drop the column `generationStatus` on the `podcasts` table. All the data in the column will be lost.
  - You are about to drop the column `host1VoiceId` on the `podcasts` table. All the data in the column will be lost.
  - You are about to drop the column `host1VoiceName` on the `podcasts` table. All the data in the column will be lost.
  - You are about to drop the column `host2VoiceId` on the `podcasts` table. All the data in the column will be lost.
  - You are about to drop the column `host2VoiceName` on the `podcasts` table. All the data in the column will be lost.
  - You are about to drop the column `transcriptData` on the `podcasts` table. All the data in the column will be lost.
  - You are about to drop the `podcast_segments` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[elevenLabsProjectId]` on the table `podcasts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `hostVoiceId` to the `podcasts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mode` to the `podcasts` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."PodcastMode" AS ENUM ('CONVERSATION', 'BULLETIN');

-- CreateEnum
CREATE TYPE "public"."PodcastStatus" AS ENUM ('GENERATING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "public"."QualityPreset" AS ENUM ('STANDARD', 'HIGH', 'HIGHEST', 'ULTRA', 'ULTRA_LOSSLESS');

-- CreateEnum
CREATE TYPE "public"."DurationScale" AS ENUM ('SHORT', 'DEFAULT', 'LONG');

-- DropForeignKey
ALTER TABLE "public"."podcast_segments" DROP CONSTRAINT "podcast_segments_podcastId_fkey";

-- DropIndex
DROP INDEX "public"."podcasts_noteId_key";

-- AlterTable
ALTER TABLE "public"."podcasts" DROP COLUMN "actualDuration",
DROP COLUMN "customInstructions",
DROP COLUMN "durationPreset",
DROP COLUMN "estimatedDuration",
DROP COLUMN "generationError",
DROP COLUMN "generationStatus",
DROP COLUMN "host1VoiceId",
DROP COLUMN "host1VoiceName",
DROP COLUMN "host2VoiceId",
DROP COLUMN "host2VoiceName",
DROP COLUMN "transcriptData",
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "durationScale" "public"."DurationScale" NOT NULL DEFAULT 'DEFAULT',
ADD COLUMN     "elevenLabsProjectId" TEXT,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "guestVoiceId" TEXT,
ADD COLUMN     "hostVoiceId" TEXT NOT NULL,
ADD COLUMN     "intro" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "mode" "public"."PodcastMode" NOT NULL,
ADD COLUMN     "outro" TEXT,
ADD COLUMN     "progress" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "qualityPreset" "public"."QualityPreset" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "status" "public"."PodcastStatus" NOT NULL DEFAULT 'GENERATING',
ALTER COLUMN "language" DROP NOT NULL,
ALTER COLUMN "language" DROP DEFAULT;

-- DropTable
DROP TABLE "public"."podcast_segments";

-- CreateIndex
CREATE UNIQUE INDEX "podcasts_elevenLabsProjectId_key" ON "public"."podcasts"("elevenLabsProjectId");

-- CreateIndex
CREATE INDEX "podcasts_status_idx" ON "public"."podcasts"("status");

-- CreateIndex
CREATE INDEX "podcasts_elevenLabsProjectId_idx" ON "public"."podcasts"("elevenLabsProjectId");
