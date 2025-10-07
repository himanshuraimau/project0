-- CreateTable
CREATE TABLE "public"."note_progress" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "note_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "note_progress_noteId_key" ON "public"."note_progress"("noteId");

-- AddForeignKey
ALTER TABLE "public"."note_progress" ADD CONSTRAINT "note_progress_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "public"."notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
