-- Fix the vector dimension based on actual test results (768 not 1536)
-- Create extension if not already created
CREATE EXTENSION IF NOT EXISTS vector;

-- Update the embedding column type to match the actual dimension
ALTER TABLE note_chunks ALTER COLUMN embedding TYPE vector(768);
