// /api/chapter/getInfo

import { prisma } from "@/lib/prisma"
import { strict_output } from "@/lib/course/ai-course-service"
import {
  getQuestionsFromTranscript,
  getTranscript,
  searchYoutube,
} from "@/lib/course/youtube"
import { NextResponse } from "next/server"
import { z } from "zod"

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

    let summaryResult: { summary: string };
    try {
      summaryResult = await strict_output(
        "You are an AI capable of summarising a youtube transcript",
        "summarise in 250 words or less and do not talk of the sponsors or anything unrelated to the main topic, also do not introduce what the summary is about.\n" +
          transcript,
        { summary: "summary of the transcript" }
      ) as { summary: string };
    } catch (summaryError) {
      console.error("Error generating summary:", summaryError);
      return NextResponse.json(
        { success: false, error: "Failed to generate chapter summary" },
        { status: 500 }
      );
    }
    
    const { summary } = summaryResult;
    
    if (!summary || summary.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Generated summary is empty" },
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
        summary,
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
