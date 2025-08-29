// /api/chapter/info

import { prisma } from "@/lib/prisma"
import {
  getQuestionsFromTranscript,
  getTranscript,
  searchYoutube,
} from "@/lib/course/youtube"
import { z } from "zod"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { indexChapterContent } from "@/lib/chapter-embedding-service"
import { auth } from "@clerk/nextjs/server"
import { 
  createSuccessResponse, 
  handleApiError
} from "@/lib/utils/api-error-handler";
import { 
  AppErrorType, 
  createAppError 
} from "@/lib/utils/enhanced-error-handler";

const bodyParser = z.object({
  chapterId: z.union([z.string(), z.number()]).transform(String),
})

export async function POST(req: Request) {
  const startTime = Date.now();
  
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      throw createAppError(AppErrorType.AUTHENTICATION_FAILED);
    }

    const body = await req.json()
    console.log("Chapter processing started for user:", userId, "at", new Date().toISOString())

    let parsedData;
    try {
      parsedData = bodyParser.parse(body);
    } catch (parseError) {
      if (parseError instanceof z.ZodError) {
        throw createAppError(
          AppErrorType.INVALID_INPUT,
          { zodErrors: parseError.issues },
          "Invalid chapter ID format"
        );
      }
      throw createAppError(AppErrorType.INVALID_INPUT);
    }

    const { chapterId } = parsedData;
    console.log("Parsed chapterId:", chapterId)

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
    })
    console.log("Found chapter:", chapter)

    if (!chapter) {
      throw createAppError(
        AppErrorType.RECORD_NOT_FOUND,
        { chapterId },
        "Chapter not found"
      );
    }

    if (!chapter.youtubeSearchQuery) {
      throw createAppError(
        AppErrorType.INVALID_INPUT,
        { chapterId },
        "Chapter has no YouTube search query configured"
      );
    }

    // Check if chapter already has content (video processed)
    if (chapter.videoId && chapter.notes && chapter.transcript) {
      return createSuccessResponse({ 
        message: "Chapter already processed",
        videoId: chapter.videoId 
      });
    }

    console.log("Searching YouTube for:", chapter.youtubeSearchQuery)
    
    let videoId: string | null;
    try {
      videoId = await searchYoutube(chapter.youtubeSearchQuery);
    } catch (error) {
      throw createAppError(
        AppErrorType.YOUTUBE_API_FAILED,
        { query: chapter.youtubeSearchQuery, error: error instanceof Error ? error.message : String(error) },
        "Failed to search YouTube for relevant videos"
      );
    }

    console.log("VideoId found:", videoId)

    if (!videoId) {
      throw createAppError(
        AppErrorType.YOUTUBE_VIDEO_NOT_FOUND,
        { query: chapter.youtubeSearchQuery },
        "No suitable educational videos found for this topic"
      );
    }

    console.log("Fetching transcript for video:", videoId)
    
    let transcript: string;
    try {
      transcript = await getTranscript(videoId);
    } catch (error) {
      throw createAppError(
        AppErrorType.TRANSCRIPT_UNAVAILABLE,
        { videoId, error: error instanceof Error ? error.message : String(error) },
        "Failed to retrieve video transcript"
      );
    }

    console.log("Transcript length:", transcript?.length)

    if (!transcript || transcript.trim().length === 0) {
      console.log(`No transcript available for video: ${videoId}`)
      throw createAppError(
        AppErrorType.TRANSCRIPT_UNAVAILABLE,
        { videoId },
        "This video doesn't have a transcript available"
      );
    }

    // Limit transcript to reasonable length for processing
    transcript = transcript.split(" ").slice(0, 500).join(" ")

    let notes: string;
    try {
      const result = await generateText({
        model: openai("gpt-4o"),
        prompt: `You are an advanced AI educational content specialist, designed to transform YouTube video transcripts into comprehensive, tutorial-style learning materials. Your mission is to create detailed educational notes that not only summarize content but teach concepts thoroughly, as if you were an expert educator helping someone achieve complete mastery of the subject.

Transform this YouTube transcript into comprehensive educational notes that enable deep understanding:

EDUCATIONAL STRUCTURE REQUIRED:
1. **Learning Overview (100-150 words):** What you'll learn and why it matters
2. **Key Concepts Explained (200-400 words):** Detailed explanations of main topics with clear reasoning  
3. **Practical Applications (100-200 words):** Real-world examples and use cases
4. **Important Takeaways (50-100 words):** Essential points for retention
5. **Next Steps (50-100 words):** How to apply or continue learning

Make explanations clear and educational, as if teaching someone who needs to truly understand the concepts. Focus on the main educational content and ignore sponsors or unrelated material.

Transcript: ${transcript}`,
      });

      notes = result.text;
    } catch (notesError) {
      console.error("Error generating notes:", notesError);
      throw createAppError(
        AppErrorType.AI_SERVICE_UNAVAILABLE,
        { error: notesError instanceof Error ? notesError.message : String(notesError) },
        "Failed to generate educational notes from transcript"
      );
    }

    if (!notes || notes.trim().length === 0) {
      throw createAppError(
        AppErrorType.AI_SERVICE_UNAVAILABLE,
        { videoId },
        "AI service returned empty notes"
      );
    }

    let questions;
    try {
      questions = await getQuestionsFromTranscript(transcript, chapter.name);
    } catch (error) {
      throw createAppError(
        AppErrorType.AI_SERVICE_UNAVAILABLE,
        { error: error instanceof Error ? error.message : String(error) },
        "Failed to generate quiz questions from transcript"
      );
    }

    console.log("Questions generated:", questions?.length)

    if (!questions?.length) {
      throw createAppError(
        AppErrorType.AI_SERVICE_UNAVAILABLE,
        { chapterName: chapter.name },
        "No quiz questions could be generated for this content"
      );
    }

    // Save questions to database
    try {
      await prisma.question.createMany({
        data: questions.map((q) => {
          const options = [q.answer, q.option1, q.option2, q.option3].filter(
            Boolean
          )
          return {
            question: q.question,
            answer: q.answer,
            options: JSON.stringify(options.sort(() => Math.random() - 0.5)),
            chapterId,
          }
        }),
      })
    } catch (error) {
      throw createAppError(
        AppErrorType.DATABASE_CONSTRAINT_VIOLATION,
        { error: error instanceof Error ? error.message : String(error) },
        "Failed to save quiz questions to database"
      );
    }

    // Update chapter with processed content
    try {
      await prisma.chapter.update({
        where: { id: chapterId },
        data: {
          videoId,
          notes,
          transcript,
        },
      })
    } catch (error) {
      throw createAppError(
        AppErrorType.DATABASE_CONSTRAINT_VIOLATION,
        { error: error instanceof Error ? error.message : String(error) },
        "Failed to save chapter content to database"
      );
    }

    // Index the chapter content for chatbot functionality
    try {
      await indexChapterContent(chapterId, notes, transcript);
      console.log(`Successfully indexed content for chapter ${chapterId}`);
    } catch (indexError) {
      console.error(`Failed to index chapter ${chapterId}:`, indexError);
      // Don't fail the main request if indexing fails - this is a non-critical feature
    }

    const processingTime = Date.now() - startTime;
    console.log(`Chapter ${chapterId} processed successfully in ${processingTime}ms`);

    return createSuccessResponse({ 
      message: "Chapter processed successfully",
      videoId,
      notesLength: notes.length,
      questionsCount: questions.length,
      processingTimeMs: processingTime
    });

  } catch (error: unknown) {
    return handleApiError(error, {
      endpoint: 'chapter-getInfo',
      userId: req.headers.get?.('x-user-id') || 'unknown'
    });
  }
}
