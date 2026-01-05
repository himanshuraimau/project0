import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  Star,
  Send,
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
  const [isFavorite, setIsFavorite] = useState(false);
  const [helpQuestion, setHelpQuestion] = useState("");

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

  const handleAskQuestion = () => {
    if (helpQuestion.trim()) {
      // Handle AI question here
      console.log('Question:', helpQuestion);
      setHelpQuestion("");
    }
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

  // Results view - keep existing but wrap in proper container
  if (showResults) {
    return (
      <div className="w-full bg-white dark:bg-[#0A0A0A] min-h-screen px-8 pt-6 pb-8">
        <div className="max-w-7xl mx-auto">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center space-y-6">
              <div className="text-6xl font-bold text-accent mb-4">
                {score.percentage}%
              </div>
              <div className="text-lg text-muted-foreground">
                {score.correct} out of {score.total} correct
              </div>
              <div className="text-2xl font-semibold">
                {score.percentage >= 90
                  ? "🏆 Excellent!"
                  : score.percentage >= 80
                  ? "Great Job!"
                  : score.percentage >= 70
                  ? "👍 Good Work!"
                  : score.percentage >= 60
                  ? "📚 Keep Studying!"
                  : "Try Again!"}
              </div>
              <Button onClick={() => {
                setCurrentIndex(0);
                setSelectedAnswers({});
                setShowResults(false);
              }} className="mt-6">
                Retake Quiz
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Get option letters
  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="w-full bg-white dark:bg-[#0A0A0A] min-h-screen px-8 pt-2 pb-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 pb-6 border-b border-transparent" style={{
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
            <h1 className="text-[19px] font-bold text-foreground leading-tight">
              {noteTitle || "Your Notes"}
            </h1>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[13px] text-muted-foreground">
              Question {currentIndex + 1} of {quiz.length}
            </div>
            <button className="text-[13px] text-accent hover:underline">
              Hint
            </button>
          </div>
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / quiz.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Question Card - Primary Focus */}
        <div className="flex justify-center mb-6">
          <Card className="w-full max-w-[580px] rounded-xl border shadow-sm">
            <CardContent className="p-8">
              {/* Question Text */}
              <div className="text-[17px] font-medium leading-[1.5] text-foreground mb-6">
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
                    const showResult = isAnswered;

                    let containerClass =
                      "w-full flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ";

                    if (showResult) {
                      if (isSelected && isCorrect) {
                        containerClass += "border-green-500 bg-green-50 dark:bg-green-950/20";
                      } else if (isSelected && !isCorrect) {
                        containerClass += "border-red-500 bg-red-50 dark:bg-red-950/20";
                      } else if (isCorrectAnswer) {
                        containerClass += "border-green-500 bg-green-50 dark:bg-green-950/20";
                      } else {
                        containerClass += "border-border bg-transparent";
                      }
                    } else {
                      if (isSelected) {
                        containerClass += "border-accent bg-accent/10";
                      } else {
                        containerClass += "border-border bg-transparent hover:border-accent/50 hover:bg-accent/5";
                      }
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => !isAnswered && handleAnswerSelect(option)}
                        disabled={isAnswered}
                        className={containerClass}
                      >
                        {/* Circular Label Badge */}
                        <div className="flex-shrink-0 w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-medium">
                          {optionLabels[index]}
                        </div>
                        {/* Option Text */}
                        <div className="flex-1 text-left text-[14px] leading-[1.4]">
                          {option}
                        </div>
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
                      const showResult = isAnswered;

                      let containerClass =
                        "w-full flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ";

                      if (showResult) {
                        if (isSelected && isCorrect) {
                          containerClass += "border-green-500 bg-green-50 dark:bg-green-950/20";
                        } else if (isSelected && !isCorrect) {
                          containerClass += "border-red-500 bg-red-50 dark:bg-red-950/20";
                        } else if (isCorrectAnswer) {
                          containerClass += "border-green-500 bg-green-50 dark:bg-green-950/20";
                        } else {
                          containerClass += "border-border bg-transparent";
                        }
                      } else {
                        if (isSelected) {
                          containerClass += "border-accent bg-accent/10";
                        } else {
                          containerClass += "border-border bg-transparent hover:border-accent/50 hover:bg-accent/5";
                        }
                      }

                      return (
                        <button
                          key={value.toString()}
                          onClick={() => !isAnswered && handleAnswerSelect(value)}
                          disabled={isAnswered}
                          className={containerClass}
                        >
                          <div className="flex-shrink-0 w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-medium">
                            {value ? 'T' : 'F'}
                          </div>
                          <div className="flex-1 text-left text-[14px] leading-[1.4]">
                            {value ? "True" : "False"}
                          </div>
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
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                {currentIndex === quiz.length - 1 ? (
                  <Button
                    onClick={() => setShowResults(true)}
                    disabled={!isAnswered}
                    className="bg-accent hover:bg-accent/90"
                  >
                    Finish Quiz
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={!isAnswered}
                    className="gap-2 bg-accent hover:bg-accent/90"
                  >
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Help / Assistant Section */}
        <div className="flex justify-center">
          <div className="w-full max-w-[580px] rounded-xl border p-4 bg-card">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Ask about this question…"
                value={helpQuestion}
                onChange={(e) => setHelpQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
                className="flex-1 rounded-lg border-input"
              />
              <Button
                size="icon"
                onClick={handleAskQuestion}
                disabled={!helpQuestion.trim()}
                className="rounded-full bg-accent hover:bg-accent/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
