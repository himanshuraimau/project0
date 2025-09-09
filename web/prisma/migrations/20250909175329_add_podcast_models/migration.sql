-- CreateTable
CREATE TABLE "public"."podcasts" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "durationPreset" TEXT NOT NULL,
    "estimatedDuration" INTEGER,
    "actualDuration" INTEGER,
    "host1VoiceId" TEXT NOT NULL,
    "host1VoiceName" TEXT NOT NULL,
    "host2VoiceId" TEXT NOT NULL,
    "host2VoiceName" TEXT NOT NULL,
    "customInstructions" TEXT,
    "audioUrl" TEXT,
    "transcriptData" JSONB,
    "generationStatus" TEXT NOT NULL DEFAULT 'pending',
    "generationError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "podcasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."podcast_segments" (
    "id" SERIAL NOT NULL,
    "podcastId" TEXT NOT NULL,
    "speaker" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "startTime" DECIMAL(10,3),
    "endTime" DECIMAL(10,3),
    "audioUrl" TEXT,
    "sequenceOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "podcast_segments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "podcasts_noteId_key" ON "public"."podcasts"("noteId");

-- CreateIndex
CREATE INDEX "podcasts_noteId_idx" ON "public"."podcasts"("noteId");

-- CreateIndex
CREATE INDEX "podcasts_userId_idx" ON "public"."podcasts"("userId");

-- CreateIndex
CREATE INDEX "podcast_segments_podcastId_idx" ON "public"."podcast_segments"("podcastId");

-- CreateIndex
CREATE INDEX "podcast_segments_podcastId_sequenceOrder_idx" ON "public"."podcast_segments"("podcastId", "sequenceOrder");

-- AddForeignKey
ALTER TABLE "public"."podcasts" ADD CONSTRAINT "podcasts_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "public"."notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."podcast_segments" ADD CONSTRAINT "podcast_segments_podcastId_fkey" FOREIGN KEY ("podcastId") REFERENCES "public"."podcasts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
