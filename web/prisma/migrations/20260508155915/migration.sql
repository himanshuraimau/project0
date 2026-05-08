-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "sourcesPerBatch" INTEGER,
ADD COLUMN     "sourcesPerMonth" INTEGER;

-- AlterTable
ALTER TABLE "transcripts" ADD COLUMN     "batchId" TEXT,
ADD COLUMN     "errorCode" TEXT,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "folderId" TEXT,
ADD COLUMN     "keyTopics" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "progress" INTEGER DEFAULT 0,
ADD COLUMN     "rawInput" JSONB,
ADD COLUMN     "readyAt" TIMESTAMP(3),
ADD COLUMN     "sourceKind" TEXT,
ADD COLUMN     "stage" TEXT,
ADD COLUMN     "status" TEXT,
ADD COLUMN     "suggestedQuestions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "tokenCount" INTEGER,
ADD COLUMN     "uploadKey" TEXT,
ADD COLUMN     "wordCount" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "usedSourcesThisMonth" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "source_batches" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "folderId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "totalCount" INTEGER NOT NULL,
    "readyCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "source_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "source_batches_userId_createdAt_idx" ON "source_batches"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "source_batches_userId_status_idx" ON "source_batches"("userId", "status");

-- CreateIndex
CREATE INDEX "transcripts_batchId_idx" ON "transcripts"("batchId");

-- CreateIndex
CREATE INDEX "transcripts_userId_status_idx" ON "transcripts"("userId", "status");

-- CreateIndex
CREATE INDEX "transcripts_folderId_idx" ON "transcripts"("folderId");

-- AddForeignKey
ALTER TABLE "transcripts" ADD CONSTRAINT "transcripts_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "source_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
