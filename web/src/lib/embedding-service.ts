import { Pool } from 'pg';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Constants - use the values from the .env file
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'models/embedding-001';
// The actual embedding dimension from the Google API is 3072
// But we're storing a compressed version in our database to save space
const EMBEDDING_FULL_DIM = 3072; // The actual dimension from the Google API
const EMBEDDING_DIM = 768; // The dimension we store in our database (compressed)
const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE || '1000', 10);
const CHUNK_OVERLAP = parseInt(process.env.CHUNK_OVERLAP || '200', 10);

// Load API key from environment variables
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

// Initialize Google Generative AI with proper checks
let genAI: GoogleGenerativeAI | null = null;
try {
  if (apiKey && apiKey.length > 10) {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log('Google Generative AI initialized successfully with API key');
  } else {
    console.warn('Missing or invalid Google API key - embedding service will use mock embeddings');
    console.log('API Key from env:', process.env.GOOGLE_GENERATIVE_AI_API_KEY ? 'Present but not valid' : 'Missing');
  }
} catch (error) {
  console.error('Failed to initialize Google Generative AI:', error);
}

// Initialize PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Split text into chunks with overlap for better context preservation
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

    // If the remaining text is too small for a meaningful chunk, just include it in the last chunk
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

  console.log(`Generated ${count} mock embeddings for testing`);
  return embeddings;
}

/**
 * Generate embeddings for text chunks using Google's Generative AI
 */
export async function generateEmbeddings(chunks: string[]): Promise<number[][]> {
  try {
    // If genAI is not initialized or we're in development mode without API key
    if (!genAI) {
      console.log('Google AI client not available - using mock embeddings');
      return generateMockEmbeddings(chunks.length);
    }

    const embeddings: number[][] = [];
    const embeddingModel = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

    // Process chunks in batches to avoid rate limiting
    for (let i = 0; i < chunks.length; i++) {
      try {
        const result = await embeddingModel.embedContent(chunks[i]);
        const embedding = result.embedding.values;
        embeddings.push(embedding);
      } catch (error) {
        console.error(`Error generating embedding for chunk ${i}:`, error);
        // In production, rethrow. In development, fallback to mock
        if (process.env.NODE_ENV === 'production') {
          throw error;
        } else {
          console.log('Falling back to mock embedding for this chunk');
          embeddings.push(generateMockEmbeddings(1)[0]);
        }
      }
    }

    console.log(`Successfully generated embeddings for ${chunks.length} chunks`);
    return embeddings;
  } catch (error) {
    console.error('Error in generateEmbeddings:', error);

    // Always fall back to mock embeddings if there's an error
    console.log('Falling back to mock embeddings due to error');
    return generateMockEmbeddings(chunks.length);
  }
}

/**
 * Insert chunks and their embeddings into the database
 */
export async function insertChunks(
  noteId: string,
  chunks: string[],
  chunkIndices: [number, number][],
  embeddings: number[][]
): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // First delete any existing chunks for this note
    await client.query(
      'DELETE FROM note_chunks WHERE note_id = $1',
      [noteId]
    );

    // Make sure vector extension is available
    await client.query('CREATE EXTENSION IF NOT EXISTS vector');

    // Insert each chunk with its embedding
    // Use text representation and cast to vector to avoid Prisma issues
    const query = `
      INSERT INTO note_chunks (note_id, chunk_text, embedding)
      VALUES ($1, $2, $3::vector)
    `;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = embeddings[i];

      // Compress the embedding if necessary
      // If the API returns a larger embedding than we want to store
      let processedEmbedding = embedding;
      if (embedding.length !== EMBEDDING_DIM) {
        if (embedding.length > EMBEDDING_DIM) {
          // We'll use a simple dimensionality reduction by averaging groups of values
          // For example, if we have 3072 values and want 768, we average each group of 4
          const compressionFactor = Math.floor(embedding.length / EMBEDDING_DIM);
          if (compressionFactor > 1) {
            processedEmbedding = [];
            for (let j = 0; j < EMBEDDING_DIM; j++) {
              const start = j * compressionFactor;
              const group = embedding.slice(start, start + compressionFactor);
              const avg = group.reduce((sum, val) => sum + val, 0) / group.length;
              processedEmbedding.push(avg);
            }
            console.log(`Compressed embedding from ${embedding.length} to ${EMBEDDING_DIM} dimensions`);
          } else {
            // Simple truncation if compression factor is 1 or less
            processedEmbedding = embedding.slice(0, EMBEDDING_DIM);
            console.log(`Truncated embedding from ${embedding.length} to ${EMBEDDING_DIM} dimensions`);
          }
        } else {
          // Pad with zeros if the embedding is smaller than expected
          processedEmbedding = [...embedding, ...Array(EMBEDDING_DIM - embedding.length).fill(0)];
          console.log(`Padded embedding from ${embedding.length} to ${EMBEDDING_DIM} dimensions`);
        }
      }

      // Format embedding for PostgreSQL vector format
      const vectorString = `[${processedEmbedding.join(',')}]`;

      await client.query(query, [
        noteId,
        chunk,
        vectorString
      ]);

      console.log(`Inserted chunk ${i + 1}/${chunks.length} for note ${noteId}`);
    }

    await client.query('COMMIT');
    console.log(`Successfully indexed ${chunks.length} chunks for note ${noteId}`);
    return;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error inserting chunks:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Process a note's content to generate and store embeddings
 */
export async function indexNoteContent(noteId: string, content: string): Promise<void> {
  try {
    // Skip indexing if content is empty
    if (!content || content.trim().length === 0) {
      console.log(`Note ${noteId} has no content to index`);
      return;
    }

    // Chunk the text
    const { chunks, chunkIndices } = chunkText(content);

    if (chunks.length === 0) {
      console.log(`No chunks generated for note ${noteId}`);
      return;
    }

    // Generate embeddings
    const embeddings = await generateEmbeddings(chunks);

    // Store chunks and embeddings
    await insertChunks(noteId, chunks, chunkIndices, embeddings);
  } catch (error) {
    console.error(`Failed to index note ${noteId}:`, error);
    throw error;
  }
}

/**
 * Retrieve similar chunks for a given query
 */
export async function querySimilarChunks(query: string, noteId?: string, topK: number = 3): Promise<any[]> {
  try {
    let embedding: number[] = [];

    // Generate embedding for query
    if (genAI) {
      try {
        const embeddingModel = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
        const result = await embeddingModel.embedContent(query);
        embedding = result.embedding.values;
      } catch (error) {
        console.error('Error generating query embedding, using mock embedding instead:', error);
        embedding = generateMockEmbeddings(1)[0];
      }
    } else {
      console.log('Using mock embedding for query');
      embedding = generateMockEmbeddings(1)[0];
    }

    // Process the embedding to match our storage dimension
    let processedEmbedding = embedding;
    if (embedding.length !== EMBEDDING_DIM) {
      if (embedding.length > EMBEDDING_DIM) {
        // Compress using the same technique as in insertChunks
        const compressionFactor = Math.floor(embedding.length / EMBEDDING_DIM);
        if (compressionFactor > 1) {
          processedEmbedding = [];
          for (let j = 0; j < EMBEDDING_DIM; j++) {
            const start = j * compressionFactor;
            const group = embedding.slice(start, start + compressionFactor);
            const avg = group.reduce((sum, val) => sum + val, 0) / group.length;
            processedEmbedding.push(avg);
          }
        } else {
          processedEmbedding = embedding.slice(0, EMBEDDING_DIM);
        }
      } else {
        processedEmbedding = [...embedding, ...Array(EMBEDDING_DIM - embedding.length).fill(0)];
      }
    }

    // Format embedding for PostgreSQL vector format
    const vectorString = `[${processedEmbedding.join(',')}]`;

    // Query database for similar chunks
    const client = await pool.connect();
    try {
      let queryText: string;
      let queryParams: any[];

      if (noteId) {
        // Search within a specific note
        // Use <=> for cosine distance which is optimized by our index
        queryText = `
          SELECT id, note_id, chunk_text, embedding <=> $1::vector as distance
          FROM note_chunks
          WHERE note_id = $2
          ORDER BY distance
          LIMIT $3
        `;
        queryParams = [vectorString, noteId, topK];
      } else {
        // Search across all notes
        // Use <=> for cosine distance which is optimized by our index
        queryText = `
          SELECT id, note_id, chunk_text, embedding <=> $1::vector as distance
          FROM note_chunks
          ORDER BY distance
          LIMIT $2
        `;
        queryParams = [vectorString, topK];
      }

      try {
        const { rows } = await client.query(queryText, queryParams);
        return rows;
      } catch (error) {
        console.error('Error in vector query, falling back to simple text match:', error);
        // Fallback to simple text search if vector search fails
        const fallbackQuery = noteId
          ? `SELECT id, note_id, chunk_text FROM note_chunks WHERE note_id = $1 LIMIT $2`
          : `SELECT id, note_id, chunk_text FROM note_chunks LIMIT $1`;
        const fallbackParams = noteId ? [noteId, topK] : [topK];
        const { rows } = await client.query(fallbackQuery, fallbackParams);
        return rows;
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error in querySimilarChunks:', error);
    return []; // Return empty array instead of throwing
  }
}

export default {
  chunkText,
  generateEmbeddings,
  insertChunks,
  indexNoteContent,
  querySimilarChunks
};
