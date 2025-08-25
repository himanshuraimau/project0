import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { queryChapterSimilarChunks } from '@/lib/chapter-embedding-service';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

// Environment variables
const CHAT_MODEL = process.env.CHAT_MODEL || 'models/gemini-pro';
const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.OPENAI_API_KEY || process.env.VERCEL_AI_API_KEY;

// Validation schema for the request body
const RequestSchema = z.object({
  message: z.string().min(1).max(4000),
  chapterId: z.string().min(1),
  topK: z.number().int().positive().default(6).optional(),
});

// Initialize the Google AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || API_KEY || '');

/**
 * Maps our embedding service results to the format expected by createContextString
 */
function mapChunkResults(results: any[]): Array<{ chunkText: string }> {
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
    return "No relevant information found in this chapter.";
  }

  // Create a context string from the chunks, without citations
  let context = '';
  for (const chunk of chunks) {
    context += `${chunk.chunkText}\n\n`;
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
async function generateResponse(context: string, question: string, chapterName: string) {
  try {
    // Use GoogleGenerativeAI with ReadableStream conversion
    const model = genAI.getGenerativeModel({ model: CHAT_MODEL });
    
    const systemPrompt = `You are an AI teaching assistant for the chapter "${chapterName}". 
    You must ONLY use information from the provided chapter context (notes and transcript). 
    If the context doesn't contain the information needed to answer the question, say "I don't have that information in this chapter content." 
    
    Your role is to help students understand the chapter content by:
    1. Answering questions based on the chapter's notes and transcript
    2. Explaining concepts in a clear, educational manner
    3. Providing examples and clarifications when needed
    4. Encouraging deeper learning and critical thinking
    
    Provide clear, helpful answers based on the context without including any source references or citations.
    
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
 * POST handler for the chapter chatbot API route
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { userId } = await auth();
    const { chapterId } = await params;

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate the request body
    const body = await req.json();
    const validationResult = RequestSchema.safeParse({
      ...body,
      chapterId
    });
    
    if (!validationResult.success) {
      return Response.json({ error: 'Invalid request body', details: validationResult.error.issues }, { status: 400 });
    }
    
    const { message, topK = 6 } = validationResult.data;

    // Get the chapter
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: {
        id: true,
        name: true,
        notes: true,
        transcript: true,
      }
    });

    if (!chapter) {
      return Response.json({ error: 'Chapter not found' }, { status: 404 });
    }
    
    // Use our enhanced embedding service to find similar chunks
    const similarChunks = await queryChapterSimilarChunks(message, chapterId, topK);
    
    // Map results to the expected format
    const mappedChunks = mapChunkResults(similarChunks);
    
    // Create a context string from the chunks
    const context = createContextString(mappedChunks);
    
    // Generate a streaming response
    const stream = await generateResponse(context, message, chapter.name);
    
    // Return the streaming response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Error handling chapter chatbot request:', error);
    
    // Return a friendly error response
    return Response.json(
      { error: 'An error occurred while processing your request. Please try again later.' }, 
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  const { chapterId } = await params;
  
  return Response.json({
    message: `Chapter ${chapterId} chat endpoint is ready`,
    methods: ['POST']
  });
}