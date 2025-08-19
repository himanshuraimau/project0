// /api/course/createChapters

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { strict_output } from "@/lib/course/gemini";
import { getUnsplashImage } from "@/lib/course/unsplash";
import { prisma } from "@/lib/prisma";
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

    const output_units: outputUnits = await strict_output(
      "You are an AI capable of curating course content, coming up with relevant chapter titles, and finding relevant youtube videos for each chapter",
      new Array(limitedUnits.length).fill(
        `It is your job to create a course about ${title}. The user has requested to create chapters for each of the units. Create EXACTLY 2 chapters per unit - no more, no less. Then, for each chapter, provide a detailed youtube search query that can be used to find an informative educational video for each chapter. Each query should give an educational informative course in youtube.`
      ),
      {
        title: "title of the unit",
        chapters:
          "an array of exactly 2 chapters, each chapter should have a youtube_search_query and a chapter_title key in the JSON object",
      }
    ) as outputUnits;

    const imageSearchTerm = await strict_output(
      "you are an AI capable of finding the most relevant image for a course",
      `Please provide a good image search term for the title of a course about ${title}. This search term will be fed into the unsplash API, so make sure it is a good search term that will return good results`,
      {
        image_search_term: "a good search term for the title of the course",
      }
    ) as { image_search_term: string };

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
