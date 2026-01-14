import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  Star,
  Check,
  X,
  Trophy,
  Clock,
} from "lucide-react";
import { QuizViewerProps } from "@/lib/types";
import { useRouter } from "next/navigation";

export const QuizViewer: React.FC<QuizViewerProps & { noteTitle?: string }> = ({ quiz, onClose, noteTitle }) => {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: number]: string | boolean;
  }>({});
  const [showResults, setShowResults] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start timer when quiz begins
  useEffect(() => {
    if (!showResults) {
      timerIntervalRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      // Clear interval when results are shown
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [showResults, startTime]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (quiz.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto px-8 pt-6 pb-8">
        <Card>
          <CardContent className="p-8">
            <p className="text-center text-muted-foreground">No quiz available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = quiz[currentIndex];
  const isAnswered = selectedAnswers[currentIndex] !== undefined;
  const isCorrect =
    selectedAnswers[currentIndex] ===
    (currentQuestion.correctAnswer || currentQuestion.correct_answer);

  const handleNext = () => {
    if (currentIndex < quiz.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleAnswerSelect = (answer: string | boolean) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentIndex]: answer,
    });
  };

  const handleShare = async () => {
    try {
      const shareUrl = window.location.href;
      if (navigator.share) {
        await navigator.share({
          title: `Quiz: ${noteTitle}`,
          text: 'Check out this AI-generated quiz!',
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const calculateScore = () => {
    let correct = 0;
    quiz.forEach((question, index) => {
      if (
        selectedAnswers[index] ===
        (question.correctAnswer || question.correct_answer)
      ) {
        correct++;
      }
    });

    return {
      correct,
      total: quiz.length,
      percentage: Math.round((correct / quiz.length) * 100),
    };
  };

  const score = calculateScore();

  // Results view - Redesigned completion screen
  if (showResults) {
    return (
      <div className="px-20 py-6 min-h-screen">
        {/* Header Section */}
        <div className="pb-6 mb-6 border-b border-transparent" style={{
          boxShadow: '0 1px 0 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        }}>
          {/* Breadcrumb with Actions */}
          <nav className="mb-4">
            <div className="flex items-center justify-between">
              <ol className="flex items-center space-x-2 text-[19px] font-normal text-muted-foreground">
                <li>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="hover:text-foreground transition-colors"
                  >
                    Notes
                  </button>
                </li>
                <li>
                  <span className="mx-2">&gt;</span>
                </li>
                <li className="text-foreground font-medium">
                  Quiz Results
                </li>
              </ol>

              {/* Share and Star Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="gap-2 rounded-none"
                >
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Share</span>
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleFavorite}
                  className="text-yellow-500 hover:text-yellow-600 rounded-none"
                >
                  <Star
                    className="h-5 w-5"
                    fill={isFavorite ? "currentColor" : "none"}
                  />
                </Button>
              </div>
            </div>
          </nav>

          {/* Title */}
          <div>
            <div className="text-2xl text-purple-800 pb-2">Quiz Results for:</div>
            <h1 className="text-[19px] font-bold text-foreground leading-tight">
              {noteTitle || "Your Notes"}
            </h1>
          </div>
        </div>

        {/* Results Card - Centered */}
        <div className="flex items-center justify-center">
          <Card className="max-w-2xl w-full rounded-2xl border-0 bg-white dark:bg-[#1A1A1A] shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.7)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.4),-8px_-8px_16px_rgba(255,255,255,0.02)]">
            <CardContent className="p-12 text-center space-y-6">
              {/* Achievement Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-2xl bg-black dark:bg-white/10 flex items-center justify-center">
                  <Trophy className="h-10 w-10 text-yellow-500" />
                </div>
              </div>

              {/* Score Percentage */}
              <div className="text-7xl font-bold text-green-500 mb-2">
                {score.percentage}%
              </div>

              {/* Feedback Message */}
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Great job! You're making progress.
              </p>

              {/* Performance Breakdown Row */}
              <div className="flex justify-center gap-8 py-6">
                {/* Correct */}
                <div className="flex flex-col items-center">
                  <div className="text-sm font-medium text-green-500 mb-1">Correct</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {score.correct}/{score.total}
                  </div>
                </div>

                {/* Wrong */}
                <div className="flex flex-col items-center">
                  <div className="text-sm font-medium text-red-500 mb-1">Wrong</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {score.total - score.correct}/{score.total}
                  </div>
                </div>

                {/* Time */}
                <div className="flex flex-col items-center">
                  <div className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Time
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatTime(elapsedTime)}
                  </div>
                </div>
              </div>

              {/* Primary Action */}
              <Button
                onClick={() => router.push(`/notes/${noteTitle}/quiz`)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white text-base py-6 rounded-xl"
              >
                Create a new quiz
              </Button>

              {/* Secondary Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setReviewMode(true);
                    setShowResults(false);
                    setCurrentIndex(0);
                  }}
                  className="flex-1 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl py-5"
                >
                  Review Answers
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentIndex(0);
                    setSelectedAnswers({});
                    setShowResults(false);
                    setReviewMode(false);
                  }}
                  className="flex-1 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl py-5"
                >
                  Try Again
                </Button>

                <Button
                  variant="outline"
                  onClick={handleShare}
                  size="icon"
                  className="border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl w-14 h-14"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

              {/* Historical Reference */}
              <p className="text-sm text-gray-500 dark:text-gray-600 pt-4">
                Your best: 92%
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Get option letters
  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="px-20 py-6">
      {/* Header Section */}
      <div className="pb-6 mb-6 border-b border-transparent" style={{
        boxShadow: '0 1px 0 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
      }}>
        {/* Breadcrumb with Actions */}
        <nav className="mb-4">
          <div className="flex items-center justify-between">
            <ol className="flex items-center space-x-2 text-[19px] font-normal text-muted-foreground">
              <li>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="hover:text-foreground transition-colors"
                >
                  Notes
                </button>
              </li>
              <li>
                <span className="mx-2">&gt;</span>
              </li>
              <li className="text-foreground font-medium">
                Quiz
              </li>
            </ol>

            {/* Share and Star Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="gap-2 rounded-none"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleFavorite}
                className="text-yellow-500 hover:text-yellow-600 rounded-none"
              >
                <Star
                  className="h-5 w-5"
                  fill={isFavorite ? "currentColor" : "none"}
                />
              </Button>
            </div>
          </div>
        </nav>

        {/* Title */}
        <div>
          <div className="text-2xl text-purple-800 pb-2">Quiz for:</div>
          <h1 className="text-[19px] font-bold text-foreground leading-tight">
            {noteTitle || "Your Notes"}
          </h1>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[13px] text-muted-foreground">
            {reviewMode ? "Review - " : ""}Question {currentIndex + 1} of {quiz.length}
          </div>
          {!reviewMode && (
            <button className="text-[13px] text-accent hover:underline">
              Hint
            </button>
          )}
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${reviewMode ? 'bg-purple-500 dark:bg-purple-400' : 'bg-green-500 dark:bg-green-400'}`}
            style={{
              width: `${((currentIndex + 1) / quiz.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Question and Chatbot Section */}
      <div className="pt-12 pb-8">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Question Card - Primary Focus */}
          <Card className="w-full rounded-2xl border-0 bg-white dark:bg-[#1A1A1A] shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.7)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.4),-8px_-8px_16px_rgba(255,255,255,0.02)]">
            <CardContent className="pt-8 px-8 pb-6 pl-4">
              {/* Question Text */}
              <div className="text-[17px] font-medium leading-normal text-foreground mb-6">
                {currentQuestion.question}
              </div>

              {/* Answer Options */}
              <div className="space-y-3 mb-6">
                {currentQuestion.type === "multiple_choice" &&
                  currentQuestion.options?.map((option, index) => {
                    const isSelected = selectedAnswers[currentIndex] === option;
                    const isCorrectAnswer =
                      option ===
                      (currentQuestion.correctAnswer ||
                        currentQuestion.correct_answer);

                    let containerClass =
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ";
                    let showIcon = false;
                    let iconType: 'check' | 'cross' | null = null;
                    let textColor = "text-gray-900 dark:text-gray-100";

                    if (reviewMode) {
                      // After submission: show full solution
                      if (isCorrectAnswer) {
                        // Always highlight correct answer in green
                        containerClass += "bg-green-50 dark:bg-green-950/30 border-2 border-green-500 dark:border-green-600";
                        textColor = "text-green-600 dark:text-green-400";
                        showIcon = true;
                        iconType = 'check';
                      } else if (isSelected && !isCorrectAnswer) {
                        // Show user's wrong selection in red
                        containerClass += "bg-red-50 dark:bg-red-950/30 border-2 border-red-500 dark:border-red-600";
                        textColor = "text-red-600 dark:text-red-400";
                        showIcon = true;
                        iconType = 'cross';
                      } else {
                        // Other options are muted
                        containerClass += "bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800";
                        textColor = "text-gray-500 dark:text-gray-500";
                      }
                    } else {
                      // During quiz: only show feedback for selected option
                      if (isSelected && isCorrectAnswer) {
                        // Selected and correct
                        containerClass += "bg-green-50 dark:bg-green-950/30 border-2 border-green-500 dark:border-green-600";
                        textColor = "text-green-600 dark:text-green-400";
                        showIcon = true;
                        iconType = 'check';
                      } else if (isSelected && !isCorrectAnswer) {
                        // Selected and incorrect
                        containerClass += "bg-red-50 dark:bg-red-950/30 border-2 border-red-500 dark:border-red-600";
                        textColor = "text-red-600 dark:text-red-400";
                        showIcon = true;
                        iconType = 'cross';
                      } else {
                        // Unselected (neutral)
                        containerClass += "bg-white dark:bg-[#1A1A1A] border border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600";
                      }
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => !reviewMode && handleAnswerSelect(option)}
                        type="button"
                        className={containerClass}
                        disabled={reviewMode}
                      >
                        {/* Circular Label Badge */}
                        <div className="flex-shrink-0 w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400">
                          {optionLabels[index]}
                        </div>
                        {/* Option Text */}
                        <div className={`flex-1 text-left text-[15px] leading-[1.4] ${textColor}`}>
                          {option}
                        </div>
                        {/* Icon (only for selected options) */}
                        {showIcon && iconType === 'check' && (
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                        {showIcon && iconType === 'cross' && (
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                            <X className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}

                {currentQuestion.type === "true_false" && (
                  <>
                    {[true, false].map((value) => {
                      const isSelected = selectedAnswers[currentIndex] === value;
                      const isCorrectAnswer =
                        value ===
                        (currentQuestion.correctAnswer ||
                          currentQuestion.correct_answer);

                      let containerClass =
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ";
                      let showIcon = false;
                      let iconType: 'check' | 'cross' | null = null;
                      let textColor = "text-gray-900 dark:text-gray-100";

                      if (reviewMode) {
                        // After submission: show full solution
                        if (isCorrectAnswer) {
                          // Always highlight correct answer in green
                          containerClass += "bg-green-50 dark:bg-green-950/30 border-2 border-green-500 dark:border-green-600";
                          textColor = "text-green-600 dark:text-green-400";
                          showIcon = true;
                          iconType = 'check';
                        } else if (isSelected && !isCorrectAnswer) {
                          // Show user's wrong selection in red
                          containerClass += "bg-red-50 dark:bg-red-950/30 border-2 border-red-500 dark:border-red-600";
                          textColor = "text-red-600 dark:text-red-400";
                          showIcon = true;
                          iconType = 'cross';
                        } else {
                          // Other options are muted
                          containerClass += "bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800";
                          textColor = "text-gray-500 dark:text-gray-500";
                        }
                      } else {
                        // During quiz: only show feedback for selected option
                        if (isSelected && isCorrectAnswer) {
                          // Selected and correct
                          containerClass += "bg-green-50 dark:bg-green-950/30 border-2 border-green-500 dark:border-green-600";
                          textColor = "text-green-600 dark:text-green-400";
                          showIcon = true;
                          iconType = 'check';
                        } else if (isSelected && !isCorrectAnswer) {
                          // Selected and incorrect
                          containerClass += "bg-red-50 dark:bg-red-950/30 border-2 border-red-500 dark:border-red-600";
                          textColor = "text-red-600 dark:text-red-400";
                          showIcon = true;
                          iconType = 'cross';
                        } else {
                          // Unselected (neutral)
                          containerClass += "bg-white dark:bg-[#1A1A1A] border border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600";
                        }
                      }

                      return (
                        <button
                          key={value.toString()}
                          onClick={() => !reviewMode && handleAnswerSelect(value)}
                          type="button"
                          className={containerClass}
                          disabled={reviewMode}
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400">
                            {value ? 'T' : 'F'}
                          </div>
                          <div className={`flex-1 text-left text-[15px] leading-[1.4] ${textColor}`}>
                            {value ? "True" : "False"}
                          </div>
                          {/* Icon (only for selected options) */}
                          {showIcon && iconType === 'check' && (
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          )}
                          {showIcon && iconType === 'cross' && (
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                              <X className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </>
                )}
              </div>

              {/* Card Footer Navigation */}
              <div className="flex items-center justify-between pt-5 mt-5 border-t">
                <Button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  variant="ghost"
                  className="gap-2 border-0 bg-white dark:bg-[#1A1A1A] shadow-[1px_1px_3px_rgba(0,0,0,0.1)] dark:shadow-[1px_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[2px_2px_5px_rgba(0,0,0,0.15)] dark:hover:shadow-[2px_2px_5px_rgba(0,0,0,0.4)] hover:bg-white dark:hover:bg-[#1A1A1A] disabled:opacity-50 rounded-xl"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                {reviewMode ? (
                  currentIndex === quiz.length - 1 ? (
                    <Button
                      onClick={() => {
                        setShowResults(true);
                        setReviewMode(false);
                      }}
                      className="border-0 bg-purple-600 hover:bg-purple-700 text-white shadow-[1px_1px_4px_rgba(0,0,0,0.2)] hover:shadow-[2px_2px_6px_rgba(0,0,0,0.25)] rounded-xl"
                    >
                      Back to Results
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      className="gap-2 border-0 bg-gray-600 hover:bg-gray-700 text-white shadow-[1px_1px_4px_rgba(0,0,0,0.2)] hover:shadow-[2px_2px_6px_rgba(0,0,0,0.25)] rounded-xl"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )
                ) : (
                  currentIndex === quiz.length - 1 ? (
                    <Button
                      onClick={() => setShowResults(true)}
                      disabled={!isAnswered}
                      className="border-0 bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700 text-white shadow-[1px_1px_4px_rgba(0,0,0,0.2)] hover:shadow-[2px_2px_6px_rgba(0,0,0,0.25)] disabled:opacity-50 rounded-xl"
                    >
                      Finish Quiz
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      disabled={!isAnswered}
                      className="gap-2 border-0 bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700 text-white shadow-[1px_1px_4px_rgba(0,0,0,0.2)] hover:shadow-[2px_2px_6px_rgba(0,0,0,0.25)] disabled:opacity-50 rounded-xl"
                    >
                      Continue
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
