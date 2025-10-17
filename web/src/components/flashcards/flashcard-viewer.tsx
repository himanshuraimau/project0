import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RotateCcw, X } from "lucide-react";
import { FlashcardViewerProps } from "@/lib/types";

export const FlashcardViewer: React.FC<FlashcardViewerProps> = ({
  flashcards,
  onClose,
  onGenerate,
  noteTitle,
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
              className="flex items-center gap-2 bg-accent hover:bg-accent/90 cursor-pointer text-accent-foreground text-base px-6 py-3 rounded-lg  transition-all duration-200 hover:"
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
    <div className="w-full mx-auto space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-medium">{noteTitle || "Flashcards"}</h2>
          <span className="text-accent bg-accent/10 text-xs font-medium px-3 py-1.5 rounded-full border border-accent/20">
            {currentIndex + 1} of {flashcards.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleReset}
            variant="outline"
            className="border-stone-200 text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="border-stone-200 text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-stone-200 dark:bg-stone-800 rounded-full h-2.5">
        <div
          className="bg-accent h-2.5 rounded-full transition-all duration-300 "
          style={{
            width: `${((currentIndex + 1) / flashcards.length) * 100}%`,
          }}
        />
      </div>

      {/* Flashcard */}
      <div className="perspective-1000 w-full">
        <Card
          className={`min-h-[420px] p-6 rounded-xl my-6 bg-white dark:bg-stone-900 cursor-pointer transition-all duration-500 transform hover:scale-[1.02]  hover: border border-stone-200 dark:border-stone-700`}
          onClick={handleFlip}
        >
          <CardContent className="flex flex-col items-center justify-center min-h-[320px] space-y-6">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${showAnswer ? 'bg-accent/20' : 'bg-accent/10 dark:bg-accent/20'}`}>
              <span className="text-xl">
                {showAnswer ? 'Answer' : 'Question'}
              </span>
            </div>
            
            <div className="text-center space-y-4">
              <div className={`text-sm font-medium tracking-wide uppercase ${showAnswer ? 'text-accent' : 'text-accent/70 dark:text-accent/80'}`}>
                {showAnswer ? "Answer" : "Question"}
              </div>
              <div className="text-lg text-stone-700 dark:text-stone-300 leading-relaxed max-w-4xl">
                {showAnswer ? currentFlashcard.answer : currentFlashcard.question}
              </div>
            </div>
            
            {!showAnswer && (
              <div className="flex items-center gap-2 text-sm text-accent/70 animate-bounce">
                <span>👆</span>
                <span>Click to reveal answer</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          onClick={handlePrevious}
          disabled={flashcards.length <= 1}
          variant="outline"
          className="flex items-center gap-2 bg-accent/10 border border-accent/20 text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <Button
          onClick={handleNext}
          disabled={flashcards.length <= 1}
          variant="outline"
          className="flex items-center gap-2 bg-accent/10 border border-accent/20 text-stone-600 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 disabled:opacity-50"
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
