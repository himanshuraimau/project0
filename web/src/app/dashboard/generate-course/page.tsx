import { GenerateCourseCard } from "@/components/course/GenerateCourseCard";
import { MyCourses } from "@/components/course/MyCourses";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export default async function GenerateCoursePage() {
  const { userId } = await auth();
  if (!userId) {
    // Optionally redirect or show a message
    return <div className="p-8">Sign in required</div>;
  }

  // Get user's courses
  const courses = await prisma.course.findMany({
    where: { userId },
    include: {
      units: {
        include: { chapters: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Generate Course</h1>
      <p className="text-muted-foreground mb-6">Easily generate a new course with AI assistance.</p>
      <div className="mt-6">
        <GenerateCourseCard className="w-full" />
      </div>
      {/* My Courses Section */}
      <div className="mt-8">
        <MyCourses courses={courses} />
      </div>
    </div>
  );
}
