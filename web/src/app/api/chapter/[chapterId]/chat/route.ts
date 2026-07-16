import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { aiGateway, AI_MODELS } from '@/lib/ai/gateway';
import { z } from 'zod';
import { queryChapterSimilarChunks } from '@/lib/course/chapter-embedding-service';
import { prisma } from '@/lib/prisma';
import { getUserFromAuth } from '@/lib/auth-helper';

// Validation schema for the request body
const RequestSchema = z.object({
  message: z.string().min(1).max(4000),
  chapterId: z.string().min(1),
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
 * Generates a streaming response from OpenAI using the AI SDK
 */
async function generateResponse(context: string, question: string, chapterName: string) {
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

  const result = await streamText({
    model: aiGateway(AI_MODELS.chat),
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
 * POST handler for the chapter chatbot API route
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const userId = await getUserFromAuth(req);
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
    const response = await generateResponse(context, message, chapter.name);

    // Return the streaming response from AI SDK
    return response;
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