import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { querySimilarChunks } from '../../../lib/embedding-service';

// Environment variables
const CHAT_MODEL = process.env.CHAT_MODEL || 'models/gemini-pro';
const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.OPENAI_API_KEY || process.env.VERCEL_AI_API_KEY;

// Validation schema for the request body
const RequestSchema = z.object({
  message: z.string().min(1).max(4000),
  noteId: z.string().min(1),
  topK: z.number().int().positive().default(6).optional(),
});

// Initialize the Google AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || API_KEY || '');

/**
 * Maps our embedding service results to the format expected by createContextString
 */
function mapChunkResults(results: any[]): Array<{ noteId: string; chunkIndex: number; chunkText: string; }> {
  return results.map((result, index) => ({
    noteId: result.note_id,
    chunkIndex: index, // Use the array index as the chunkIndex for citations
    chunkText: result.chunk_text
  }));
}

/**
 * Creates a context string from retrieved chunks
 */
function createContextString(chunks: Array<{ noteId: string; chunkIndex: number; chunkText: string; }>): string {
  // If no chunks were found, return a message
  if (chunks.length === 0) {
    return "No relevant information found in this note.";
  }

  // Create a context string from the chunks, with citations
  let context = '';
  let index = 0;
  for (const chunk of chunks) {
    // Use the loop index since we don't have real chunk indices in the database
    context += `[[source ${chunk.noteId}:${index}]]\n${chunk.chunkText}\n\n`;
    index++;
  }
  
  // Truncate if too long (around 15k chars to be safe)
  const MAX_CONTEXT_LENGTH = 15000;
  if (context.length > MAX_CONTEXT_LENGTH) {
    context = context.substring(0, MAX_CONTEXT_LENGTH) + '... (context truncated)';
  }
  
  return context;
}
/**
 * Generates a streaming response from the model
 */
async function generateResponse(context: string, question: string) {
  try {
    // Use GoogleGenerativeAI with ReadableStream conversion
    const model = genAI.getGenerativeModel({ model: CHAT_MODEL });
    
    const systemPrompt = `You are a helpful assistant answering questions about a note. 
    You must ONLY use information from the provided context. If the context doesn't contain 
    the information needed to answer the question, say "I don't know — check the note." 
    
    When referencing information, cite the source chunk number using the format (noteId:chunkIndex). 
    
    DO NOT make up information or hallucinate facts not present in the context.`;

    // Create a generative response with stream option
    const result = await model.generateContentStream({
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'user', parts: [{ text: `Context:\n${context}\n\nQuestion: ${question}` }] }
      ],
    });
    
    // Convert to a ReadableStream
    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });
  } catch (error) {
    console.error('Error generating response:', error);
    throw error;
  }
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
    const stream = await generateResponse(context, message);
    
    // Return the streaming response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Error handling chatbot request:', error);
    
    // Return a friendly error response
    return Response.json(
      { error: 'An error occurred while processing your request. Please try again later.' }, 
      { status: 500 }
    );
  }
}
