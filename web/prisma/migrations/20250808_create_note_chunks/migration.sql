-- Enable pgvector extension (idempotent)
CREATE EXTENSION IF NOT EXISTS vector;

-- Create note_chunks table for RAG
CREATE TABLE IF NOT EXISTS note_chunks (
  id serial PRIMARY KEY,
  note_id text NOT NULL,
  chunk_text text NOT NULL,
  embedding vector(1536) NOT NULL
);
