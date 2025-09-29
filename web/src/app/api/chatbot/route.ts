import { NextRequest } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { z } from 'zod';
import { querySimilarChunks } from '../../../lib/course/embedding-service';

// Environment variables
const CHAT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// Validation schema for the request body
const RequestSchema = z.object({
  message: z.string().min(1).max(4000),
  noteId: z.string().min(1),
  topK: z.number().int().positive().default(6).optional(),
});

interface PodcastMetadata {
  podcastId: string | null;
  speakers: string[];
  timeRange: string | null;
  sequenceRange: string | null;
}

interface ChunkResult {
  chunk_text: string;
}

/**
 * Maps our embedding service results to the format expected by createContextString
 * Handles both regular note chunks and podcast transcript chunks
 */
function mapChunkResults(results: ChunkResult[]): Array<{ chunkText: string; isPodcast: boolean; podcastMetadata?: PodcastMetadata }> {
  return results.map((result) => {
    const chunkText = result.chunk_text;
    const isPodcast = chunkText.includes('[PODCAST:');
    
    let podcastMetadata: PodcastMetadata | undefined = undefined;
    if (isPodcast) {
      // Extract podcast metadata from chunk text
      const podcastMatch = chunkText.match(/\[PODCAST:([^\]]+)\]/);
      const speakersMatch = chunkText.match(/\[SPEAKERS:([^\]]+)\]/);
      const timeMatch = chunkText.match(/\[TIME:([^\]]+)\]/);
      const sequenceMatch = chunkText.match(/\[SEQUENCE:([^\]]+)\]/);
      
      podcastMetadata = {
        podcastId: podcastMatch ? podcastMatch[1] : null,
        speakers: speakersMatch ? speakersMatch[1].split(',') : [],
        timeRange: timeMatch ? timeMatch[1] : null,
        sequenceRange: sequenceMatch ? sequenceMatch[1] : null
      };
    }
    
    return {
      chunkText,
      isPodcast,
      podcastMetadata
    };
  });
}

/**
 * Creates a context string from retrieved chunks
 * Handles both regular note content and podcast transcript chunks
 */
function createContextString(chunks: Array<{ chunkText: string; isPodcast: boolean; podcastMetadata?: PodcastMetadata }>): string {
  // If no chunks were found, return a message
  if (chunks.length === 0) {
    return "No relevant information found in this note.";
  }

  // Separate regular chunks from podcast chunks
  const regularChunks = chunks.filter(chunk => !chunk.isPodcast);
  const podcastChunks = chunks.filter(chunk => chunk.isPodcast);

  let context = '';

  // Add regular note content first
  if (regularChunks.length > 0) {
    context += 'NOTE CONTENT:\n';
    for (const chunk of regularChunks) {
      context += `${chunk.chunkText}\n\n`;
    }
  }

  // Add podcast transcript content with enhanced formatting
  if (podcastChunks.length > 0) {
    context += regularChunks.length > 0 ? '\nPODCAST TRANSCRIPT:\n' : 'PODCAST TRANSCRIPT:\n';
    
    for (const chunk of podcastChunks) {
      // Clean up the chunk text by removing metadata markers
      let cleanText = chunk.chunkText;
      
      // Remove metadata headers
      cleanText = cleanText.replace(/\[PODCAST:[^\]]+\]\s*/, '');
      cleanText = cleanText.replace(/\[SPEAKERS:[^\]]+\]\s*/, '');
      cleanText = cleanText.replace(/\[TIME:[^\]]+\]\s*/, '');
      cleanText = cleanText.replace(/\[SEQUENCE:[^\]]+\]\s*/, '');
      cleanText = cleanText.replace(/\[END_PODCAST_CHUNK\]\s*/, '');
      
      // Add timing information if available
      if (chunk.podcastMetadata?.timeRange) {
        const timeRange = chunk.podcastMetadata.timeRange;
        context += `[Timestamp: ${timeRange}s]\n${cleanText.trim()}\n\n`;
      } else {
        context += `${cleanText.trim()}\n\n`;
      }
    }
  }
  
  // Truncate if too long (around 15k chars to be safe)
  const MAX_CONTEXT_LENGTH = 15000;
  if (context.length > MAX_CONTEXT_LENGTH) {
    context = context.substring(0, MAX_CONTEXT_LENGTH) + '... (context truncated)';
  }
  
  return context;
}
/**
 * Generates a streaming response from OpenAI using the AI SDK
 */
async function generateResponse(context: string, question: string) {
  const systemPrompt = `You are a helpful assistant answering questions about a note and its associated content. 
  You must ONLY use information from the provided context. If the context doesn't contain 
  the information needed to answer the question, say "I don't know — check the note." 
  
  The context may include:
  - NOTE CONTENT: Original note text and documents
  - PODCAST TRANSCRIPT: AI-generated podcast conversations about the note content with timestamps
  
  When referencing podcast content:
  - You can mention which host (HOST1 or HOST2) said something
  - Include timestamp references when available (e.g., "at 2:30 in the podcast")
  - Clarify when information comes from the podcast discussion vs. the original note
  
  Provide clear, concise answers based on the context without including source references or citations.
  
  DO NOT make up information or hallucinate facts not present in the context.`;

  const result = await streamText({
    model: openai(CHAT_MODEL),
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Context:\n${context}\n\nQuestion: ${question}`
      }
    ],
    temperature: 0.7,
  });

  return result.toTextStreamResponse();
}


/**
 * POST handler for the chatbot API route
 */
export async function POST(req: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await req.json();
    const validationResult = RequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return Response.json({ error: 'Invalid request body', details: validationResult.error.issues }, { status: 400 });
    }
    
    const { message, noteId, topK = 6 } = validationResult.data;
    
    // Use our enhanced embedding service to find similar chunks
    const similarChunks = await querySimilarChunks(message, noteId, topK);
    
    // Map results to the expected format
    const mappedChunks = mapChunkResults(similarChunks);
    
    // Create a context string from the chunks
    const context = createContextString(mappedChunks);
    
    // Generate a streaming response
    const response = await generateResponse(context, message);
    
    // Return the streaming response from AI SDK
    return response;
  } catch (error) {
    console.error('Error handling chatbot request:', error);
    
    // Return a friendly error response
    return Response.json(
      { error: 'An error occurred while processing your request. Please try again later.' }, 
      { status: 500 }
    );
  }
}
