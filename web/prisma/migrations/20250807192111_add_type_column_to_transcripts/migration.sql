-- AlterTable
ALTER TABLE "public"."transcripts" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'pdf',
ALTER COLUMN "pages" DROP NOT NULL;
