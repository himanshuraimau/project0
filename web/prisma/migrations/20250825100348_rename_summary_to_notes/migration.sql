/*
  Warnings:

  - You are about to drop the column `summary` on the `chapters` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."chapters" DROP COLUMN "summary",
ADD COLUMN     "notes" TEXT;
