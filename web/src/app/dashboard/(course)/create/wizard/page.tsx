'use client';

import { CourseCreationWizard } from '@/components/course/CourseCreationWizard';
import { useRouter } from 'next/navigation';
import { BookOpen } from 'lucide-react';

/**
 * AI-powered course creation wizard page
 * Provides a step-by-step interface for creating courses with AI assistance
 */
export default function CourseWizardPage() {
  const router = useRouter();

  const handleComplete = (courseId: string) => {
    // Redirect to course management interface after successful creation
    router.push(`/dashboard/create/${courseId}`);
  };

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
              AI Course Wizard
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Create comprehensive courses with AI assistance. Just enter a title and let our AI generate the complete structure for you.
            </p>
          </div>

          {/* Wizard Component */}
          <CourseCreationWizard onComplete={handleComplete} />
        </div>
      </div>
    </div>
  );
}