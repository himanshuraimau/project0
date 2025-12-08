import React, { Suspense } from 'react';
import { GenerateCourseCard } from "@/components/course/GenerateCourseCard";
import { MyCourses } from "@/components/course/MyCourses";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export default async function GenerateCoursePage() {
  const session = await auth.api.getSession({ headers: await headers() }); const userId = session?.user?.id;
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
    <Suspense fallback={null}>
    <div className="w-full space-y-12">
      <GenerateCourseCard />
      <MyCourses courses={courses} />
    </div>
    </Suspense>
  );
}
