import { NextRequest } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { z } from 'zod';
import { querySimilarChunks } from '@/lib/api/courses/embedding-service';

// Environment variables
const CHAT_MODEL = process.env.CHAT_MODEL || 'gpt-4o-mini';

// Validation schema for the request body
const RequestSchema = z.object({
  message: z.string().min(1).max(4000),
  noteId: z.string().min(1),
  topK: z.number().int().positive().default(6).optional(),
});

interface ChunkResult {
  chunk_text: string;
}

/**
 * Maps our embedding service results to the format expected by createContextString
 */
function mapChunkResults(results: ChunkResult[]): Array<{ chunkText: string }> {
  return results.map((result) => ({
    chunkText: result.chunk_text
  }));
}

/**
 * Creates a context string from retrieved chunks
 */
function createContextString(chunks: Array<{ chunkText: string }>): string {
  // If no chunks were found, return a message
  if (chunks.length === 0) {
    return "No relevant information found in this note.";
  }

  let context = '';

  // Add note content
  if (chunks.length > 0) {
    context += 'NOTE CONTENT:\n';
    for (const chunk of chunks) {
      context += `${chunk.chunkText}\n\n`;
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
  const systemPrompt = `You are a helpful AI assistant answering questions about a user's note. 

IMPORTANT: You MUST use the information provided in the context below to answer questions. The context contains relevant excerpts from the user's note content.

Your responsibilities:
1. Answer questions based ONLY on the provided context
2. If the context contains relevant information, provide a helpful and detailed answer
3. If the context doesn't contain enough information to answer the question, say "I need more specific information from your note to answer that question properly."
4. Be conversational and helpful
5. Don't make up information not present in the context

The context includes:
- NOTE CONTENT: Original note text and documents  

When referencing information, you can mention it comes from "your note" or "the content you provided."

Provide clear, helpful responses that make use of the available context.`;

  const result = await streamText({
    model: openai(CHAT_MODEL),
    system: systemPrompt,
    prompt: `Context from the user's note:
${context}

User question: ${question}

Please provide a helpful answer based on the context above.`,
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
    
    // Debug logging to understand what's happening
    console.log('🔍 Similar chunks found:', similarChunks.length);
    if (similarChunks.length > 0) {
      console.log('📄 First chunk preview:', similarChunks[0].chunk_text?.substring(0, 200) + '...');
    }
    
    // Map results to the expected format
    const mappedChunks = mapChunkResults(similarChunks);
    
    // Create a context string from the chunks
    const context = createContextString(mappedChunks);
    
    console.log('📝 Context length:', context.length);
    console.log('📝 Context preview:', context.substring(0, 300) + '...');
    
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