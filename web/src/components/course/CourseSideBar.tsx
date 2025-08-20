import { cn } from "@/lib/utils";
import { Course, Unit, Chapter } from "@prisma/client";
import Link from "next/link";
import React from "react";
import { Separator } from "../ui/separator";

type Props = {
  course: Course & {
    units: (Unit & {
      chapters: Chapter[];
    })[];
  };
  currentChapterId: string;
};

const CourseSideBar = async ({ course, currentChapterId }: Props) => {
  return (
  <div className="h-full w-full p-6 rounded-r-3xl overflow-y-auto sticky top-0">
      <h1 className="text-3xl font-bold mb-4 text-foreground">{course.name}</h1>
      {course.units.map((unit, unitIndex) => (
        <div key={unit.id} className="mt-6">
          <h2 className="text-xs uppercase text-muted-foreground tracking-wide mb-1">
            Unit {unitIndex + 1}
          </h2>
          <h2 className="text-xl font-bold text-foreground mb-2">{unit.name}</h2>
          <div className="space-y-1">
            {unit.chapters.map((chapter, chapterIndex) => (
              <Link
                key={chapter.id}
                href={`/dashboard/course/${course.id}/${unitIndex}/${chapterIndex}`}
                className={cn(
                  "block px-3 py-2 rounded-lg text-sm transition-colors duration-150 cursor-pointer",
                  chapter.id === currentChapterId
                    ? "bg-primary/10 text-primary font-bold shadow"
                    : "hover:bg-muted text-muted-foreground"
                )}
              >
                {chapter.name}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CourseSideBar;