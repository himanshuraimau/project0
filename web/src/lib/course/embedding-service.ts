import { Pool } from 'pg';
import { embed } from 'ai';
import { aiGateway, AI_MODELS } from '@/lib/ai/gateway';

// OpenAI text-embedding-3-small has 1536 dimensions by default
const EMBEDDING_DIM = 1536; // The dimension we store in our database
const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE || '1000', 10);
const CHUNK_OVERLAP = parseInt(process.env.CHUNK_OVERLAP || '200', 10);

// Check if the AI Gateway API key is available
const gatewayApiKey = process.env.AI_GATEWAY_API_KEY;
const hasValidApiKey = gatewayApiKey && gatewayApiKey.length > 10;

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
 * Generate embeddings for text chunks using OpenAI's AI SDK
 */
export async function generateEmbeddings(chunks: string[]): Promise<number[][]> {
  try {
    // If the AI Gateway key is not available, use mock embeddings
    if (!hasValidApiKey) {
      console.warn('⚠️ AI_GATEWAY_API_KEY not configured - using mock embeddings');
      console.warn('⚠️ Mock embeddings will NOT work for semantic search in chatbot!');
      console.warn('⚠️ Please set AI_GATEWAY_API_KEY environment variable for production use');
      return generateMockEmbeddings(chunks.length);
    }

    const embeddings: number[][] = [];

    // Process chunks individually using the embed function
    for (let i = 0; i < chunks.length; i++) {
      try {
        const { embedding } = await embed({
          model: aiGateway.textEmbeddingModel(AI_MODELS.embedding),
          value: chunks[i],
        });

        embeddings.push(embedding);
        console.log(`✅ Generated embedding ${i + 1}/${chunks.length} using OpenAI`);
      } catch (error) {
        console.error(`❌ Error generating embedding for chunk ${i}:`, error);

        if (error instanceof Error) {
          console.error(`❌ OpenAI API Error: ${error.message}`);
        }

        // In production, rethrow. In development, fallback to mock
        if (process.env.NODE_ENV === 'production') {
          console.error(`❌ Production mode: throwing error instead of using mock embeddings`);
          throw error;
        } else {
          console.warn(`⚠️ Development mode: falling back to mock embedding for chunk ${i}`);
          console.warn(`⚠️ This mock embedding will NOT work for semantic search!`);
          embeddings.push(generateMockEmbeddings(1)[0]);
        }
      }
    }

    console.log(`✅ Successfully generated ${embeddings.length} embeddings for ${chunks.length} chunks using OpenAI`);
    return embeddings;
  } catch (error) {
    console.error('❌ Critical error in generateEmbeddings:', error);

    if (error instanceof Error) {
      console.error(`❌ Error details: ${error.message}`);
      if (error.stack) {
        console.error(`❌ Stack trace:`, error.stack);
      }
    }

    // Always fall back to mock embeddings if there's an error
    console.warn('⚠️ Falling back to mock embeddings due to error');
    console.warn('⚠️ Chatbot will NOT work with mock embeddings!');
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
  console.log(`🔧 insertChunks called for noteId: ${noteId}, chunks: ${chunks.length}`);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // First delete any existing chunks for this note
    const deleteResult = await client.query(
      'DELETE FROM note_chunks WHERE note_id = $1',
      [noteId]
    );
    console.log(`🗑️ Deleted ${deleteResult.rowCount} existing chunks for note ${noteId}`);

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

      // Validate embedding dimensions
      if (embedding.length !== EMBEDDING_DIM) {
        console.warn(`Embedding dimension mismatch: expected ${EMBEDDING_DIM}, got ${embedding.length}. Skipping chunk.`);
        continue;
      }

      // Format embedding for PostgreSQL vector format
      const vectorString = `[${embedding.join(',')}]`;

      await client.query(query, [
        noteId,
        chunk,
        vectorString
      ]);

      console.log(`✅ Inserted chunk ${i + 1}/${chunks.length} for note ${noteId} (chunk length: ${chunk.length})`);
    }

    await client.query('COMMIT');
    console.log(`✅ Successfully indexed ${chunks.length} chunks for note ${noteId}`);

    // Verify chunks were inserted
    const verifyResult = await client.query(
      'SELECT COUNT(*) as count FROM note_chunks WHERE note_id = $1',
      [noteId]
    );
    console.log(`🔍 Verification: ${verifyResult.rows[0].count} chunks found in database for note ${noteId}`);

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
    console.log(`📝 indexNoteContent called for note: ${noteId}`);
    console.log(`📊 Content length: ${content.length} characters`);

    // Skip indexing if content is empty
    if (!content || content.trim().length === 0) {
      console.warn(`⚠️ Note ${noteId} has no content to index`);
      throw new Error(`Cannot index note ${noteId}: content is empty`);
    }

    // Step 1: Chunk the text
    console.log(`🔪 Step 1/3: Chunking text for note ${noteId}...`);
    const { chunks, chunkIndices } = chunkText(content);
    console.log(`✅ Generated ${chunks.length} chunks for note ${noteId}`);

    if (chunks.length === 0) {
      console.warn(`⚠️ No chunks generated for note ${noteId}`);
      throw new Error(`No chunks generated for note ${noteId} despite having content`);
    }

    // Step 2: Generate embeddings
    console.log(`🤖 Step 2/3: Generating embeddings for ${chunks.length} chunks...`);
    const embeddings = await generateEmbeddings(chunks);
    console.log(`✅ Generated ${embeddings.length} embeddings for note ${noteId}`);

    if (embeddings.length !== chunks.length) {
      throw new Error(`Embedding count mismatch: ${embeddings.length} embeddings for ${chunks.length} chunks`);
    }

    // Step 3: Store chunks and embeddings
    console.log(`💾 Step 3/3: Storing chunks and embeddings in database...`);
    await insertChunks(noteId, chunks, chunkIndices, embeddings);
    console.log(`✅ Successfully completed all indexing steps for note ${noteId}`);
  } catch (error) {
    console.error(`❌ Failed to index note ${noteId}:`, error);

    if (error instanceof Error) {
      console.error(`❌ Indexing error details - Name: ${error.name}, Message: ${error.message}`);
      if (error.stack) {
        console.error(`❌ Stack trace:`, error.stack);
      }
    }

    throw error;
  }
}



/**
 * Retrieve similar chunks for a given query
 */
export async function querySimilarChunks(query: string, noteId?: string, topK: number = 3): Promise<any[]> {
  try {
    let embedding: number[] = [];

    // Generate embedding for query using OpenAI
    if (hasValidApiKey) {
      try {
        const { embedding: queryEmbedding } = await embed({
          model: aiGateway.textEmbeddingModel(AI_MODELS.embedding),
          value: query,
        });
        embedding = queryEmbedding;
      } catch (error) {
        console.error('Error generating query embedding, using mock embedding instead:', error);
        embedding = generateMockEmbeddings(1)[0];
      }
    } else {
      console.log('Using mock embedding for query');
      embedding = generateMockEmbeddings(1)[0];
    }

    // Validate embedding dimensions
    if (embedding.length !== EMBEDDING_DIM) {
      console.warn(`Query embedding dimension mismatch: expected ${EMBEDDING_DIM}, got ${embedding.length}`);
      // For consistency, if dimensions don't match, use mock embedding
      embedding = generateMockEmbeddings(1)[0];
    }

    // Format embedding for PostgreSQL vector format
    const vectorString = `[${embedding.join(',')}]`;

    // Query database for similar chunks
    const client = await pool.connect();
    try {
      let queryText: string;
      let queryParams: any[];

      if (noteId) {
        // Search within a specific note
        // Use <= for cosine distance which is optimized by our index
        queryText = `
          SELECT id, note_id, chunk_text, embedding <=> $1::vector as distance
          FROM note_chunks
          WHERE note_id = $2
          ORDER BY distance
          LIMIT $3
        `;
        queryParams = [vectorString, noteId, topK];
        console.log('🔍 Executing note-specific query:', { noteId, topK, queryLength: query.length });
      } else {
        // Search across all notes
        // Use <= for cosine distance which is optimized by our index
        queryText = `
          SELECT id, note_id, chunk_text, embedding <=> $1::vector as distance
          FROM note_chunks
          ORDER BY distance
          LIMIT $2
        `;
        queryParams = [vectorString, topK];
        console.log('🔍 Executing global query:', { topK, queryLength: query.length });
      }

      try {
        const { rows } = await client.query(queryText, queryParams);
        console.log('✅ Vector query successful:', {
          rowsFound: rows.length,
          noteId: noteId || 'all',
          firstRowNoteId: rows[0]?.note_id
        });
        return rows;
      } catch (error) {
        console.error('❌ Error in vector query, falling back to simple text match:', error);
        // Fallback to simple text search if vector search fails
        const fallbackQuery = noteId
          ? `SELECT id, note_id, chunk_text FROM note_chunks WHERE note_id = $1 LIMIT $2`
          : `SELECT id, note_id, chunk_text FROM note_chunks LIMIT $1`;
        const fallbackParams = noteId ? [noteId, topK] : [topK];
        console.log('🔄 Executing fallback query:', { noteId: noteId || 'all', topK });
        const { rows } = await client.query(fallbackQuery, fallbackParams);
        console.log('✅ Fallback query result:', { rowsFound: rows.length });
        return rows;
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error in querySimilarChunks:', error);
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
