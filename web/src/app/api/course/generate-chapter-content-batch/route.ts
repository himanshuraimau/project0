import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isValidUserId } from "@/lib/utils/validation";
import { searchYoutube, getTranscript, getQuestionsFromTranscript } from "@/lib/course/youtube";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { prisma } from "@/lib/prisma";
import { indexChapterContent } from "@/lib/course/chapter-embedding-service";

/**
 * Batch chapter content generation endpoint - processes chapter content (YouTube videos, etc.) in batches
 * This endpoint generates actual content for chapters rather than just structure
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const userId = await getUserFromAuth(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Validate user ID format for security
    if (!isValidUserId(userId)) {
      return NextResponse.json(
        { error: "Invalid user session" },
        { status: 401 }
      );
    }

    // Parse request body
    let body: {
      courseTitle: string;
      chapters: Array<{
        id: string;
        name: string;
        youtubeSearchQuery: string;
        unitId: string;
      }>;
      batchIndex?: number;
    };
    
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { courseTitle, chapters, batchIndex = 0 } = body;

    // Validate batch size (should be reasonable to prevent overload)
    if (chapters.length > 6) {
      return NextResponse.json(
        { error: "Batch size too large. Maximum 6 chapters per batch." },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!courseTitle || !chapters || chapters.length === 0) {
      return NextResponse.json(
        { error: "Course title and chapters are required" },
        { status: 400 }
      );
    }

    // Validate each chapter has required fields
    for (const chapter of chapters) {
      if (!chapter.id || !chapter.name || !chapter.youtubeSearchQuery || !chapter.unitId) {
        return NextResponse.json(
          { error: "Each chapter must have id, name, youtubeSearchQuery, and unitId" },
          { status: 400 }
        );
      }
    }

    console.log(`Processing content batch ${batchIndex} with ${chapters.length} chapters`);

    // Process all chapters in parallel for true batch processing
    console.log(`Processing ${chapters.length} chapters in parallel...`);
    
    const processChapter = async (chapter: any) => {
      try {
        console.log(`Processing chapter: ${chapter.name}`);
        
        // 1. Search for YouTube video
        const videoId = await searchYoutube(chapter.youtubeSearchQuery);
        if (!videoId) {
          console.log(`No video found for: ${chapter.youtubeSearchQuery}`);
          return {
            id: chapter.id,
            name: chapter.name,
            youtubeSearchQuery: chapter.youtubeSearchQuery,
            unitId: chapter.unitId,
            status: 'failed',
            error: 'No suitable video found'
          };
        }

        // 2. Get transcript
        const transcript = await getTranscript(videoId);
        if (!transcript || transcript.trim().length === 0) {
          console.log(`No transcript available for video: ${videoId}`);
          return {
            id: chapter.id,
            name: chapter.name,
            youtubeSearchQuery: chapter.youtubeSearchQuery,
            unitId: chapter.unitId,
            status: 'failed',
            error: 'No transcript available'
          };
        }

        // Limit transcript for processing
        const processedTranscript = transcript.split(" ").slice(0, 500).join(" ");

        // 3. Generate educational notes
        const result = await generateText({
          model: openai("gpt-4o"),
          prompt: `You are an advanced AI educational content specialist and master educator. Your mission is to transform YouTube video transcripts into engaging, comprehensive, and interactive learning materials that captivate students and ensure deep understanding.

YOUR ROLE: Create educational notes that are not just informative, but engaging and memorable. Think of yourself as an effective teacher who makes learning accessible.

TRANSFORMATION GOAL: Convert this YouTube transcript into interactive educational notes that enable deep understanding and retention.

REQUIRED STRUCTURE:

## Learning Overview (100-150 words)
- What you'll master in this chapter
- Why this knowledge is valuable
- How it connects to the bigger picture
- Key skills you'll develop

## Core Concepts Explained (200-400 words)
- Detailed explanations with clear reasoning
- Break down complex topics into digestible parts
- Show connections between different concepts
- Use analogies and examples for clarity
- Highlight important insights

## Practical Applications (100-200 words)
- Real-world examples and use cases
- How professionals use these concepts
- Industry applications and scenarios
- Interactive examples where possible
- Best practices and tips

## Key Takeaways (50-100 words)
- Essential points for long-term retention
- Important principles to remember
- Critical concepts to understand
- Quick reference points

## Next Steps & Action Items (50-100 words)
- Practical exercises to try
- What to explore next
- Immediate action steps
- How to continue learning

STYLE GUIDELINES:
- Write in an encouraging and clear tone
- Include bullet points and clear formatting
- Add emphasis with **bold** and *italics* when appropriate
- Make technical concepts accessible
- Use action words and engaging language
- Add occasional "Pro Tips" or "Quick Notes" callouts

Focus on the main educational content and ignore sponsors, ads, or unrelated material.

Transcript: ${processedTranscript}`,
        });

        const notes = result.text;

        // 4. Generate quiz questions
        const questions = await getQuestionsFromTranscript(processedTranscript, chapter.name);

        // 5. Save to database
        await prisma.chapter.update({
          where: { id: chapter.id },
          data: {
            videoId,
            notes,
            transcript: processedTranscript,
          },
        });

        // 6. Save questions to database
        if (questions && questions.length > 0) {
          await prisma.question.createMany({
            data: questions.map((q) => {
              const options = [q.answer, q.option1, q.option2, q.option3].filter(Boolean);
              return {
                question: q.question,
                answer: q.answer,
                options: JSON.stringify(options.sort(() => Math.random() - 0.5)),
                chapterId: chapter.id,
              };
            }),
          });
        }

        // 7. Index content for search
        try {
          await indexChapterContent(chapter.id, notes, processedTranscript);
        } catch (indexError) {
          console.error(`Failed to index chapter ${chapter.id}:`, indexError);
          // Don't fail the request if indexing fails
        }

        console.log(`Successfully processed chapter: ${chapter.name}`);
        
        return {
          id: chapter.id,
          name: chapter.name,
          youtubeSearchQuery: chapter.youtubeSearchQuery,
          unitId: chapter.unitId,
          status: 'completed',
          videoUrl: `https://youtube.com/watch?v=${videoId}`,
          notesLength: notes.length,
          questionsCount: questions?.length || 0
        };
        
      } catch (error) {
        console.error(`Error processing chapter ${chapter.name}:`, error);
        return {
          id: chapter.id,
          name: chapter.name,
          youtubeSearchQuery: chapter.youtubeSearchQuery,
          unitId: chapter.unitId,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    };

    // Process all chapters in parallel using Promise.all
    const processedChapters = await Promise.all(chapters.map(processChapter));

    // Calculate batch statistics
    const successfulChapters = processedChapters.filter(c => c.status === 'completed');
    const failedChapters = processedChapters.filter(c => c.status === 'failed');

    // Return successful response with batch information
    const response = {
      processedChapters,
      batchIndex,
      batchSize: chapters.length,
      successCount: successfulChapters.length,
      failureCount: failedChapters.length,
      status: failedChapters.length === 0 ? 'success' : 'partial_success'
    };

    console.log(`Successfully processed content batch ${batchIndex}: ${successfulChapters.length}/${chapters.length} chapters completed successfully`);

    return NextResponse.json(response, { 
      status: 200
    });

  } catch (error) {
    console.error("Error in generate-chapter-content-batch API:", error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("required") || 
          error.message.includes("invalid")) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      
      if (error.message.includes("service unavailable")) {
        return NextResponse.json(
          { error: "Content generation service temporarily unavailable. Please try again." },
          { status: 503 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      { error: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
}