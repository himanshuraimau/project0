import CreateCourseForm from "@/components/course/CreateCourseForm";
import { CourseCreationRouter } from "@/components/course/CourseCreationRouter";
import { InfoIcon, BookOpen, Sparkles, Settings } from "lucide-react";
import React, { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const CreatePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 py-6">
      <Suspense fallback={null}>
        <CourseCreationRouter />
      </Suspense>
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
              Transform your learning ideas into structured, AI-powered courses
              with automated content generation
            </p>
          </div>

          {/* Creation Options */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* AI Wizard Option */}
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">AI-Powered Wizard</h3>
                    <p className="text-sm text-muted-foreground">Recommended</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  Just enter a course title and let our AI generate the complete
                  structure, units, and chapters for you.
                </p>
                <Link href="/dashboard/create/wizard">
                  <Button className="w-full">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Use AI Wizard
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Manual Option */}
            <Card className="border-border hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-muted rounded-full">
                    <Settings className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Manual Setup</h3>
                    <p className="text-sm text-muted-foreground">
                      Full control
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  Manually define your course title and units for complete
                  control over the structure.
                </p>
                <Link href="/dashboard/create?mode=manual">
                  <Button variant="outline" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Manual Setup
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Info Card */}
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-full">
                  <InfoIcon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2">
                    How it works
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Choose the AI Wizard for automatic course generation, or use
                    Manual Setup to define your own structure. Both options will
                    generate comprehensive courses with chapters, video content,
                    and learning materials.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Manual Form Card */}
          <Card id="manual-form">
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                Manual Course Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <CreateCourseForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreatePage;
