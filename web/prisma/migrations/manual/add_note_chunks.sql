-- CreateExtension
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "note_chunks" (
    "id" SERIAL NOT NULL,
    "noteId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "chunkText" TEXT NOT NULL,
    "metadata" JSONB DEFAULT '{}',
    "embedding" vector(3072),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "note_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "note_chunks_noteId_chunkIndex_key" ON "note_chunks"("noteId", "chunkIndex");

-- CreateIndex
CREATE INDEX "note_chunks_noteId_idx" ON "note_chunks"("noteId");

-- CreateIndex
CREATE INDEX "note_chunks_embedding_idx" ON "note_chunks" USING GiST ("embedding");

-- AddForeignKey
ALTER TABLE "note_chunks" ADD CONSTRAINT "note_chunks_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
