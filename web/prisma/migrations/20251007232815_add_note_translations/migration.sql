-- CreateTable
CREATE TABLE "public"."note_translations" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "note_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "note_translations_noteId_idx" ON "public"."note_translations"("noteId");

-- CreateIndex
CREATE UNIQUE INDEX "note_translations_noteId_language_key" ON "public"."note_translations"("noteId", "language");

-- AddForeignKey
ALTER TABLE "public"."note_translations" ADD CONSTRAINT "note_translations_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "public"."notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
