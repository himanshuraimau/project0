import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RotateCcw, X } from "lucide-react";
import { FlashcardViewerProps } from "@/lib/types";

export const FlashcardViewer: React.FC<FlashcardViewerProps> = ({
  flashcards,
  onClose,
  onGenerate,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  if (flashcards.length === 0) {
    return (
      <div className="h-[92vh] flex items-center justify-center bg-transparent">
        <Card className="bg-transparent border-none">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <h3 className="text-3xl font-medium text-stone-900 dark:text-stone-100 mb-3">
              Generate Flashcards
            </h3>
            <p className="text-stone-600 dark:text-stone-400 text-base text-center mb-6 max-w-md">
              Create interactive flashcards from your notes to enhance memory
              retention and support active recall learning.
            </p>

            <Button
              onClick={onGenerate}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 cursor-pointer text-white text-base px-6 py-3"
            >
              Generate Flashcards
            </Button>

            <p className="text-sm text-stone-500 mt-2">
              This may take a few moments...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentFlashcard = flashcards[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
    setShowAnswer(false);
  };

  const handlePrevious = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + flashcards.length) % flashcards.length
    );
    setShowAnswer(false);
  };

  const handleFlip = () => {
    setShowAnswer(!showAnswer);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setShowAnswer(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Flashcards</h2>
          <span className="text-stone-600 bg-stone-100 text-xs cursor-pointer dark:text-stone-500 dark:bg-stone-900 px-5 py-2 rounded-md">
            {currentIndex + 1} of {flashcards.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleReset}
            className="text-stone-600 bg-stone-100 cursor-pointer dark:text-stone-500 dark:bg-stone-900 px-5 py-2 rounded-md"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={onClose}
            className="text-stone-600 bg-stone-100 cursor-pointer dark:text-stone-500 dark:bg-stone-900 px-5 py-2 rounded-md"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-stone-200 dark:bg-stone-800 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{
            width: `${((currentIndex + 1) / flashcards.length) * 100}%`,
          }}
        />
      </div>

      {/* Flashcard */}
      <Card
        className="min-h-[420px] p-4 rounded-md my-6 max-w-sm mx-auto bg-stone-100 border-none dark:bg-stone-900 cursor-pointer transition-transform duration-200 hover:scale-[1.01]"
        onClick={handleFlip}
      >
        <CardContent className="flex items-center justify-center min-h-[200px]">
          <div className=" space-y-4">
            {showAnswer ? "Answer" : "Question"}
            <div className=" text-stone-600 dark:text-stone-500 leading-relaxed">
              {showAnswer ? currentFlashcard.answer : currentFlashcard.question}
            </div>
            {!showAnswer && (
              <p className="text-sm text-green-500">Click to reveal answer</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          onClick={handlePrevious}
          disabled={flashcards.length <= 1}
          className="flex items-center gap-2 text-stone-600 bg-stone-100 cursor-pointer dark:text-stone-500 dark:bg-stone-900 px-5 py-2 rounded-md"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <Button
          onClick={handleFlip}
          variant={showAnswer ? "secondary" : "default"}
          className="px-8"
        >
          {showAnswer ? "Show Question" : "Show Answer"}
        </Button>

        <Button
          onClick={handleNext}
          disabled={flashcards.length <= 1}
          className="flex items-center gap-2 text-stone-600 bg-stone-100 cursor-pointer dark:text-stone-500 dark:bg-stone-900 px-5 py-2 rounded-md"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="text-xs text-stone-500 text-center space-x-4">
        <span>Space: Flip card</span>
        <span>←/→: Navigate</span>
        <span>R: Reset</span>
      </div>
    </div>
  );
};

// Keyboard navigation hook
export const useFlashcardKeyboard = (
  onNext: () => void,
  onPrevious: () => void,
  onFlip: () => void,
  onReset: () => void,
  onClose: () => void
) => {
  React.useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Don't capture keyboard events when an input, textarea or contentEditable element is focused
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      switch (event.key) {
        case "ArrowRight":
        case "j":
          event.preventDefault();
          onNext();
          break;
        case "ArrowLeft":
        case "k":
          event.preventDefault();
          onPrevious();
          break;
        case " ":
        case "Enter":
          event.preventDefault();
          onFlip();
          break;
        case "r":
        case "R":
          event.preventDefault();
          onReset();
          break;
        case "Escape":
          event.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [onNext, onPrevious, onFlip, onReset, onClose]);
};
