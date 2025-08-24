'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCourseCreationStore } from '@/lib/stores/course-creation-store';
import { CourseCreationWizardProps } from '@/lib/types/course.types';
import { TitleInputStep } from './steps/TitleInputStep';
import { UnitsGenerationStep } from './steps/UnitsGenerationStep';
import { ChaptersReviewStep } from './steps/ChaptersReviewStep';
import { ErrorMessage } from '@/components/ui/error-message';
import { RecoveryBanner } from '@/components/ui/recovery-dialog';
import { ErrorBoundary } from '@/components/ui/error-boundary';

/**
 * Main CourseCreationWizard component that orchestrates the multi-step course creation process
 * Manages step navigation and coordinates between different wizard steps
 */
export function CourseCreationWizard({ onComplete }: CourseCreationWizardProps) {
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
    setStep,
    setCourseTitle,
    setUnits,
    setChapters,
    updateChapterName,
    generateUnitsWithRetry,
    generateChaptersWithRetry,
    saveCourseWithRetry,
    clearError,
    retryLastOperation,
    checkForRecoveryData,
    restoreFromRecovery,
    discardRecoveryData,
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
  const canGoBack = currentStep !== 'title';
  const goBack = () => {
    if (currentStep === 'units') {
      setCourseTitle(courseTitle); // Keep the title
      setUnits([]); // Clear units to allow regeneration
      setStep('title');
    } else if (currentStep === 'chapters') {
      setChapters([]); // Clear chapters to allow regeneration
      setStep('units');
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
      console.error('Failed to generate units:', error);
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
      console.error('Failed to generate chapters:', error);
    }
  };

  const handleEditChapter = (unitId: string, chapterId: string, newName: string) => {
    updateChapterName(unitId, chapterId, newName);
  };

  const handleSaveCourse = async () => {
    try {
      const courseId = await saveCourseWithRetry();
      onComplete(courseId);
    } catch (error) {
      // Error is already handled by the store and displayed via errorState
      console.error('Failed to save course:', error);
    }
  };

  return (
    <ErrorBoundary>
      <div className="max-w-4xl mx-auto p-6">
      {/* Back button */}
      {canGoBack && (
        <div className="mb-4">
          <Button
            onClick={goBack}
            variant="ghost"
            className="text-gray-600 hover:text-gray-800"
            disabled={isGeneratingUnits || isGeneratingChapters || isSaving}
          >
            ← Back
          </Button>
        </div>
      )}
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {/* Step 1: Course Title */}
          <div className="flex items-center space-x-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
              currentStep === 'title' 
                ? 'bg-blue-600 text-white shadow-lg scale-110' 
                : ['units', 'chapters'].includes(currentStep) 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-300 text-gray-600'
            }`}>
              {['units', 'chapters'].includes(currentStep) ? '✓' : '1'}
            </div>
            <div>
              <span className={`text-sm font-medium transition-colors duration-300 ${
                currentStep === 'title' 
                  ? 'text-blue-600' 
                  : ['units', 'chapters'].includes(currentStep) 
                    ? 'text-green-600' 
                    : 'text-gray-500'
              }`}>
                Course Title
              </span>
              {courseTitle && (
                <p className="text-xs text-gray-500 truncate max-w-32">
                  {courseTitle}
                </p>
              )}
            </div>
          </div>
          
          {/* Connector line */}
          <div className={`flex-1 h-0.5 mx-4 transition-colors duration-300 ${
            ['units', 'chapters'].includes(currentStep) ? 'bg-green-400' : 'bg-gray-300'
          }`} />
          
          {/* Step 2: Generate Units */}
          <div className="flex items-center space-x-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
              currentStep === 'units' 
                ? 'bg-blue-600 text-white shadow-lg scale-110' 
                : currentStep === 'chapters' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-300 text-gray-600'
            }`}>
              {currentStep === 'chapters' ? '✓' : '2'}
            </div>
            <div>
              <span className={`text-sm font-medium transition-colors duration-300 ${
                currentStep === 'units' 
                  ? 'text-blue-600' 
                  : currentStep === 'chapters' 
                    ? 'text-green-600' 
                    : 'text-gray-500'
              }`}>
                Generate Units
              </span>
              {units.length > 0 && (
                <p className="text-xs text-gray-500">
                  {units.length} units created
                </p>
              )}
            </div>
          </div>
          
          {/* Connector line */}
          <div className={`flex-1 h-0.5 mx-4 transition-colors duration-300 ${
            currentStep === 'chapters' ? 'bg-green-400' : 'bg-gray-300'
          }`} />
          
          {/* Step 3: Review Structure */}
          <div className="flex items-center space-x-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
              currentStep === 'chapters' 
                ? 'bg-blue-600 text-white shadow-lg scale-110' 
                : 'bg-gray-300 text-gray-600'
            }`}>
              3
            </div>
            <div>
              <span className={`text-sm font-medium transition-colors duration-300 ${
                currentStep === 'chapters' ? 'text-blue-600' : 'text-gray-500'
              }`}>
                Review Structure
              </span>
              {chapters.length > 0 && (
                <p className="text-xs text-gray-500">
                  {chapters.reduce((total, unit) => total + unit.chapters.length, 0)} chapters
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ 
              width: currentStep === 'title' ? '33%' : 
                     currentStep === 'units' ? '66%' : 
                     '100%' 
            }}
          />
        </div>
        
        {/* Step description */}
        <div className="mt-3 text-center">
          <p className="text-sm text-gray-600">
            {currentStep === 'title' && 'Enter your course title to get started'}
            {currentStep === 'units' && 'Review and customize the generated course units'}
            {currentStep === 'chapters' && 'Final review of your complete course structure'}
          </p>
        </div>
      </div>

      {/* Recovery Banner */}
      {showRecoveryBanner && hasRecoveryData && recoveryStateSummary && (
        <div className="max-w-4xl mx-auto mb-6">
          <RecoveryBanner
            stateSummary={recoveryStateSummary}
            onRestore={handleRestoreRecovery}
            onDiscard={handleDiscardRecovery}
          />
        </div>
      )}

      {/* Error Display */}
      {errorState.hasError && errorState.error && (
        <div className="max-w-4xl mx-auto mb-6">
          <ErrorMessage
            error={errorState.error}
            onRetry={errorState.error.retryable ? retryLastOperation : undefined}
            onDismiss={clearError}
            isRetrying={isGeneratingUnits || isGeneratingChapters || isSaving}
            retryCount={errorState.retryCount}
            maxRetries={errorState.maxRetries}
          />
        </div>
      )}

      {/* Step content */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="relative">
          {/* Title Step */}
          <div className={`transition-all duration-500 ease-in-out ${
            currentStep === 'title' 
              ? 'opacity-100 translate-x-0 relative' 
              : 'opacity-0 translate-x-full absolute inset-0 pointer-events-none'
          }`}>
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
          <div className={`transition-all duration-500 ease-in-out ${
            currentStep === 'units' 
              ? 'opacity-100 translate-x-0 relative' 
              : currentStep === 'title'
                ? 'opacity-0 -translate-x-full absolute inset-0 pointer-events-none'
                : 'opacity-0 translate-x-full absolute inset-0 pointer-events-none'
          }`}>
            <div className="p-6">
              <UnitsGenerationStep
                units={units}
                onUnitsChange={handleUnitsChange}
                onFinalize={handleFinalizeUnits}
                isLoading={isGeneratingChapters}
              />
            </div>
          </div>
          
          {/* Chapters Step */}
          <div className={`transition-all duration-500 ease-in-out ${
            currentStep === 'chapters' 
              ? 'opacity-100 translate-x-0 relative' 
              : 'opacity-0 -translate-x-full absolute inset-0 pointer-events-none'
          }`}>
            <div className="p-6">
              <ChaptersReviewStep
                courseTitle={courseTitle}
                units={chapters}
                onSave={handleSaveCourse}
                onEdit={handleEditChapter}
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