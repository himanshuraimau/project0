-- AlterTable
ALTER TABLE "chapters" ADD COLUMN     "flashcards" JSONB,
ADD COLUMN     "transcript" TEXT;

-- CreateTable
CREATE TABLE "chapter_chunks" (
    "id" SERIAL NOT NULL,
    "chapter_id" TEXT NOT NULL,
    "chunk_text" TEXT NOT NULL,
    "embedding" vector(768) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'notes',

    CONSTRAINT "chapter_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chapter_chunks_chapter_id_idx" ON "chapter_chunks"("chapter_id");

-- AddForeignKey
ALTER TABLE "chapter_chunks" ADD CONSTRAINT "chapter_chunks_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
