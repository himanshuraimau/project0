import { GenerateCourseCard } from "@/components/course/GenerateCourseCard";
import { MyCourses } from "@/components/course/MyCourses";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Plus_Jakarta_Sans } from "next/font/google";
const jakarta = Plus_Jakarta_Sans({
  weight: ["400", "500", "600"],
});
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
    <div
      className={`${jakarta.className} px-6 py-4 flex-1 bg-stone-50 dark:bg-stone-950`}
    >
      <h1 className="text-lg font-bold mb-0.5">Create Course</h1>
      <p className="text-stone-500 text-sm font-medium leading-6 mb-6">
        Easily generate a new course with AI assistance.
      </p>
      <div className="mt-6">
        <GenerateCourseCard className="w-full" />
      </div>
      <div className="mt-16 w-full">
        <MyCourses courses={courses} />
      </div>
    </div>
  );
}
