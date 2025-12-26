/*
  Warnings:

  - The values [IN_PROGRESS,SUPERSEDED] on the enum `PodcastStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `audioFileKey` on the `podcasts` table. All the data in the column will be lost.
  - You are about to drop the column `durationScale` on the `podcasts` table. All the data in the column will be lost.
  - You are about to drop the column `elevenLabsProjectId` on the `podcasts` table. All the data in the column will be lost.
  - You are about to drop the column `fileSize` on the `podcasts` table. All the data in the column will be lost.
  - You are about to drop the column `guestVoiceId` on the `podcasts` table. All the data in the column will be lost.
  - You are about to drop the column `hostVoiceId` on the `podcasts` table. All the data in the column will be lost.
  - You are about to drop the column `intro` on the `podcasts` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `podcasts` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `podcasts` table. All the data in the column will be lost.
  - You are about to drop the column `mode` on the `podcasts` table. All the data in the column will be lost.
  - You are about to drop the column `outro` on the `podcasts` table. All the data in the column will be lost.
  - You are about to drop the column `qualityPreset` on the `podcasts` table. All the data in the column will be lost.
  - The `emailVerified` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[jobId]` on the table `podcasts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[podcastId]` on the table `podcasts` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PodcastStatus_new" AS ENUM ('GENERATING', 'COMPLETED', 'FAILED');
ALTER TABLE "public"."podcasts" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "podcasts" ALTER COLUMN "status" TYPE "PodcastStatus_new" USING ("status"::text::"PodcastStatus_new");
ALTER TYPE "PodcastStatus" RENAME TO "PodcastStatus_old";
ALTER TYPE "PodcastStatus_new" RENAME TO "PodcastStatus";
DROP TYPE "public"."PodcastStatus_old";
ALTER TABLE "podcasts" ALTER COLUMN "status" SET DEFAULT 'GENERATING';
COMMIT;

-- DropIndex
DROP INDEX "podcasts_elevenLabsProjectId_idx";

-- DropIndex
DROP INDEX "podcasts_elevenLabsProjectId_key";

-- AlterTable
ALTER TABLE "podcasts" DROP COLUMN "audioFileKey",
DROP COLUMN "durationScale",
DROP COLUMN "elevenLabsProjectId",
DROP COLUMN "fileSize",
DROP COLUMN "guestVoiceId",
DROP COLUMN "hostVoiceId",
DROP COLUMN "intro",
DROP COLUMN "language",
DROP COLUMN "metadata",
DROP COLUMN "mode",
DROP COLUMN "outro",
DROP COLUMN "qualityPreset",
ADD COLUMN     "jobId" TEXT,
ADD COLUMN     "podcastId" TEXT,
ADD COLUMN     "transcript" JSONB;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "emailVerified",
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false;

-- DropEnum
DROP TYPE "DurationScale";

-- DropEnum
DROP TYPE "PodcastMode";

-- DropEnum
DROP TYPE "QualityPreset";

-- CreateIndex
CREATE UNIQUE INDEX "podcasts_jobId_key" ON "podcasts"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "podcasts_podcastId_key" ON "podcasts"("podcastId");

-- CreateIndex
CREATE INDEX "podcasts_jobId_idx" ON "podcasts"("jobId");

-- CreateIndex
CREATE INDEX "podcasts_podcastId_idx" ON "podcasts"("podcastId");
