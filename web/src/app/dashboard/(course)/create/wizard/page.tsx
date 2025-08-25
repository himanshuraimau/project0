'use client';

import { CourseCreationWizard } from '@/components/course/CourseCreationWizard';
import { useRouter } from 'next/navigation';
import { BookOpen, CreditCard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { checkUserCredits } from '@/lib/client/credits-api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/**
 * AI-powered course creation wizard page
 * Provides a step-by-step interface for creating courses with AI assistance
 */
export default function CourseWizardPage() {
  const router = useRouter();
  const [hasEnoughCredits, setHasEnoughCredits] = useState<boolean | null>(null);
  const [isCheckingCredits, setIsCheckingCredits] = useState(true);

  useEffect(() => {
    const checkCredits = async () => {
      try {
        const hasCredits = await checkUserCredits(2); // Course generation requires 2 credits
        setHasEnoughCredits(hasCredits);
      } catch (error) {
        console.error('Error checking credits:', error);
        setHasEnoughCredits(true); // Allow proceeding if check fails
      } finally {
        setIsCheckingCredits(false);
      }
    };

    checkCredits();
  }, []);

  const handleComplete = (courseId: string) => {
    // Redirect to course management interface after successful creation
    router.push(`/dashboard/create/${courseId}`);
  };

  const handleGetCredits = () => {
    router.push('/credits?reason=insufficient_course&required=2');
  };

  // Show loading state while checking credits
  if (isCheckingCredits) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background/80 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-primary/10 rounded-full">
                  <BookOpen className="h-12 w-12 text-primary animate-pulse" />
                </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
                AI Course Wizard
              </h1>
              <p className="text-lg text-muted-foreground">
                Checking your credits...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show insufficient credits message
  if (hasEnoughCredits === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background/80 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                  <CreditCard className="h-12 w-12 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
                Insufficient Credits
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                You need 2 credits to generate a full course. Course generation includes creating the complete structure with units and chapters.
              </p>
            </div>

            <Card className="max-w-md mx-auto p-6 text-center">
              <h3 className="text-xl font-semibold mb-4">Course Generation</h3>
              <p className="text-muted-foreground mb-6">
                Create a comprehensive course with AI-generated units, chapters, and YouTube video recommendations.
              </p>
              <div className="flex items-center justify-center gap-2 mb-6">
                <CreditCard className="h-5 w-5 text-primary" />
                <span className="text-lg font-semibold">2 Credits Required</span>
              </div>
              <Button onClick={handleGetCredits} className="w-full">
                Get Credits
              </Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

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
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
              Create comprehensive courses with AI assistance. Just enter a title and let our AI generate the complete structure for you.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              <span>2 credits required for course generation</span>
            </div>
          </div>

          {/* Wizard Component */}
          <CourseCreationWizard onComplete={handleComplete} />
        </div>
      </div>
    </div>
  );
}