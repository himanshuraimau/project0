import { CoursePageContent } from "@/components/course/CoursePageContent";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import React from "react";

type Props = {
  params: Promise<{
    slug: string[];
  }>;
};

const CoursePage = async ({ params }: Props) => {
  const { slug } = await params;
  const [courseId, unitIndexParam, chapterIndexParam] = slug;
  
  // Validate that we have all required parameters
  if (!courseId || !unitIndexParam || !chapterIndexParam) {
    return redirect("/dashboard");
  }
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      units: {
        include: {
          chapters: {
            include: { questions: true },
          },
        },
      },
    },
  });
  if (!course) {
    return redirect("/dashboard");
  }
  const unitIndex = parseInt(unitIndexParam);
  const chapterIndex = parseInt(chapterIndexParam);

  const unit = course.units[unitIndex];
  if (!unit) {
    return redirect("/dashboard");
  }
  const chapter = unit.chapters[chapterIndex];
  if (!chapter) {
    return redirect("/dashboard");
  }
  const nextChapter = unit.chapters[chapterIndex + 1];
  const prevChapter = unit.chapters[chapterIndex - 1];
  
  return (
    <CoursePageContent
      course={course}
      chapter={chapter}
      unitIndex={unitIndex}
      chapterIndex={chapterIndex}
      nextChapter={nextChapter}
      prevChapter={prevChapter}
    />
  );
};

export default CoursePage;