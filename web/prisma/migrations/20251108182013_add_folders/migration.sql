-- AlterTable
ALTER TABLE "public"."notes" ADD COLUMN     "folderId" TEXT;

-- CreateTable
CREATE TABLE "public"."folders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT DEFAULT '#6366f1',
    "userId" TEXT NOT NULL,
    "icon" TEXT DEFAULT 'folder',
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "folders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "folders_userId_idx" ON "public"."folders"("userId");

-- CreateIndex
CREATE INDEX "folders_userId_position_idx" ON "public"."folders"("userId", "position");

-- CreateIndex
CREATE INDEX "notes_folderId_idx" ON "public"."notes"("folderId");

-- AddForeignKey
ALTER TABLE "public"."notes" ADD CONSTRAINT "notes_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "public"."folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
