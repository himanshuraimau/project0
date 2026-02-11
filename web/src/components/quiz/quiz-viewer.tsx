import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuizViewerProps } from "@/lib/types";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Share07Icon,
  StarIcon,
  Tick01Icon,
  Cancel01Icon,
  MedalFirstPlaceIcon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";

export const QuizViewer: React.FC<QuizViewerProps & { noteTitle?: string }> = ({
  quiz,
  onClose,
  noteTitle,
}) => {
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
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  if (quiz.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Card className="rounded-xl border border-border bg-card shadow-sm">
          <CardContent className="p-8">
            <p className="text-center text-sm text-muted-foreground">
              No quiz available for this note yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = quiz[currentIndex];
  const isAnswered = selectedAnswers[currentIndex] !== undefined;

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
          text: "Check out this AI-generated quiz!",
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard", {
          position: "top-center",
        });
      }
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const handleToggleFavorite = () => {
    setIsFavorite((prev) => !prev);
    toast.success(
      !isFavorite ? "Added quiz to favorites" : "Removed from favorites",
      { position: "top-center" }
    );
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

  // Get option letters
  const optionLabels = ["A", "B", "C", "D", "E", "F"];

  // Results view
  if (showResults) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Quiz results
            </p>
            <h1 className="mt-1 text-xl font-semibold text-foreground">
              {noteTitle || "Your notes"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              You answered {score.correct} of {score.total} questions correctly
              in {formatTime(elapsedTime)}.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="h-9 rounded-lg border-border text-muted-foreground hover:text-foreground gap-1.5"
            >
              <HugeiconsIcon icon={Share07Icon} className="size-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleFavorite}
              className={`h-9 w-9 rounded-lg ${
                isFavorite
                  ? "text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <HugeiconsIcon
                icon={StarIcon}
                className={`size-5 ${isFavorite ? "fill-current" : ""}`}
              />
            </Button>
          </div>
        </div>

        {/* Results card */}
        <Card className="rounded-xl border border-border bg-card shadow-sm">
          <CardContent className="p-8 sm:p-10 text-center space-y-6">
            {/* Medal / celebration icon */}
            <div className="flex justify-center mb-2">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <HugeiconsIcon icon={MedalFirstPlaceIcon} className="size-8" />
              </div>
            </div>

            {/* Score */}
            <div className="text-5xl sm:text-6xl font-semibold tracking-tight text-foreground">
              {score.percentage}%
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">
              {score.percentage >= 80
                ? "Excellent recall—you're mastering this note."
                : score.percentage >= 50
                ? "Nice work—review the answers to reinforce weak spots."
                : "Tough set—review the material and try again."}
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 pt-4 text-sm">
              <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Correct
                </div>
                <div className="mt-1 text-lg font-semibold text-foreground">
                  {score.correct}/{score.total}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Incorrect
                </div>
                <div className="mt-1 text-lg font-semibold text-foreground">
                  {score.total - score.correct}/{score.total}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
                <div className="flex items-center justify-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <HugeiconsIcon icon={Clock01Icon} className="size-3.5" />
                  Time
                </div>
                <div className="mt-1 text-lg font-semibold text-foreground">
                  {formatTime(elapsedTime)}
                </div>
              </div>
            </div>

            {/* Primary actions */}
            <div className="mt-4 space-y-3">
              <Button
                onClick={() => {
                  setReviewMode(true);
                  setShowResults(false);
                  setCurrentIndex(0);
                }}
                className="w-full h-11 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium"
              >
                Review answers
              </Button>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentIndex(0);
                    setSelectedAnswers({});
                    setShowResults(false);
                    setReviewMode(false);
                    setElapsedTime(0);
                  }}
                  className="flex-1 h-10 rounded-lg border-border text-sm font-medium"
                >
                  Try again
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="flex-1 h-10 rounded-lg border-border text-sm font-medium"
                >
                  Share results
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => router.back()}
                  className="flex-1 h-10 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60"
                >
                  Back to note
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz question view
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header / progress */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {reviewMode ? "Review quiz" : "Practice quiz"}
            </p>
            <h1 className="mt-1 text-xl font-semibold text-foreground">
              {noteTitle || "Your notes"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Question {currentIndex + 1} of {quiz.length} · Elapsed{" "}
              {formatTime(elapsedTime)}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="h-9 rounded-lg border-border text-muted-foreground hover:text-foreground gap-1.5"
            >
              <HugeiconsIcon icon={Share07Icon} className="size-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleFavorite}
              className={`h-9 w-9 rounded-lg ${
                isFavorite
                  ? "text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <HugeiconsIcon
                icon={StarIcon}
                className={`size-5 ${isFavorite ? "fill-current" : ""}`}
              />
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full ${
              reviewMode ? "bg-primary/60" : "bg-primary"
            } transition-all duration-300`}
            style={{
              width: `${((currentIndex + 1) / quiz.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Question card */}
      <Card className="rounded-xl border border-border bg-card shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="text-[17px] font-medium leading-normal text-foreground mb-6">
            {currentQuestion.question}
          </div>

          <div className="space-y-3 mb-6">
            {currentQuestion.type === "multiple_choice" &&
              currentQuestion.options?.map((option, index) => {
                const isSelected = selectedAnswers[currentIndex] === option;
                const isCorrectAnswer =
                  option ===
                  (currentQuestion.correctAnswer ||
                    currentQuestion.correct_answer);

                let containerClass =
                  "w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ";
                let showIcon = false;
                let iconType: "check" | "cross" | null = null;
                let textColor = "text-foreground";

                if (reviewMode) {
                  if (isCorrectAnswer) {
                    containerClass +=
                      "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/80";
                    textColor = "text-emerald-700 dark:text-emerald-300";
                    showIcon = true;
                    iconType = "check";
                  } else if (isSelected && !isCorrectAnswer) {
                    containerClass +=
                      "bg-red-50 dark:bg-red-950/30 border-red-500/80";
                    textColor = "text-red-700 dark:text-red-300";
                    showIcon = true;
                    iconType = "cross";
                  } else {
                    containerClass += "bg-muted/60 border-border";
                    textColor = "text-muted-foreground";
                  }
                } else {
                  if (isSelected && isCorrectAnswer) {
                    containerClass +=
                      "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/80";
                    textColor = "text-emerald-700 dark:text-emerald-300";
                    showIcon = true;
                    iconType = "check";
                  } else if (isSelected && !isCorrectAnswer) {
                    containerClass +=
                      "bg-red-50 dark:bg-red-950/30 border-red-500/80";
                    textColor = "text-red-700 dark:text-red-300";
                    showIcon = true;
                    iconType = "cross";
                  } else {
                    containerClass +=
                      "bg-card border-border hover:border-border/80";
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
                    <div className="shrink-0 w-8 h-8 rounded-full border border-border flex items-center justify-center text-xs font-medium text-muted-foreground">
                      {optionLabels[index]}
                    </div>
                    <div
                      className={`flex-1 text-left text-[15px] leading-[1.4] ${textColor}`}
                    >
                      {option}
                    </div>
                    {showIcon && iconType === "check" && (
                      <div className="shrink-0 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                        <HugeiconsIcon
                          icon={Tick01Icon}
                          className="size-3.5 text-white"
                        />
                      </div>
                    )}
                    {showIcon && iconType === "cross" && (
                      <div className="shrink-0 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                        <HugeiconsIcon
                          icon={Cancel01Icon}
                          className="size-3.5 text-white"
                        />
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
                    "w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ";
                  let showIcon = false;
                  let iconType: "check" | "cross" | null = null;
                  let textColor = "text-foreground";

                  if (reviewMode) {
                    if (isCorrectAnswer) {
                      containerClass +=
                        "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/80";
                      textColor = "text-emerald-700 dark:text-emerald-300";
                      showIcon = true;
                      iconType = "check";
                    } else if (isSelected && !isCorrectAnswer) {
                      containerClass +=
                        "bg-red-50 dark:bg-red-950/30 border-red-500/80";
                      textColor = "text-red-700 dark:text-red-300";
                      showIcon = true;
                      iconType = "cross";
                    } else {
                      containerClass += "bg-muted/60 border-border";
                      textColor = "text-muted-foreground";
                    }
                  } else {
                    if (isSelected && isCorrectAnswer) {
                      containerClass +=
                        "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/80";
                      textColor = "text-emerald-700 dark:text-emerald-300";
                      showIcon = true;
                      iconType = "check";
                    } else if (isSelected && !isCorrectAnswer) {
                      containerClass +=
                        "bg-red-50 dark:bg-red-950/30 border-red-500/80";
                      textColor = "text-red-700 dark:text-red-300";
                      showIcon = true;
                      iconType = "cross";
                    } else {
                      containerClass +=
                        "bg-card border-border hover:border-border/80";
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
                      <div className="shrink-0 w-8 h-8 rounded-full border border-border flex items-center justify-center text-xs font-medium text-muted-foreground">
                        {value ? "T" : "F"}
                      </div>
                      <div
                        className={`flex-1 text-left text-[15px] leading-[1.4] ${textColor}`}
                      >
                        {value ? "True" : "False"}
                      </div>
                      {showIcon && iconType === "check" && (
                        <div className="shrink-0 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                          <HugeiconsIcon
                            icon={Tick01Icon}
                            className="size-3.5 text-white"
                          />
                        </div>
                      )}
                      {showIcon && iconType === "cross" && (
                        <div className="shrink-0 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                          <HugeiconsIcon
                            icon={Cancel01Icon}
                            className="size-3.5 text-white"
                          />
                        </div>
                      )}
                    </button>
                  );
                })}
              </>
            )}
          </div>

          {/* Footer navigation */}
          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
            <Button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              variant="outline"
              className="h-9 rounded-lg border-border text-sm text-muted-foreground hover:text-foreground gap-1.5 disabled:opacity-50"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
              <span>Previous</span>
            </Button>

            {reviewMode ? (
              currentIndex === quiz.length - 1 ? (
                <Button
                  onClick={() => {
                    setShowResults(true);
                    setReviewMode(false);
                  }}
                  className="h-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 px-4 text-sm font-medium"
                >
                  Back to results
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="h-9 rounded-lg bg-muted text-foreground hover:bg-muted/80 px-4 text-sm font-medium gap-1.5"
                >
                  <span>Next</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                </Button>
              )
            ) : currentIndex === quiz.length - 1 ? (
              <Button
                onClick={() => setShowResults(true)}
                disabled={!isAnswered}
                className="h-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 px-4 text-sm font-medium disabled:opacity-50"
              >
                Finish quiz
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!isAnswered}
                className="h-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 px-4 text-sm font-medium gap-1.5 disabled:opacity-50"
              >
                <span>Continue</span>
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
