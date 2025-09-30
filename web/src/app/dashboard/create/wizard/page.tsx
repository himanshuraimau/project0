"use client";

import { CourseCreationWizard } from "@/components/course/CourseCreationWizard";
import { useRouter } from "next/navigation";
import { CreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import { checkUserCredits } from "@/lib/client/credits-api";
import { Button } from "@/components/ui/button";
import { Plus_Jakarta_Sans } from "next/font/google";
const jakarta = Plus_Jakarta_Sans({
  weight: ["500", "600"],
  subsets: ["latin"],
});

/**
 * AI-powered course creation wizard page
 * Provides a step-by-step interface for creating courses with AI assistance
 */
export default function CourseWizardPage() {
  const router = useRouter();
  const [hasEnoughCredits, setHasEnoughCredits] = useState<boolean | null>(
    null
  );
  const [isCheckingCredits, setIsCheckingCredits] = useState(true);

  useEffect(() => {
    const checkCredits = async () => {
      try {
        const hasCredits = await checkUserCredits(2); // Course generation requires 2 credits
        setHasEnoughCredits(hasCredits);
      } catch (error) {
        console.error("Error checking credits:", error);
        setHasEnoughCredits(true); // Allow proceeding if check fails
      } finally {
        setIsCheckingCredits(false);
      }
    };

    checkCredits();
  }, []);

  const handleComplete = (courseId: string) => {
    // Redirect to the first chapter of the course after successful creation
    router.push(`/dashboard/course/${courseId}/0/0`);
  };

  const handleGetCredits = () => {
    router.push("/credits?reason=insufficient_course&required=2");
  };

  // Show loading state while checking credits
  if (isCheckingCredits) {
    return (
      <div className={`${jakarta.className} w-full space-y-12`}>
        <div className="mb-8">
          <h2 className="text-2xl leading-8 font-semibold text-foreground mb-3">AI Course Wizard</h2>
          <p className="text-muted-foreground text-base font-medium leading-6">
            Checking your credits...
          </p>
        </div>
      </div>
    );
  }

  // Show insufficient credits message
  if (hasEnoughCredits === false) {
    return (
      <div className={`${jakarta.className} w-full space-y-12`}>
        <div className="mb-8">
          <h2 className="text-2xl leading-8 font-semibold text-foreground mb-3">AI Course Wizard</h2>
          <p className="text-muted-foreground text-base font-medium leading-6">
            You need 2 credits to generate a full course. Course generation
            includes creating the complete structure with units and chapters.
          </p>
        </div>
        
        <div className="flex justify-center">
          <div className="max-w-md w-full">
            <div className="bg-card/60 backdrop-blur-sm border border-border/60 rounded-2xl p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-accent/10 rounded-full">
                  <CreditCard className="h-8 w-8 text-accent" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Course Generation</h3>
              <p className="text-muted-foreground mb-6">
                Create a comprehensive course with AI-generated units, chapters,
                and YouTube video recommendations.
              </p>
              <div className="flex items-center justify-center gap-2 mb-6">
                <CreditCard className="h-5 w-5 text-accent" />
                <span className="text-lg font-semibold text-foreground">
                  2 Credits Required
                </span>
              </div>
              <Button onClick={handleGetCredits} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                Get Credits
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${jakarta.className} w-full space-y-12`}>
      <div className="mb-8">
        <h2 className="text-2xl leading-8 font-semibold text-foreground mb-3">AI Course Wizard</h2>
        <p className="text-muted-foreground text-base font-medium leading-6">
          Create comprehensive courses with AI assistance. Just enter a
          title and let our AI generate the complete structure for you.
        </p>
      </div>
      
      <div className="w-full">
        <CourseCreationWizard onComplete={handleComplete} />
      </div>
    </div>
  );
}
