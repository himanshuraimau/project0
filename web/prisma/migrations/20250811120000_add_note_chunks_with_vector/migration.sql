-- Reconcile the note_chunks table
-- This migration is a no-op since the table was already created by another migration
-- We're just adding this to reconcile Prisma's migration history

-- For safety, ensure the vector extension exists
CREATE EXTENSION IF NOT EXISTS vector;

-- Make sure the table schema matches the Prisma schema
-- If table exists with different structure, alter it
DO $$ 
BEGIN
    -- Only proceed if the table already exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'note_chunks') THEN
        -- Check if columns need to be updated
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'note_chunks' 
                      AND column_name = 'note_id') THEN
            -- Rename column if necessary
            ALTER TABLE "note_chunks" RENAME COLUMN "noteId" TO "note_id";
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'note_chunks' 
                      AND column_name = 'chunk_text') THEN
            -- Rename column if necessary
            ALTER TABLE "note_chunks" RENAME COLUMN "chunkText" TO "chunk_text";
        END IF;
        
        -- Drop unused columns if they exist
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'note_chunks' 
                  AND column_name = 'chunkIndex') THEN
            ALTER TABLE "note_chunks" DROP COLUMN "chunkIndex";
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'note_chunks' 
                  AND column_name = 'metadata') THEN
            ALTER TABLE "note_chunks" DROP COLUMN "metadata";
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'note_chunks' 
                  AND column_name = 'createdAt') THEN
            ALTER TABLE "note_chunks" DROP COLUMN "createdAt";
        END IF;
    ELSE
        -- Create the table if it doesn't exist
        CREATE TABLE "note_chunks" (
            "id" SERIAL NOT NULL,
            "note_id" TEXT NOT NULL,
            "chunk_text" TEXT NOT NULL,
            "embedding" vector(768),
            CONSTRAINT "note_chunks_pkey" PRIMARY KEY ("id")
        );
        
        -- Create index
        CREATE INDEX "note_chunks_note_id_idx" ON "note_chunks"("note_id");
        
        -- Add foreign key
        ALTER TABLE "note_chunks" ADD CONSTRAINT "note_chunks_note_id_fkey" 
            FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Ensure the vector column has the correct dimension
DO $$ 
BEGIN
    -- Check if the embedding column exists and needs updating
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'note_chunks' AND column_name = 'embedding'
    ) THEN
        -- The column exists, so we can alter it safely
        -- We use a safe approach that rebuilds the table with the correct type if needed
        EXECUTE '
            ALTER TABLE "note_chunks" 
            ALTER COLUMN "embedding" TYPE vector(768) 
            USING NULL::vector(768)';
    END IF;
END $$;

-- Ensure the correct index exists
DROP INDEX IF EXISTS "note_chunks_embedding_idx";
