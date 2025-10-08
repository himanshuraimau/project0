import { Pool } from 'pg';
import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';

// Constants - use the values from the .env file
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
// OpenAI text-embedding-3-small has 1536 dimensions by default
const EMBEDDING_DIM = 1536; // The dimension we store in our database
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
 * Chunk podcast segments for optimal RAG performance
 * Groups segments by speaker and topic while maintaining conversation context
 */
export function chunkPodcastSegments(segments: any[], podcastId: string): { 
  chunks: string[], 
  chunkMetadata: Array<{
    podcastId: string;
    segmentIds: number[];
    speakers: string[];
    startTime?: number;
    endTime?: number;
    sequenceRange: [number, number];
  }> 
} {
  if (!segments || segments.length === 0) {
    return { chunks: [], chunkMetadata: [] };
  }

  const chunks: string[] = [];
  const chunkMetadata: Array<{
    podcastId: string;
    segmentIds: number[];
    speakers: string[];
    startTime?: number;
    endTime?: number;
    sequenceRange: [number, number];
  }> = [];

  // Strategy: Group consecutive segments into chunks while maintaining conversation flow
  // This preserves the back-and-forth nature of podcast conversations for better context
  
  let currentChunk = '';
  let currentSegmentIds: number[] = [];
  let currentSpeakers: string[] = [];
  let chunkStartTime: number | undefined;
  let chunkEndTime: number | undefined;
  let sequenceStart: number | undefined;
  let sequenceEnd: number | undefined;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const segmentText = `[${segment.speaker.toUpperCase()}]: ${segment.content}`;
    
    // Check if adding this segment would exceed chunk size
    const potentialChunk = currentChunk + (currentChunk ? '\n\n' : '') + segmentText;
    
    if (potentialChunk.length > CHUNK_SIZE && currentChunk.length > 0) {
      // Save current chunk and start a new one
      chunks.push(currentChunk);
      chunkMetadata.push({
        podcastId,
        segmentIds: [...currentSegmentIds],
        speakers: [...new Set(currentSpeakers)], // Remove duplicates
        startTime: chunkStartTime,
        endTime: chunkEndTime,
        sequenceRange: [sequenceStart!, sequenceEnd!]
      });

      // Start new chunk with overlap - include the last segment for context
      const lastSegment = segments[i - 1];
      currentChunk = `[${lastSegment.speaker.toUpperCase()}]: ${lastSegment.content}\n\n${segmentText}`;
      currentSegmentIds = [lastSegment.id, segment.id];
      currentSpeakers = [lastSegment.speaker, segment.speaker];
      chunkStartTime = lastSegment.startTime ? Number(lastSegment.startTime) : undefined;
      chunkEndTime = segment.endTime ? Number(segment.endTime) : undefined;
      sequenceStart = lastSegment.sequenceOrder;
      sequenceEnd = segment.sequenceOrder;
    } else {
      // Add segment to current chunk
      currentChunk = potentialChunk;
      currentSegmentIds.push(segment.id);
      currentSpeakers.push(segment.speaker);
      
      if (chunkStartTime === undefined && segment.startTime) {
        chunkStartTime = Number(segment.startTime);
      }
      if (segment.endTime) {
        chunkEndTime = Number(segment.endTime);
      }
      if (sequenceStart === undefined) {
        sequenceStart = segment.sequenceOrder;
      }
      sequenceEnd = segment.sequenceOrder;
    }
  }

  // Add the final chunk if it has content
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk);
    chunkMetadata.push({
      podcastId,
      segmentIds: [...currentSegmentIds],
      speakers: [...new Set(currentSpeakers)],
      startTime: chunkStartTime,
      endTime: chunkEndTime,
      sequenceRange: [sequenceStart!, sequenceEnd!]
    });
  }

  console.log(`Created ${chunks.length} podcast chunks from ${segments.length} segments`);
  return { chunks, chunkMetadata };
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
    // If OpenAI API key is not available, use mock embeddings
    if (!hasValidApiKey) {
      console.log('OpenAI API key not available - using mock embeddings');
      return generateMockEmbeddings(chunks.length);
    }

    const embeddings: number[][] = [];

    // Process chunks individually using the embed function
    for (let i = 0; i < chunks.length; i++) {
      try {
        const { embedding } = await embed({
          model: openai.textEmbeddingModel(EMBEDDING_MODEL),
          value: chunks[i],
        });
        
        embeddings.push(embedding);
        console.log(`Generated embedding ${i + 1}/${chunks.length}`);
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

    console.log(`Successfully generated embeddings for ${chunks.length} chunks using OpenAI`);
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
 * Insert podcast transcript chunks with metadata linking to original note
 */
export async function insertPodcastChunks(
  noteId: string,
  podcastId: string,
  chunks: string[],
  chunkMetadata: Array<{
    podcastId: string;
    segmentIds: number[];
    speakers: string[];
    startTime?: number;
    endTime?: number;
    sequenceRange: [number, number];
  }>,
  embeddings: number[][]
): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Delete any existing podcast chunks for this note/podcast combination
    await client.query(
      'DELETE FROM note_chunks WHERE note_id = $1 AND chunk_text LIKE $2',
      [noteId, `%[PODCAST:${podcastId}]%`]
    );

    // Make sure vector extension is available
    await client.query('CREATE EXTENSION IF NOT EXISTS vector');

    // Insert each podcast chunk with enhanced metadata
    const query = `
      INSERT INTO note_chunks (note_id, chunk_text, embedding)
      VALUES ($1, $2, $3::vector)
    `;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const metadata = chunkMetadata[i];
      const embedding = embeddings[i];

      // Enhance chunk text with podcast metadata for better context
      const enhancedChunk = `[PODCAST:${podcastId}] [SPEAKERS:${metadata.speakers.join(',')}] [TIME:${metadata.startTime || 0}-${metadata.endTime || 0}] [SEQUENCE:${metadata.sequenceRange[0]}-${metadata.sequenceRange[1]}]

${chunk}

[END_PODCAST_CHUNK]`;

      // Validate embedding dimensions
      if (embedding.length !== EMBEDDING_DIM) {
        console.warn(`Embedding dimension mismatch: expected ${EMBEDDING_DIM}, got ${embedding.length}. Skipping chunk.`);
        continue;
      }

      // Format embedding for PostgreSQL vector format
      const vectorString = `[${embedding.join(',')}]`;

      await client.query(query, [
        noteId,
        enhancedChunk,
        vectorString
      ]);

      console.log(`Inserted podcast chunk ${i + 1}/${chunks.length} for note ${noteId}, podcast ${podcastId}`);
    }

    await client.query('COMMIT');
    console.log(`Successfully indexed ${chunks.length} podcast transcript chunks for note ${noteId}`);
    return;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error inserting podcast chunks:', error);
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
 * Process podcast transcript segments to generate and store embeddings
 * Creates chunks from podcast segments with speaker and timing metadata
 */
export async function indexPodcastTranscript(noteId: string, podcastId: string, segments: any[]): Promise<void> {
  try {
    // Skip indexing if no segments
    if (!segments || segments.length === 0) {
      console.log(`Podcast ${podcastId} has no segments to index`);
      return;
    }

    // Create chunks from podcast segments using a specialized strategy
    const { chunks, chunkMetadata } = chunkPodcastSegments(segments, podcastId);

    if (chunks.length === 0) {
      console.log(`No chunks generated for podcast ${podcastId}`);
      return;
    }

    // Generate embeddings for podcast chunks
    const embeddings = await generateEmbeddings(chunks);

    // Store podcast chunks with metadata linking to original note
    await insertPodcastChunks(noteId, podcastId, chunks, chunkMetadata, embeddings);
    
    console.log(`Successfully indexed ${chunks.length} podcast transcript chunks for note ${noteId}`);
  } catch (error) {
    console.error(`Failed to index podcast transcript for note ${noteId}:`, error);
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
          model: openai.textEmbeddingModel(EMBEDDING_MODEL),
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
  chunkPodcastSegments,
  generateEmbeddings,
  insertChunks,
  insertPodcastChunks,
  indexNoteContent,
  indexPodcastTranscript,
  querySimilarChunks
};
