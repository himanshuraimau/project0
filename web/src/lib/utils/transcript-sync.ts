import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import type { TextChunk, TimestampData, TranscriptSyncData } from '@/lib/types/podcast';

/**
 * Transcript synchronization utilities using Vercel AI SDK
 * Handles both real-time highlighting and simulated progressive text reveal
 */

// AI model for transcript processing
const model = openai('gpt-4o-mini');

/**
 * Process transcript text into synchronized chunks using AI SDK
 */
export async function processTranscriptForSync(
  transcript: string,
  audioDuration?: number
): Promise<TranscriptSyncData> {
  try {
    // Use AI to intelligently chunk the transcript
    const result = await generateText({
      model,
      prompt: `
        Process this transcript text into logical chunks for audio synchronization.
        Each chunk should be a natural speaking segment (sentence or phrase).
        Return a JSON array of chunks with the following structure:
        [
          {
            "id": "chunk_1",
            "text": "First sentence or phrase",
            "speaker": "host" | "guest" | null
          }
        ]
        
        Guidelines:
        - Keep chunks between 10-50 words for optimal synchronization
        - Preserve natural speech boundaries
        - Identify speakers if multiple voices are present
        - Maintain original text formatting and punctuation
        
        Transcript:
        ${transcript}
      `,
      temperature: 0.1,
    });

    let chunks: TextChunk[] = [];
    
    try {
      const parsedChunks = JSON.parse(result.text);
      chunks = parsedChunks.map((chunk: any, index: number) => ({
        id: chunk.id || `chunk_${index + 1}`,
        text: chunk.text,
        speaker: chunk.speaker || undefined,
        startTime: undefined, // Will be calculated for simulated mode
        endTime: undefined,
      }));
    } catch (parseError) {
      console.warn('Failed to parse AI response, falling back to simple chunking:', parseError);
      chunks = createSimpleChunks(transcript);
    }

    // Calculate estimated timing for simulated mode
    if (audioDuration && chunks.length > 0) {
      chunks = calculateEstimatedTimings(chunks, audioDuration);
    }

    return {
      text: transcript,
      chunks,
      timestamps: undefined, // Real timestamps would come from ElevenLabs if available
    };
  } catch (error) {
    console.error('Error processing transcript with AI:', error);
    
    // Fallback to simple chunking
    const chunks = createSimpleChunks(transcript);
    if (audioDuration) {
      chunks.forEach((chunk, index) => {
        const progress = index / chunks.length;
        chunk.startTime = progress * audioDuration;
        chunk.endTime = ((index + 1) / chunks.length) * audioDuration;
      });
    }

    return {
      text: transcript,
      chunks,
      timestamps: undefined,
    };
  }
}

/**
 * Create simple text chunks as fallback
 */
function createSimpleChunks(text: string): TextChunk[] {
  // Split by sentences, keeping punctuation
  const sentences = text.match(/[^\.!?]+[\.!?]+/g) || [text];
  
  return sentences.map((sentence, index) => ({
    id: `chunk_${index + 1}`,
    text: sentence.trim(),
    speaker: undefined,
    startTime: undefined,
    endTime: undefined,
  }));
}

/**
 * Calculate estimated timings for chunks based on audio duration
 */
function calculateEstimatedTimings(chunks: TextChunk[], audioDuration: number): TextChunk[] {
  const totalWords = chunks.reduce((sum, chunk) => sum + chunk.text.split(' ').length, 0);
  let currentTime = 0;

  return chunks.map((chunk) => {
    const wordCount = chunk.text.split(' ').length;
    const chunkDuration = (wordCount / totalWords) * audioDuration;
    
    const startTime = currentTime;
    const endTime = currentTime + chunkDuration;
    currentTime = endTime;

    return {
      ...chunk,
      startTime,
      endTime,
    };
  });
}

/**
 * Find the active chunk based on current audio time
 */
export function findActiveChunk(
  chunks: TextChunk[],
  currentTime: number,
  syncMode: 'realtime' | 'simulated'
): TextChunk | null {
  if (syncMode === 'realtime') {
    // Use actual timestamps if available
    return chunks.find(chunk => 
      chunk.startTime !== undefined && 
      chunk.endTime !== undefined &&
      currentTime >= chunk.startTime && 
      currentTime <= chunk.endTime
    ) || null;
  } else {
    // Simulated mode - use estimated timings
    return chunks.find(chunk => 
      chunk.startTime !== undefined && 
      chunk.endTime !== undefined &&
      currentTime >= chunk.startTime && 
      currentTime <= chunk.endTime
    ) || null;
  }
}

/**
 * Get highlighted text with current chunk emphasized
 */
export function getHighlightedText(
  chunks: TextChunk[],
  activeChunk: TextChunk | null,
  currentTime: number,
  syncMode: 'realtime' | 'simulated'
): string {
  if (!activeChunk) {
    return chunks.map(chunk => chunk.text).join(' ');
  }

  return chunks.map(chunk => {
    if (chunk.id === activeChunk.id) {
      return `<mark class="bg-yellow-200 dark:bg-yellow-800 transition-colors duration-300">${chunk.text}</mark>`;
    }
    
    // For simulated mode, show progressive reveal
    if (syncMode === 'simulated' && chunk.startTime !== undefined && currentTime > chunk.startTime) {
      return `<span class="text-gray-600 dark:text-gray-400">${chunk.text}</span>`;
    }
    
    return chunk.text;
  }).join(' ');
}

/**
 * Calculate progress percentage for the transcript
 */
export function calculateTranscriptProgress(
  chunks: TextChunk[],
  currentTime: number
): number {
  if (chunks.length === 0) return 0;

  const lastChunk = chunks[chunks.length - 1];
  const totalDuration = lastChunk.endTime || 0;
  
  if (totalDuration === 0) return 0;
  
  return Math.min((currentTime / totalDuration) * 100, 100);
}

/**
 * Enhance transcript with AI-powered formatting and structure
 */
export async function enhanceTranscriptFormatting(transcript: string): Promise<string> {
  try {
    const result = await generateText({
      model,
      prompt: `
        Enhance this transcript for better readability while preserving the original content.
        
        Tasks:
        1. Add proper paragraph breaks for natural reading flow
        2. Fix obvious transcription errors (but keep the meaning intact)
        3. Add speaker labels if multiple voices are detected
        4. Improve punctuation for clarity
        5. Maintain the conversational tone and style
        
        Return only the enhanced transcript text, no additional formatting or explanations.
        
        Original transcript:
        ${transcript}
      `,
      temperature: 0.2,
    });

    return result.text.trim();
  } catch (error) {
    console.error('Error enhancing transcript formatting:', error);
    return transcript; // Return original if enhancement fails
  }
}

/**
 * Extract key topics and timestamps for navigation
 */
export async function extractTranscriptTopics(
  chunks: TextChunk[]
): Promise<Array<{ topic: string; timestamp: number; chunkId: string }>> {
  try {
    const transcriptText = chunks.map(chunk => chunk.text).join(' ');
    
    const result = await generateText({
      model,
      prompt: `
        Analyze this transcript and extract 5-8 key topics or sections.
        For each topic, provide a brief title and estimate which part of the transcript it relates to.
        
        Return a JSON array with this structure:
        [
          {
            "topic": "Brief topic title",
            "position": 0.25
          }
        ]
        
        Where position is a decimal between 0 and 1 representing the relative position in the transcript.
        
        Transcript:
        ${transcriptText}
      `,
      temperature: 0.3,
    });

    try {
      const topics = JSON.parse(result.text);
      return topics.map((topic: any, index: number) => {
        const chunkIndex = Math.floor(topic.position * chunks.length);
        const chunk = chunks[chunkIndex] || chunks[0];
        
        return {
          topic: topic.topic,
          timestamp: chunk.startTime || 0,
          chunkId: chunk.id,
        };
      });
    } catch (parseError) {
      console.warn('Failed to parse topics response:', parseError);
      return [];
    }
  } catch (error) {
    console.error('Error extracting transcript topics:', error);
    return [];
  }
}

/**
 * Utility to debounce transcript updates for performance
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Validate transcript sync data structure
 */
export function validateTranscriptSyncData(data: any): data is TranscriptSyncData {
  return (
    data &&
    typeof data.text === 'string' &&
    Array.isArray(data.chunks) &&
    data.chunks.every((chunk: any) => 
      chunk.id && 
      typeof chunk.text === 'string'
    )
  );
}