import CourseSideBar from "@/components/course/CourseSideBar";
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
    <div className="flex min-h-screen bg-background">
      {/* Sticky Sidebar */}
      <aside className="sticky top-0 h-screen w-[320px] bg-card z-10">
        <CourseSideBar course={course} currentChapterId={chapter.id} />
      </aside>
      <main className="flex-1 px-8 py-10">
        <div className="max-w-7xl mx-auto">
          {/* Chapter Header */}
          <div className="mb-8">
            <h4 className="text-xs uppercase text-muted-foreground tracking-wide mb-2">
              Unit {unitIndex + 1} &bull; Chapter {chapterIndex + 1}
            </h4>
            <h1 className="text-3xl font-bold text-foreground">{chapter.name}</h1>
          </div>

          {/* Main Content with Tabs */}
          <div className="mb-8">
            <CourseContentTabs 
              chapter={chapter}
              unit={unit}
              unitIndex={unitIndex}
              chapterIndex={chapterIndex}
            />
          </div>

          {/* Divider */}
          <div className="h-[1px] w-full my-6 bg-border" />

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pb-8">
            {prevChapter ? (
              <Link
                href={`/dashboard/course/${course.id}/${unitIndex}/${chapterIndex - 1}`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-muted hover:bg-accent transition-colors shadow text-foreground"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                <div className="flex flex-col items-start">
                  <span className="text-xs text-muted-foreground">Previous</span>
                  <span className="text-base font-semibold">{prevChapter.name}</span>
                </div>
              </Link>
            ) : <span />}

            {nextChapter ? (
              <Link
                href={`/dashboard/course/${course.id}/${unitIndex}/${chapterIndex + 1}`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/80 transition-colors shadow"
              >
                <div className="flex flex-col items-end">
                  <span className="text-xs text-primary-foreground/80">Next</span>
                  <span className="text-base font-semibold">{nextChapter.name}</span>
                </div>
                <ChevronRight className="w-5 h-5 ml-1" />
              </Link>
            ) : <span />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CoursePage;