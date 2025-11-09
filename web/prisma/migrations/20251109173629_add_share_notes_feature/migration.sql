-- AlterTable
ALTER TABLE "notes" ADD COLUMN     "isCloned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "originalAuthor" TEXT,
ADD COLUMN     "sourceNoteId" TEXT;

-- CreateTable
CREATE TABLE "shared_links" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "shared_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shared_links_token_key" ON "shared_links"("token");

-- CreateIndex
CREATE INDEX "shared_links_token_idx" ON "shared_links"("token");

-- CreateIndex
CREATE INDEX "shared_links_noteId_idx" ON "shared_links"("noteId");

-- CreateIndex
CREATE INDEX "shared_links_createdBy_idx" ON "shared_links"("createdBy");

-- CreateIndex
CREATE INDEX "notes_userId_idx" ON "notes"("userId");

-- CreateIndex
CREATE INDEX "notes_sourceNoteId_idx" ON "notes"("sourceNoteId");

-- AddForeignKey
ALTER TABLE "shared_links" ADD CONSTRAINT "shared_links_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
