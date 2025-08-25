// /api/chapter/getInfo

import { prisma } from "@/lib/prisma"
import {
  getQuestionsFromTranscript,
  getTranscript,
  searchYoutube,
} from "@/lib/course/youtube"
import { NextResponse } from "next/server"
import { z } from "zod"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

const bodyParser = z.object({
  chapterId: z.union([z.string(), z.number()]).transform(String),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("Body received:", body)

    const { chapterId } = bodyParser.parse(body)
    console.log("Parsed chapterId:", chapterId)

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
    })
    console.log("Found chapter:", chapter)

    if (!chapter) {
      return NextResponse.json(
        { success: false, error: "Chapter not found" },
        { status: 404 }
      )
    }

    if (!chapter.youtubeSearchQuery) {
      return NextResponse.json(
        { success: false, error: "No youtubeSearchQuery set" },
        { status: 400 }
      )
    }

    console.log("Searching YouTube for:", chapter.youtubeSearchQuery)
    const videoId = await searchYoutube(chapter.youtubeSearchQuery)
    console.log("VideoId found:", videoId)
    
    if (!videoId) {
      return NextResponse.json(
        { success: false, error: "No suitable videos found for the search query" },
        { status: 400 }
      )
    }

    console.log("Fetching transcript for video:", videoId)
    let transcript = await getTranscript(videoId)
    console.log("Transcript length:", transcript?.length)
    
    if (!transcript || transcript.trim().length === 0) {
      console.log(`No transcript available for video: ${videoId}`)
      return NextResponse.json(
        { success: false, error: `No transcript available for video: ${videoId}` },
        { status: 400 }
      )
    }

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
      return NextResponse.json(
        { success: false, error: "Failed to generate chapter notes" },
        { status: 500 }
      );
    }
    
    if (!notes || notes.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Generated notes are empty" },
        { status: 500 }
      );
    }

    const questions = await getQuestionsFromTranscript(
      transcript,
      chapter.name
    )
    console.log("Questions generated:", questions?.length)

    if (!questions?.length) {
      return NextResponse.json(
        { success: false, error: "No questions generated" },
        { status: 400 }
      )
    }

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

    await prisma.chapter.update({
      where: { id: chapterId },
      data: {
        videoId,
        notes,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("API Error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid body" },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: error.message || "unknown" },
      { status: 500 }
    )
  }
}
