"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCourseCreationStore } from "@/lib/stores/course-creation-store";
import { CourseCreationWizardProps } from "@/lib/types/course.types";
import { TitleInputStep } from "./steps/TitleInputStep";
import { UnitsGenerationStep } from "./steps/UnitsGenerationStep";
import { ChaptersReviewStep } from "./steps/ChaptersReviewStep";
import { BatchProgressStep } from "./steps/BatchProgressStep";
import { ErrorMessage } from "@/components/ui/error-message";
import { RecoveryBanner } from "@/components/ui/recovery-dialog";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export function CourseCreationWizard({
  onComplete,
}: CourseCreationWizardProps) {
  const {
    currentStep,
    courseTitle,
    units,
    chapters,
    isGeneratingUnits,
    isGeneratingChapters,
    isSaving,
    errorState,
    hasRecoveryData,
    recoveryStateSummary,
    batchState,
    setStep,
    setCourseTitle,
    setUnits,
    setChapters,
    updateChapterName,
    deleteChapter,
    generateUnitsWithRetry,
    generateChaptersWithRetry,
    saveCourseWithRetry,
    clearError,
    retryLastOperation,
    checkForRecoveryData,
    restoreFromRecovery,
    discardRecoveryData,
    processNextBatch,
    resetBatchState,
    generateChaptersBatchwise,
    savedCourseId,
    reset,
  } = useCourseCreationStore();

  const [showRecoveryBanner, setShowRecoveryBanner] = useState(false);

  // Check for recovery data when component mounts
  useEffect(() => {
    checkForRecoveryData();
    if (hasRecoveryData) {
      setShowRecoveryBanner(true);
    } else {
      reset();
    }
  }, [checkForRecoveryData, hasRecoveryData, reset]);

  // Handle recovery actions
  const handleRestoreRecovery = () => {
    const restored = restoreFromRecovery();
    if (restored) {
      setShowRecoveryBanner(false);
    }
  };

  const handleDiscardRecovery = () => {
    discardRecoveryData();
    setShowRecoveryBanner(false);
    reset();
  };

  // Add navigation methods
  const canGoBack = currentStep !== "title";
  const goBack = () => {
    if (currentStep === "units") {
      setCourseTitle(courseTitle); // Keep the title
      setUnits([]); // Clear units to allow regeneration
      setStep("title");
    } else if (currentStep === "chapters") {
      setChapters([]); // Clear chapters to allow regeneration
      setStep("units");
    }
  };

  const handleTitleChange = (title: string) => {
    setCourseTitle(title);
  };

  const handleGenerateUnits = async () => {
    try {
      await generateUnitsWithRetry();
    } catch (error) {
      // Error is already handled by the store and displayed via errorState
      console.error("Failed to generate units:", error);
    }
  };

  const handleUnitsChange = (newUnits: typeof units) => {
    setUnits(newUnits);
  };

  const handleFinalizeUnits = async () => {
    try {
      await generateChaptersWithRetry();
    } catch (error) {
      // Error is already handled by the store and displayed via errorState
      console.error("Failed to generate chapters:", error);
    }
  };

  const handleEditChapter = (
    unitId: string,
    chapterId: string,
    newName: string
  ) => {
    updateChapterName(unitId, chapterId, newName);
  };

  const handleDeleteChapter = (unitId: string, chapterId: string) => {
    deleteChapter(unitId, chapterId);
  };

  const handleSaveCourse = async () => {
    try {
      // First save the course structure to the database
      const courseId = await saveCourseWithRetry();
      
      // Then transition to content generation step
      setStep('content-generation');
      
      // Note: Content generation will be handled by the BatchProgressStep component
      // which will automatically process all batches and then show navigation
    } catch (error) {
      // Error is already handled by the store and displayed via errorState
      console.error("Failed to save course:", error);
    }
  };

  // Batch processing handlers
  const handleProcessNextBatch = async () => {
    try {
      await processNextBatch();
    } catch (error) {
      // Error is already handled by the store and displayed via errorState
      console.error("Failed to process batch:", error);
    }
  };

  const handleBatchComplete = () => {
    resetBatchState();
    // Navigate to the course when batch processing is complete
    if (savedCourseId) {
      onComplete(savedCourseId);
    } else {
      console.error("No course ID available for navigation");
      // Fallback - this shouldn't happen in normal flow
      onComplete("course-ready");
    }
  };

  const handleBatchRetry = () => {
    clearError();
    handleProcessNextBatch();
  };

  return (
    <ErrorBoundary>
      <div className="w-full">
        {/* Back button */}
        {canGoBack && (
          <div className="mb-6">
            <Button
              onClick={goBack}
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
              disabled={isGeneratingUnits || isGeneratingChapters || isSaving}
            >
              ← Back
            </Button>
          </div>
        )}
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-xl p-6">
            <div className="flex items-baseline justify-between mb-4">
              {/* Step 1: Course Title */}
              <div className="flex flex-col items-center space-y-2">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 border-2 ${
                    currentStep === "title"
                      ? "bg-accent text-accent-foreground border-accent  scale-110"
                      : ["units", "chapters", "content-generation"].includes(currentStep)
                      ? "bg-accent/90 text-accent-foreground border-accent"
                      : "bg-background border-border text-muted-foreground hover:border-accent/50"
                  }`}
                >
                  {["units", "chapters", "content-generation"].includes(currentStep) ? (
                    <span className="text-base">✓</span>
                  ) : (
                    <span className="w-3 h-3 rounded-full bg-current"></span>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Step 1</p>
                  <span
                    className={`text-sm font-medium transition-colors duration-300 ${
                      currentStep === "title"
                        ? "text-foreground"
                        : ["units", "chapters", "content-generation"].includes(currentStep)
                        ? "text-accent"
                        : "text-muted-foreground"
                    }`}
                  >
                    Course Title
                  </span>
                  {courseTitle && (
                    <p className="text-xs text-muted-foreground truncate max-w-32 mt-1">
                      {courseTitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector line */}
              <div
                className={`flex-1 h-1 mx-4 rounded-full transition-colors duration-300 ${
                  ["units", "chapters", "content-generation"].includes(currentStep)
                    ? "bg-accent/60"
                    : "bg-border"
                }`}
              />

              {/* Step 2: Generate Units */}
              <div className="flex flex-col items-center space-y-2">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 border-2 ${
                    currentStep === "units"
                      ? "bg-accent text-accent-foreground border-accent  scale-110"
                      : ["chapters", "content-generation"].includes(currentStep)
                      ? "bg-accent/90 text-accent-foreground border-accent"
                      : "bg-background border-border text-muted-foreground hover:border-accent/50"
                  }`}
                >
                  {["chapters", "content-generation"].includes(currentStep) ? (
                    <span className="text-base">✓</span>
                  ) : (
                    <span className="w-3 h-3 rounded-full bg-current"></span>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Step 2</p>
                  <span
                    className={`text-sm font-medium transition-colors duration-300 ${
                      currentStep === "units"
                        ? "text-foreground"
                        : ["chapters", "content-generation"].includes(currentStep)
                        ? "text-accent"
                        : "text-muted-foreground"
                    }`}
                  >
                    Generate Units
                  </span>
                  {units.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {units.length} units created
                    </p>
                  )}
                </div>
              </div>

              {/* Connector line */}
              <div
                className={`flex-1 h-1 mx-4 rounded-full transition-colors duration-300 ${
                  ["chapters", "content-generation"].includes(currentStep)
                    ? "bg-accent/60"
                    : "bg-border"
                }`}
              />

              {/* Step 3: Review Structure */}
              <div className="flex flex-col items-center space-y-2">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 border-2 ${
                    currentStep === "chapters"
                      ? "bg-accent text-accent-foreground border-accent  scale-110"
                      : currentStep === "content-generation"
                      ? "bg-accent/90 text-accent-foreground border-accent"
                      : "bg-background border-border text-muted-foreground hover:border-accent/50"
                  }`}
                >
                  {currentStep === "content-generation" ? (
                    <span className="text-base">✓</span>
                  ) : (
                    <span className="w-3 h-3 rounded-full bg-current"></span>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Step 3</p>
                  <span
                    className={`text-sm font-medium transition-colors duration-300 ${
                      currentStep === "chapters"
                        ? "text-foreground"
                        : currentStep === "content-generation"
                        ? "text-accent"
                        : "text-muted-foreground"
                    }`}
                  >
                    Review
                  </span>
                  {chapters.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {chapters.reduce(
                        (total, unit) => total + unit.chapters.length,
                        0
                      )}{" "}
                      chapters
                    </p>
                  )}
                </div>
              </div>

              {/* Connector line */}
              <div
                className={`flex-1 h-1 mx-4 rounded-full transition-colors duration-300 ${
                  currentStep === "content-generation" ? "bg-accent/60" : "bg-border"
                }`}
              />

              {/* Step 4: Content Generation */}
              <div className="flex flex-col items-center space-y-2">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 border-2 ${
                    currentStep === "content-generation"
                      ? "bg-accent text-accent-foreground border-accent  scale-110"
                      : "bg-background border-border text-muted-foreground hover:border-accent/50"
                  }`}
                >
                  {batchState.processingProgress >= 100 ? (
                    <span className="text-base">✓</span>
                  ) : (
                    <span className="w-3 h-3 rounded-full bg-current"></span>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Step 4</p>
                  <span
                    className={`text-sm font-medium transition-colors duration-300 ${
                      currentStep === "content-generation"
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    Generate Content
                  </span>
                  {currentStep === "content-generation" && batchState.isProcessing && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {batchState.processingProgress}% complete
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {/* <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{
                width: currentStep === 'title' ? '50%' :
                  currentStep === 'units' ? '60%' :
                    '100%'
              }}
            />
          </div> */}

          {/* Step description */}
          {/* <div className="mt-3 text-center">
            <p className="text-sm text-gray-600">
              {currentStep === 'title' && 'Enter your course title to get started'}
              {currentStep === 'units' && 'Review and customize the generated course units'}
              {currentStep === 'chapters' && 'Final review of your complete course structure'}
            </p>
          </div> */}
        </div>

        {/* Recovery Banner */}
        {showRecoveryBanner && hasRecoveryData && recoveryStateSummary && (
          <div className="w-full mx-auto mb-6">
            <RecoveryBanner
              stateSummary={recoveryStateSummary}
              onRestore={handleRestoreRecovery}
              onDiscard={handleDiscardRecovery}
            />
          </div>
        )}

        {/* Error Display */}
        {errorState.hasError && errorState.error && (
          <div className="w-full mx-auto mb-6">
            <ErrorMessage
              error={errorState.error}
              onRetry={
                errorState.error.retryable ? retryLastOperation : undefined
              }
              onDismiss={clearError}
              isRetrying={isGeneratingUnits || isGeneratingChapters || isSaving}
              retryCount={errorState.retryCount}
              maxRetries={errorState.maxRetries}
            />
          </div>
        )}

        {/* Step content */}
        <div className="bg-card/60 backdrop-blur-sm border border-border/60 rounded-2xl  overflow-hidden w-full">
          <div className="relative">
            <div
              className={`transition-all duration-500 ease-in-out ${
                currentStep === "title"
                  ? "opacity-100 translate-x-0 relative"
                  : "opacity-0 translate-x-full absolute inset-0 pointer-events-none"
              }`}
            >
              <div className="p-6">
                <TitleInputStep
                  title={courseTitle}
                  onTitleChange={handleTitleChange}
                  onGenerateUnits={handleGenerateUnits}
                  isLoading={isGeneratingUnits}
                />
              </div>
            </div>

            {/* Units Step */}
            <div
              className={`transition-all duration-500 ease-in-out ${
                currentStep === "units" && !isGeneratingChapters
                  ? "opacity-100 translate-x-0 relative"
                  : currentStep === "title"
                  ? "opacity-0 -translate-x-full absolute inset-0 pointer-events-none"
                  : "opacity-0 translate-x-full absolute inset-0 pointer-events-none"
              }`}
            >
              <div className="p-6">
                <UnitsGenerationStep
                  units={units}
                  onUnitsChange={handleUnitsChange}
                  onFinalize={handleFinalizeUnits}
                  isLoading={false}
                />
              </div>
            </div>

            {/* Batch Progress Step (shown during content-generation step) */}
            <div
              className={`transition-all duration-500 ease-in-out ${
                currentStep === "content-generation"
                  ? "opacity-100 translate-x-0 relative"
                  : "opacity-0 translate-x-full absolute inset-0 pointer-events-none"
              }`}
            >
              <div className="p-6">
                <BatchProgressStep
                  courseTitle={courseTitle}
                  units={chapters}
                  batchState={batchState}
                  errorState={errorState}
                  onProcessNextBatch={handleProcessNextBatch}
                  onRetry={handleBatchRetry}
                  onComplete={handleBatchComplete}
                />
              </div>
            </div>

            {/* Chapters Step */}
            <div
              className={`transition-all duration-500 ease-in-out ${
                currentStep === "chapters"
                  ? "opacity-100 translate-x-0 relative"
                  : "opacity-0 -translate-x-full absolute inset-0 pointer-events-none"
              }`}
            >
              <div className="p-6">
                <ChaptersReviewStep
                  courseTitle={courseTitle}
                  units={chapters}
                  onSave={handleSaveCourse}
                  onEdit={handleEditChapter}
                  onDeleteChapter={handleDeleteChapter}
                  isLoading={isSaving}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
