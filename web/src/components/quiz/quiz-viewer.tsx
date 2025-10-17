import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import { QuizViewerProps } from "@/lib/types";

export const QuizViewer: React.FC<QuizViewerProps> = ({ quiz, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: number]: string | boolean;
  }>({});
  const [showResults, setShowResults] = useState(false);
  const [showExplanation, setShowExplanation] = useState<{
    [key: number]: boolean;
  }>({});

  if (quiz.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Quiz</span>
            <Button onClick={onClose} variant="outline" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-stone-600 ">No quiz available</p>
        </CardContent>
      </Card>
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

  const handleShowExplanation = () => {
    setShowExplanation({
      ...showExplanation,
      [currentIndex]: true,
    });
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setShowExplanation({});
  };

  const handleFinishQuiz = () => {
    setShowResults(true);
  };

  const calculateScore = () => {
    let correct = 0;
    let totalPoints = 0;
    const maxPointsPerQuestion = 5; // 5 points per correct answer
    const maxTotalPoints = quiz.length * maxPointsPerQuestion;

    quiz.forEach((question, index) => {
      if (
        selectedAnswers[index] ===
        (question.correctAnswer || question.correct_answer)
      ) {
        correct++;
        totalPoints += maxPointsPerQuestion;
      }
    });

    return {
      correct,
      total: quiz.length,
      percentage: Math.round((correct / quiz.length) * 100),
      totalPoints,
      maxTotalPoints,
      pointsPerQuestion: maxPointsPerQuestion,
    };
  };

  const score = calculateScore();
  const allAnswered = quiz.every(
    (_, index) => selectedAnswers[index] !== undefined
  );

  if (showResults) {
    return (
      <div className="w-full space-y-4">
        <Card className="bg-transparent border-none">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span></span>
              <Button onClick={onClose} variant="outline" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className=" flex items-center gap-10">
              <div className="text-6xl font-bold text-accent">
                {score.totalPoints}
              </div>
              <div className="text-lg text-stone-600 dark:text-stone-400">
                out of {score.maxTotalPoints} points
              </div>
              <div className="text-3xl font-semibold text-green-600">
                {score.percentage}%
              </div>
            </div>

            <div className="bg-white dark:bg-stone-900/50 rounded-lg p-4 space-y-3">
              <div className="text-lg font-medium">Quiz Summary</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Correct Answers:</span>
                    <span className="font-semibold text-green-600">
                      {score.correct}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Incorrect Answers:</span>
                    <span className="font-semibold text-red-600">
                      {score.total - score.correct}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Points per Question:</span>
                    <span className="font-semibold">
                      {score.pointsPerQuestion}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Questions:</span>
                    <span className="font-semibold">{score.total}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-lg font-medium">Performance Rating</div>
              <div className="text-lg">
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
            </div>
            <div className="flex justify-center gap-4">
              <Button onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Retake Quiz
              </Button>
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full mt-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-accent bg-accent/10 text-sm font-medium px-3 py-1.5 rounded-full border border-accent/20">
            Question {currentIndex + 1} of {quiz.length}
          </span>
          <span className="text-sm text-accent font-medium">
            Score: {score.totalPoints}/{score.maxTotalPoints} pts
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            onClick={handleReset}
            variant="outline"
            className="border-stone-200 text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800"
            size="sm"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="border-stone-200 text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800"
            size="sm"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-stone-200 dark:bg-stone-800 rounded-full h-2.5">
        <div
          className="bg-accent h-2.5 rounded-full transition-all duration-300 "
          style={{ width: `${((currentIndex + 1) / quiz.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <Card className="min-h-[400px] bg-transparent border-none">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-stone-600 border-none flex items-center">
            {isAnswered && (
              <span
                className={`flex items-center gap-1 ${
                  isCorrect ? "text-green-600" : "text-red-600"
                }`}
              >
                {isCorrect ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {isCorrect
                  ? `Correct (+${score.pointsPerQuestion} pts)`
                  : "Incorrect (+0 pts)"}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 mt-4">
          {/* Question */}
          <div className="text-lg leading-relaxed">
            {currentQuestion.question}
          </div>

          {/* Answer Options */}
          <div className="space-y-3">
            {currentQuestion.type === "multiple_choice" &&
              currentQuestion.options && (
                <div className="space-y-2">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedAnswers[currentIndex] === option;
                    const isCorrectAnswer =
                      option ===
                      (currentQuestion.correctAnswer ||
                        currentQuestion.correct_answer);
                    const showCorrect =
                      isAnswered && !isCorrect && isCorrectAnswer;

                    let buttonClass =
                      "w-full text-left px-6 py-3 rounded-lg border transition-all duration-200 cursor-pointer ";

                    if (isSelected) {
                      // User selected this option
                      if (isCorrect) {
                        buttonClass +=
                          " border-green-500 bg-green-50 text-green-800  dark:bg-green-950/20 dark:text-green-400 dark:border-green-600";
                      } else {
                        buttonClass +=
                          " border-red-500 bg-red-50 text-red-800  dark:bg-red-950/20 dark:text-red-400 dark:border-red-600";
                      }
                    } else if (showCorrect) {
                      // Show correct answer in green when user was wrong
                      buttonClass +=
                        " border-green-500 bg-green-100 text-green-800  dark:bg-green-950/30 dark:text-green-400 dark:border-green-600";
                    } else {
                      buttonClass +=
                        " bg-stone-50 dark:bg-stone-900/50 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-accent hover:bg-accent/5 hover:";
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(option)}
                        disabled={isAnswered}
                        className={buttonClass}
                      >
                        <span className="font-medium mr-2">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        {option}
                        {showCorrect && (
                          <span className="ml-2 text-green-600 font-medium">
                            (Correct Answer)
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

            {currentQuestion.type === "true_false" && (
              <div className="flex gap-4">
                {[true, false].map((value) => {
                  const isSelected = selectedAnswers[currentIndex] === value;
                  const isCorrectAnswer =
                    value ===
                    (currentQuestion.correctAnswer ||
                      currentQuestion.correct_answer);
                  const showCorrect =
                    isAnswered && !isCorrect && isCorrectAnswer;

                  let buttonClass =
                    "flex-1 p-4 rounded-lg border transition-all duration-200 cursor-pointer ";

                  if (isSelected) {
                    // User selected this option
                    if (isCorrect) {
                      buttonClass +=
                        " border-green-500 bg-green-50 text-green-800  dark:bg-green-950/20 dark:text-green-400 dark:border-green-600";
                    } else {
                      buttonClass += 
                        " border-red-500 bg-red-50 text-red-800  dark:bg-red-950/20 dark:text-red-400 dark:border-red-600";
                    }
                  } else if (showCorrect) {
                    // Show correct answer in green when user was wrong
                    buttonClass +=
                      " border-green-500 bg-green-100 text-green-800  dark:bg-green-950/30 dark:text-green-400 dark:border-green-600";
                  } else {
                    buttonClass += 
                      " bg-stone-50 dark:bg-stone-900/50 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-accent hover:bg-accent/5 hover:";
                  }

                  return (
                    <button
                      key={value.toString()}
                      onClick={() => handleAnswerSelect(value)}
                      disabled={isAnswered}
                      className={buttonClass}
                    >
                      <div className="text-center">
                        <div className="">{value ? "True" : "False"}</div>
                        {showCorrect && (
                          <div className="text-xs mt-1 text-green-600 font-medium">
                            (Correct Answer)
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Explanation */}
          {isAnswered && showExplanation[currentIndex] && (
            <div className="mt-4 p-4 bg-accent/5 dark:bg-accent/10 border border-accent/20 rounded-lg">
              <div className="font-medium text-accent mb-2 flex items-center gap-2">
                <span className="text-sm">Tip</span>
                Explanation:
              </div>
              <div className="text-stone-700 dark:text-stone-300 leading-relaxed">
                {currentQuestion.explanation}
              </div>
            </div>
          )}

          {/* Show Explanation Button */}
          {isAnswered && !showExplanation[currentIndex] && (
            <Button
              onClick={handleShowExplanation}
              variant="outline"
              className="text-sm border-accent/30 text-accent hover:bg-accent/10 hover:border-accent px-5 py-2.5 rounded-lg transition-all duration-200"
            >
              Show Explanation
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          variant="outline"
          className="flex items-center gap-2 border-stone-200 text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-4">
          <div className="text-sm text-stone-600 space-y-1">
            <div>
              {Object.keys(selectedAnswers).length} of {quiz.length} answered
            </div>
            <div className="text-xs text-accent font-medium">
              Current: {score.correct} correct • {score.totalPoints} points
            </div>
          </div>
          {allAnswered && (
            <Button
              onClick={handleFinishQuiz}
              className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg  transition-all duration-200 hover:"
            >
              View Final Score
            </Button>
          )}
        </div>

        <Button
          onClick={handleNext}
          disabled={currentIndex === quiz.length - 1}
          variant="outline"
          className="flex items-center gap-2 border-stone-200 text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 disabled:opacity-50"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
