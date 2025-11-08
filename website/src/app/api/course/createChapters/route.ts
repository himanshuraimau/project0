// /api/course/createChapters

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { getUnsplashImage } from "@/lib/api/courses/unsplash";
import { prisma } from "@/lib/services/prisma";
import { auth } from "@clerk/nextjs/server";
import z from "zod";

const createChaptersSchema = z.object({
  title: z.string().min(2).max(100),
  units: z.array(z.string().min(2).max(100)),
});


export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { title, units } = createChaptersSchema.parse(body);

    // Limit to maximum 2 units for testing
    const limitedUnits = units.slice(0, 2);
    console.log(`Original units: ${units.length}, Limited to: ${limitedUnits.length}`);

    type outputUnits = {
      title: string;
      chapters: {
        youtube_search_query: string;
        chapter_title: string;
      }[];
    }[];

    const unitsSchema = z.object({
      units: z.array(z.object({
        title: z.string().describe("Title of the unit"),
        chapters: z.array(z.object({
          youtube_search_query: z.string().describe("Detailed YouTube search query for educational video"),
          chapter_title: z.string().describe("Title of the chapter")
        })).length(2).describe("Exactly 2 chapters per unit")
      }))
    });

    const unitsResult = await generateObject({
      model: openai("gpt-4o"),
      schema: unitsSchema,
      prompt: `You are an AI capable of curating course content, coming up with relevant chapter titles, and finding relevant youtube videos for each chapter.

Create a course about "${title}" with the following units: ${limitedUnits.join(", ")}

For each unit, create EXACTLY 2 chapters - no more, no less. Then, for each chapter, provide a detailed youtube search query that can be used to find an informative educational video for each chapter. Each query should give an educational informative course in youtube.`,
    });

    const output_units: outputUnits = unitsResult.object.units;

    const imageSearchSchema = z.object({
      image_search_term: z.string().describe("A good search term for the title of the course")
    });

    const imageSearchResult = await generateObject({
      model: openai("gpt-4o"),
      schema: imageSearchSchema,
      prompt: `You are an AI capable of finding the most relevant image for a course.

Please provide a good image search term for the title of a course about "${title}". This search term will be fed into the unsplash API, so make sure it is a good search term that will return good results.`,
    });

    const imageSearchTerm = imageSearchResult.object;

    const course_image = await getUnsplashImage(
      imageSearchTerm.image_search_term
    );

    const course = await prisma.course.create({
      data: {
        name: title,
        image: course_image,
        userId: userId,
      },
    });

    for (const unit of output_units) {
      const title = unit.title;
      const prismaUnit = await prisma.unit.create({
        data: {
          name: title,
          courseId: course.id,
        },
      });
      await prisma.chapter.createMany({
        data: unit.chapters.map((chapter) => {
          return {
            name: chapter.chapter_title,
            youtubeSearchQuery: chapter.youtube_search_query,
            unitId: prismaUnit.id,
          };
        }),
      });
    }

    return NextResponse.json({ course_id: course.id });
  } catch (error) {
    if (error instanceof ZodError) {
      return new NextResponse("invalid body", { status: 400 });
    }
    console.error(error);
  }
}
