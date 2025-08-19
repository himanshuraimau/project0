import ConfirmChapters from "@/components/course/ConfirmChapters"
import { prisma } from "@/lib/prisma"
import { Info, BookOpen } from "lucide-react"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import React from "react"

type Props = {
  params: Promise<{
    courseId: string
  }>
}

const CreateChapters = async ({ params }: Props) => {
  const { courseId } = await params

  const course = await prisma.course.findUnique({
    where: {
      id: courseId,
    },
    include: {
      units: {
        include: {
          chapters: true,
        },
      },
    },
  })

  if (!course) {
    redirect("/dashboard/create")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Course Header */}
          <div className="text-center mb-8">
            <h5 className="text-sm uppercase text-muted-foreground/60 mb-2">
              Course Preview
            </h5>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              {course.name}
            </h1>
          </div>

          {/* Info Card */}
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Info className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2">Review Your Course Structure</h3>
                  <p className="text-muted-foreground">
                    We&apos;ve generated chapters for each of your units. Review them below and click 
                    &quot;Generate&quot; to create the course content, or &quot;Save & Continue&quot; 
                    if everything looks good.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Structure */}
          <Card>
            <CardContent className="p-8">
              <ConfirmChapters course={course} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default CreateChapters
