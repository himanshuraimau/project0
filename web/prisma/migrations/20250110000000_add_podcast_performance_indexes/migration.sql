-- Add performance indexes for podcast queries

-- Index for podcast status filtering and sorting
CREATE INDEX IF NOT EXISTS "idx_podcasts_status_created" ON "podcasts"("generationStatus", "createdAt" DESC);

-- Index for language-based filtering
CREATE INDEX IF NOT EXISTS "idx_podcasts_language_updated" ON "podcasts"("language", "updatedAt" DESC);

-- Index for user podcasts with status
CREATE INDEX IF NOT EXISTS "idx_podcasts_user_status" ON "podcasts"("userId", "generationStatus");

-- Index for duration-based queries
CREATE INDEX IF NOT EXISTS "idx_podcasts_duration_preset" ON "podcasts"("durationPreset", "actualDuration");

-- Composite index for search optimization
CREATE INDEX IF NOT EXISTS "idx_podcasts_search" ON "podcasts"("title", "language", "generationStatus");

-- Index for segment content search (for full-text search)
CREATE INDEX IF NOT EXISTS "idx_podcast_segments_content" ON "podcast_segments" USING gin(to_tsvector('english', "content"));

-- Index for segment timing queries
CREATE INDEX IF NOT EXISTS "idx_podcast_segments_timing" ON "podcast_segments"("podcastId", "startTime", "endTime");

-- Index for note-based podcast queries
CREATE INDEX IF NOT EXISTS "idx_podcasts_note_status" ON "podcasts"("noteId", "generationStatus", "updatedAt" DESC);

-- Partial index for completed podcasts (most common query)
CREATE INDEX IF NOT EXISTS "idx_podcasts_completed" ON "podcasts"("userId", "updatedAt" DESC) WHERE "generationStatus" = 'completed';

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS "idx_podcasts_analytics" ON "podcasts"("createdAt", "language", "durationPreset") WHERE "generationStatus" = 'completed';