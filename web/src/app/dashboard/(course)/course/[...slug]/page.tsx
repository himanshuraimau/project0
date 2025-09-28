import { CourseContentTabs } from "@/components/course/CourseContentTabs";
import { prisma } from "@/lib/prisma";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
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
    <>
      {/* Course Content */}
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Course Header */}
        <header className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {course.name}
            </p>
          </div>
          <div>
            <p className="text-base text-muted-foreground">
              Unit {unitIndex + 1} · Chapter {chapterIndex + 1}
            </p>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {chapter.name}
          </h1>
        </header>

        {/* Main Content */}
        <div className="space-y-8">
          <CourseContentTabs 
            chapter={chapter}
            unit={unit}
            unitIndex={unitIndex}
            chapterIndex={chapterIndex}
          />
        </div>

        {/* Navigation Section */}
        <div className="border-t border-border pt-8">
          <div className="flex items-center justify-between gap-4">
            {prevChapter ? (
              <Link
                href={`/dashboard/course/${course.id}/${unitIndex}/${chapterIndex - 1}`}
                className="group inline-flex items-center gap-4 rounded-xl bg-muted px-6 py-4 text-sm font-medium text-foreground transition-all hover:bg-muted/80 hover:shadow-sm"
              >
                <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
                <div className="text-left">
                  <div className="text-xs text-muted-foreground mb-1">Previous</div>
                  <div className="font-semibold text-base">{prevChapter.name}</div>
                </div>
              </Link>
            ) : (
              <div></div>
            )}

            {nextChapter ? (
              <Link
                href={`/dashboard/course/${course.id}/${unitIndex}/${chapterIndex + 1}`}
                className="group inline-flex items-center gap-4 rounded-xl bg-primary px-6 py-4 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-sm"
              >
                <div className="text-right">
                  <div className="text-xs text-primary-foreground/80 mb-1">Next</div>
                  <div className="font-semibold text-base">{nextChapter.name}</div>
                </div>
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <div></div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden course data for sidebar */}
      <script
        id="course-data"
        type="application/json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            course,
            currentChapterId: chapter.id
          })
        }}
      />
    </>
  );
};

export default CoursePage;