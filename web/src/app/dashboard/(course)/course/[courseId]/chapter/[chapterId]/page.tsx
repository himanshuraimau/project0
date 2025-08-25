import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ChapterView } from "@/components/course/ChapterView";

interface ChapterPageProps {
  params: Promise<{
    courseId: string;
    chapterId: string;
  }>;
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { userId } = await auth();
  const { chapterId } = await params;
  
  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch the chapter and verify ownership
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      unit: {
        include: {
          course: true
        }
      }
    }
  });

  if (!chapter) {
    redirect("/dashboard");
  }

  // Verify that the user owns this course
  if (chapter.unit.course.userId !== userId) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <ChapterView chapter={chapter} />
      </div>
    </div>
  );
}