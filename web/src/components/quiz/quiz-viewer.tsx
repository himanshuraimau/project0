import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RotateCcw, X, Check, AlertCircle } from 'lucide-react';
import { QuizQuestion } from '@/hooks/use-quiz';

interface QuizViewerProps {
  quiz: QuizQuestion[];
  onClose: () => void;
}

export const QuizViewer: React.FC<QuizViewerProps> = ({
  quiz,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string | boolean }>({});
  const [showResults, setShowResults] = useState(false);
  const [showExplanation, setShowExplanation] = useState<{ [key: number]: boolean }>({});

  if (quiz.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Quiz</span>
            <Button onClick={onClose} variant="outline" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-600">No quiz available</p>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = quiz[currentIndex];
  const isAnswered = selectedAnswers[currentIndex] !== undefined;
  const isCorrect = selectedAnswers[currentIndex] === currentQuestion.correct_answer;

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
      [currentIndex]: answer
    });
  };

  const handleShowExplanation = () => {
    setShowExplanation({
      ...showExplanation,
      [currentIndex]: true
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
    quiz.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct_answer) {
        correct++;
      }
    });
    return { correct, total: quiz.length, percentage: Math.round((correct / quiz.length) * 100) };
  };

  const score = calculateScore();
  const allAnswered = quiz.every((_, index) => selectedAnswers[index] !== undefined);

  if (showResults) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Quiz Results</span>
              <Button onClick={onClose} variant="outline" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-4xl font-bold text-blue-600">
              {score.percentage}%
            </div>
            <div className="text-lg">
              You scored {score.correct} out of {score.total} questions correctly
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
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Quiz</h2>
          <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
            Question {currentIndex + 1} of {quiz.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleReset} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={onClose} variant="outline" size="sm">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / quiz.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <Card className="min-h-[400px]">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <span>{currentQuestion.type.replace('_', ' ').toUpperCase()}</span>
            {isAnswered && (
              <span className={`flex items-center gap-1 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                {isCorrect ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {isCorrect ? 'Correct' : 'Incorrect'}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question */}
          <div className="text-lg leading-relaxed">
            {currentQuestion.question}
          </div>

          {/* Answer Options */}
          <div className="space-y-3">
            {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
              <div className="space-y-2">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswers[currentIndex] === option;
                  const isCorrectAnswer = option === currentQuestion.correct_answer;
                  const showCorrect = isAnswered && !isCorrect && isCorrectAnswer;
                  
                  let buttonClass = 'w-full text-left p-3 rounded-lg border transition-colors ';
                  
                  if (isSelected) {
                    // User selected this option
                    if (isCorrect) {
                      buttonClass += 'border-green-500 bg-green-50 text-green-800';
                    } else {
                      buttonClass += 'border-red-500 bg-red-50 text-red-800';
                    }
                  } else if (showCorrect) {
                    // Show correct answer in green when user was wrong
                    buttonClass += 'border-green-500 bg-green-100 text-green-800';
                  } else {
                    buttonClass += 'border-gray-200 hover:border-gray-300';
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(option)}
                      disabled={isAnswered}
                      className={buttonClass}
                    >
                      <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                      {option}
                      {showCorrect && (
                        <span className="ml-2 text-green-600 font-medium">(Correct Answer)</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {currentQuestion.type === 'true_false' && (
              <div className="flex gap-4">
                {[true, false].map((value) => {
                  const isSelected = selectedAnswers[currentIndex] === value;
                  const isCorrectAnswer = value === currentQuestion.correct_answer;
                  const showCorrect = isAnswered && !isCorrect && isCorrectAnswer;
                  
                  let buttonClass = 'flex-1 p-3 rounded-lg border transition-colors ';
                  
                  if (isSelected) {
                    // User selected this option
                    if (isCorrect) {
                      buttonClass += 'border-green-500 bg-green-50 text-green-800';
                    } else {
                      buttonClass += 'border-red-500 bg-red-50 text-red-800';
                    }
                  } else if (showCorrect) {
                    // Show correct answer in green when user was wrong
                    buttonClass += 'border-green-500 bg-green-100 text-green-800';
                  } else {
                    buttonClass += 'border-gray-200 hover:border-gray-300';
                  }

                  return (
                    <button
                      key={value.toString()}
                      onClick={() => handleAnswerSelect(value)}
                      disabled={isAnswered}
                      className={buttonClass}
                    >
                      <div className="text-center">
                        <div>{value ? 'True' : 'False'}</div>
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
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="font-medium text-blue-800 mb-2">Explanation:</div>
              <div className="text-blue-700">{currentQuestion.explanation}</div>
            </div>
          )}

          {/* Show Explanation Button */}
          {isAnswered && !showExplanation[currentIndex] && (
            <Button onClick={handleShowExplanation} variant="outline" size="sm">
              Show Explanation
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          onClick={handlePrevious}
          variant="outline"
          disabled={currentIndex === 0}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {Object.keys(selectedAnswers).length} of {quiz.length} answered
          </span>
          {allAnswered && (
            <Button onClick={handleFinishQuiz} className="bg-green-600 hover:bg-green-700">
              Finish Quiz
            </Button>
          )}
        </div>

        <Button
          onClick={handleNext}
          variant="outline"
          disabled={currentIndex === quiz.length - 1}
          className="flex items-center gap-2"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
