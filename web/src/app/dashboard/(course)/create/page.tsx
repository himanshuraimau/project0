import CreateCourseForm from '@/components/course/CreateCourseForm'
import { InfoIcon, BookOpen } from 'lucide-react'
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const CreatePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary/10 rounded-full">
                <BookOpen className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
              Course Generator
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transform your learning ideas into structured, AI-powered courses with automated content generation
            </p>
          </div>

          {/* Info Card */}
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-full">
                  <InfoIcon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2">How it works</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Enter a course title or topic you want to learn about. Then specify the units or subtopics 
                    you&apos;d like to cover. Our AI will generate a comprehensive course structure with chapters, 
                    video content, and learning materials tailored to your needs.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Create Your Course</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <CreateCourseForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default CreatePage
