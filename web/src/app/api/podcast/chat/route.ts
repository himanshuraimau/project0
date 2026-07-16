import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { aiGateway, AI_MODELS } from '@/lib/ai/gateway';
import { z } from 'zod';

// Validation schema for the request body
const RequestSchema = z.object({
  message: z.string().min(1).max(4000),
  podcastId: z.string().min(1),
  transcript: z.array(z.object({
    speaker: z.string(),
    text: z.string(),
    timestamp: z.string().optional(),
  })),
});

/**
 * Creates a context string from podcast transcript
 */
function createTranscriptContext(transcript: Array<{ speaker: string; text: string; timestamp?: string }>): string {
  if (transcript.length === 0) {
    return "No transcript available.";
  }

  let context = 'PODCAST TRANSCRIPT:\n\n';

  for (const item of transcript) {
    const timestamp = item.timestamp ? `[${item.timestamp}] ` : '';
    context += `${timestamp}${item.speaker}: ${item.text}\n\n`;
  }

  // Truncate if too long (around 20k chars to be safe)
  const MAX_CONTEXT_LENGTH = 20000;
  if (context.length > MAX_CONTEXT_LENGTH) {
    context = context.substring(0, MAX_CONTEXT_LENGTH) + '... (transcript truncated)';
  }

  return context;
}

/**
 * Generates a streaming response from OpenAI using the AI SDK
 */
async function generateResponse(transcript: Array<{ speaker: string; text: string; timestamp?: string }>, question: string) {
  const context = createTranscriptContext(transcript);

  const systemPrompt = `You are a helpful AI assistant answering questions about a podcast. 

IMPORTANT: You MUST use the information provided in the podcast transcript below to answer questions. The transcript contains the full conversation between the podcast hosts.

Your responsibilities:
1. Answer questions based ONLY on what was discussed in the podcast transcript
2. If the transcript contains relevant information, provide a helpful and detailed answer
3. If the transcript doesn't contain enough information to answer the question, say "That topic wasn't specifically covered in this podcast."
4. Be conversational and helpful, as if you're another person who listened to the podcast
5. Don't make up information not present in the transcript
6. You can reference what the speakers (Leo and Maya) said if helpful
7. Provide timestamps when referencing specific parts of the discussion if available

When answering:
- Be concise but thorough
- Cite what was actually said in the podcast
- Help the user understand the key points discussed
- If a topic was mentioned multiple times, you can summarize the overall discussion

Provide clear, helpful responses based on the podcast content.`;

  const result = await streamText({
    model: aiGateway(AI_MODELS.chat),
    system: systemPrompt,
    prompt: `Here is the podcast transcript:

${context}

User question: ${question}

Please provide a helpful answer based on what was discussed in the podcast.`,
    temperature: 0.7,
  });

  return result.toTextStreamResponse();
}

/**
 * POST handler for the podcast chatbot API route
 */
export async function POST(req: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await req.json();
    const validatedData = RequestSchema.parse(body);

    const { message, transcript } = validatedData;

    // Generate and return the streaming response
    return await generateResponse(transcript, message);
  } catch (error) {
    console.error('Podcast chatbot error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request data',
          details: error.name,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle other errors
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
