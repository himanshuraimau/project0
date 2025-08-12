-- DropTable
DROP TABLE IF EXISTS "note_chunks";

-- CreateTable
CREATE TABLE "note_chunks" (
    "id" SERIAL NOT NULL,
    "note_id" TEXT NOT NULL,
    "chunk_text" TEXT NOT NULL,
    "embedding" vector(1536),

    CONSTRAINT "note_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "note_chunks_note_id_idx" ON "note_chunks"("note_id");

-- CreateIndex
CREATE INDEX "note_chunks_embedding_idx" ON "note_chunks" USING HNSW ("embedding" vector_l2_ops);

-- AddForeignKey
ALTER TABLE "note_chunks" ADD CONSTRAINT "note_chunks_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
