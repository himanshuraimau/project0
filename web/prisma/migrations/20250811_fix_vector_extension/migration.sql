-- Create a migration that adds the PostgreSQL vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Make sure the NoteChunk table has the correct column type
ALTER TABLE note_chunks ALTER COLUMN embedding TYPE vector(1536);
