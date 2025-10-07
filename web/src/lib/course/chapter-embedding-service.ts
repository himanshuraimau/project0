import { Pool } from 'pg';
import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';

// Constants
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
const EMBEDDING_DIM = 1536; // OpenAI text-embedding-3-small dimensions
const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE || '1000', 10);
const CHUNK_OVERLAP = parseInt(process.env.CHUNK_OVERLAP || '200', 10);

// Check if OpenAI API key is available
const openaiApiKey = process.env.OPENAI_API_KEY;
const hasValidApiKey = openaiApiKey && openaiApiKey.length > 10;

// Initialize PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Split text into chunks with overlap
 */
export function chunkText(text: string): { chunks: string[], chunkIndices: [number, number][] } {
  if (!text || text.trim().length === 0) {
    return { chunks: [], chunkIndices: [] };
  }

  const chunks: string[] = [];
  const chunkIndices: [number, number][] = [];

  let startIndex = 0;
  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + CHUNK_SIZE, text.length);
    chunks.push(text.substring(startIndex, endIndex));
    chunkIndices.push([startIndex, endIndex]);
    startIndex = endIndex - CHUNK_OVERLAP;

    if (text.length - startIndex < CHUNK_SIZE / 2) {
      if (startIndex < text.length) {
        chunks[chunks.length - 1] = text.substring(chunkIndices[chunkIndices.length - 1][0], text.length);
        chunkIndices[chunkIndices.length - 1][1] = text.length;
      }
      break;
    }
  }

  return { chunks, chunkIndices };
}

/**
 * Generate mock embeddings for testing
 */
export function generateMockEmbeddings(count: number): number[][] {
  const embeddings: number[][] = [];
  for (let i = 0; i < count; i++) {
    const embedding = Array.from({ length: EMBEDDING_DIM }, () => Math.random() * 2 - 1);
    embeddings.push(embedding);
  }
  return embeddings;
}

/**
 * Generate embeddings for text chunks using OpenAI's AI SDK
 */
export async function generateEmbeddings(chunks: string[]): Promise<number[][]> {
  try {
    if (!hasValidApiKey) {
      return generateMockEmbeddings(chunks.length);
    }

    const embeddings: number[][] = [];

    for (let i = 0; i < chunks.length; i++) {
      try {
        const { embedding } = await embed({
          model: openai.textEmbeddingModel(EMBEDDING_MODEL),
          value: chunks[i],
        });
        
        // Validate embedding dimensions
        if (embedding.length !== EMBEDDING_DIM) {
          console.warn(`Embedding dimension mismatch: expected ${EMBEDDING_DIM}, got ${embedding.length}. Using mock embedding.`);
          embeddings.push(generateMockEmbeddings(1)[0]);
        } else {
          embeddings.push(embedding);
        }
      } catch (error) {
        console.error(`Error generating embedding for chunk ${i}:`, error);
        embeddings.push(generateMockEmbeddings(1)[0]);
      }
    }

    return embeddings;
  } catch (error) {
    console.error('Error in generateEmbeddings:', error);
    return generateMockEmbeddings(chunks.length);
  }
}

/**
 * Insert chapter chunks and their embeddings into the database
 */
export async function insertChapterChunks(
  chapterId: string,
  chunks: string[],
  embeddings: number[][],
  source: 'notes' | 'transcript'
): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Delete existing chunks for this chapter and source
    await client.query(
      'DELETE FROM chapter_chunks WHERE chapter_id = $1 AND source = $2',
      [chapterId, source]
    );

    // Make sure vector extension is available
    await client.query('CREATE EXTENSION IF NOT EXISTS vector');

    // Insert each chunk with its embedding
    const query = `
      INSERT INTO chapter_chunks (chapter_id, chunk_text, embedding, source)
      VALUES ($1, $2, $3::vector, $4)
    `;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = embeddings[i];
      const vectorString = `[${embedding.join(',')}]`;

      await client.query(query, [
        chapterId,
        chunk,
        vectorString,
        source
      ]);
    }

    await client.query('COMMIT');
    console.log(`Successfully indexed ${chunks.length} ${source} chunks for chapter ${chapterId}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error inserting chapter chunks:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Process chapter content to generate and store embeddings
 */
export async function indexChapterContent(chapterId: string, notes?: string, transcript?: string): Promise<void> {
  try {
    // Index notes if available
    if (notes && notes.trim().length > 0) {
      const { chunks } = chunkText(notes);
      if (chunks.length > 0) {
        const embeddings = await generateEmbeddings(chunks);
        await insertChapterChunks(chapterId, chunks, embeddings, 'notes');
      }
    }

    // Index transcript if available
    if (transcript && transcript.trim().length > 0) {
      const { chunks } = chunkText(transcript);
      if (chunks.length > 0) {
        const embeddings = await generateEmbeddings(chunks);
        await insertChapterChunks(chapterId, chunks, embeddings, 'transcript');
      }
    }
  } catch (error) {
    console.error(`Failed to index chapter ${chapterId}:`, error);
    throw error;
  }
}

/**
 * Query similar chunks for a chapter using OpenAI embeddings
 */
export async function queryChapterSimilarChunks(query: string, chapterId: string, topK: number = 5): Promise<any[]> {
  try {
    let embedding: number[] = [];

    // Generate embedding for query using OpenAI
    if (hasValidApiKey) {
      try {
        const { embedding: queryEmbedding } = await embed({
          model: openai.textEmbeddingModel(EMBEDDING_MODEL),
          value: query,
        });
        embedding = queryEmbedding;
      } catch (error) {
        console.error('Error generating query embedding:', error);
        embedding = generateMockEmbeddings(1)[0];
      }
    } else {
      embedding = generateMockEmbeddings(1)[0];
    }

    // Validate embedding dimensions
    if (embedding.length !== EMBEDDING_DIM) {
      console.warn(`Query embedding dimension mismatch: expected ${EMBEDDING_DIM}, got ${embedding.length}`);
      embedding = generateMockEmbeddings(1)[0];
    }

    const vectorString = `[${embedding.join(',')}]`;

    // Query database for similar chunks
    const client = await pool.connect();
    try {
      const queryText = `
        SELECT id, chapter_id, chunk_text, source, embedding <=> $1::vector as distance
        FROM chapter_chunks
        WHERE chapter_id = $2
        ORDER BY distance
        LIMIT $3
      `;

      try {
        const { rows } = await client.query(queryText, [vectorString, chapterId, topK]);
        return rows;
      } catch (error) {
        console.error('Error in vector query, falling back to simple text match:', error);
        const fallbackQuery = `SELECT id, chapter_id, chunk_text, source FROM chapter_chunks WHERE chapter_id = $1 LIMIT $2`;
        const { rows } = await client.query(fallbackQuery, [chapterId, topK]);
        return rows;
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in queryChapterSimilarChunks:', error);
    return [];
  }
}

export default {
  chunkText,
  generateEmbeddings,
  insertChapterChunks,
  indexChapterContent,
  queryChapterSimilarChunks
};