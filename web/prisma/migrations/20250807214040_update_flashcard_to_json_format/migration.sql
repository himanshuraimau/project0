/*
  Warnings:

  - You are about to drop the column `answer` on the `flashcards` table. All the data in the column will be lost.
  - You are about to drop the column `question` on the `flashcards` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[noteId]` on the table `flashcards` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `content` to the `flashcards` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add the content column with a default empty array
ALTER TABLE "flashcards" ADD COLUMN "content" JSONB NOT NULL DEFAULT '[]';

-- Step 2: Create a temporary table to aggregate flashcards by noteId with proper numbering
CREATE TEMP TABLE flashcard_numbered AS
SELECT 
    "noteId",
    "userId",
    "createdAt",
    "updatedAt",
    "question",
    "answer",
    ROW_NUMBER() OVER (PARTITION BY "noteId" ORDER BY "createdAt") as card_number
FROM "flashcards";

-- Step 3: Create aggregated flashcards
CREATE TEMP TABLE flashcard_aggregated AS
SELECT 
    "noteId",
    "userId",
    MIN("createdAt") as "createdAt",
    MAX("updatedAt") as "updatedAt",
    jsonb_agg(
        jsonb_build_object(
            'id', card_number,
            'question', "question",
            'answer', "answer"
        ) ORDER BY card_number
    ) as content
FROM flashcard_numbered
GROUP BY "noteId", "userId";

-- Step 4: Delete all existing flashcard records
DELETE FROM "flashcards";

-- Step 5: Insert the aggregated records
INSERT INTO "flashcards" (id, "noteId", content, "userId", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    "noteId",
    content,
    "userId",
    "createdAt",
    "updatedAt"
FROM flashcard_aggregated;

-- Step 6: Drop the old columns
ALTER TABLE "flashcards" DROP COLUMN "answer";
ALTER TABLE "flashcards" DROP COLUMN "question";

-- Step 7: Create the unique index
CREATE UNIQUE INDEX "flashcards_noteId_key" ON "flashcards"("noteId");
