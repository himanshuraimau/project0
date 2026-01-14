import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Share2, Star } from "lucide-react";
import { FlashcardViewerProps } from "@/lib/types";
import { useRouter } from "next/navigation";
import { SessionComplete } from "./SessionComplete";

export const FlashcardViewer: React.FC<FlashcardViewerProps> = ({
  flashcards,
  onClose,
  onGenerate,
  noteTitle,
}) => {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [gotRight, setGotRight] = useState<number[]>([]);
  const [gotWrong, setGotWrong] = useState<number[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);

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
              className="flex items-center gap-2 bg-accent hover:bg-accent/90 cursor-pointer text-accent-foreground text-base px-6 py-3 rounded-lg transition-all duration-200"
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
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setShowAnswer(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setShowAnswer(false);
    }
  };

  const handleFlip = () => {
    setShowAnswer(!showAnswer);
  };

  const handleGotRight = () => {
    if (!gotRight.includes(currentIndex)) {
      setGotRight([...gotRight, currentIndex]);
      // Remove from wrong if it was there
      setGotWrong(gotWrong.filter(i => i !== currentIndex));
    }
    if (currentIndex < flashcards.length - 1) {
      handleNext();
    } else {
      // Last card - mark session as complete
      setSessionComplete(true);
    }
  };

  const handleGotWrong = () => {
    if (!gotWrong.includes(currentIndex)) {
      setGotWrong([...gotWrong, currentIndex]);
      // Remove from right if it was there
      setGotRight(gotRight.filter(i => i !== currentIndex));
    }
    if (currentIndex < flashcards.length - 1) {
      handleNext();
    } else {
      // Last card - mark session as complete
      setSessionComplete(true);
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = window.location.href;
      if (navigator.share) {
        await navigator.share({
          title: `Flashcards: ${noteTitle}`,
          text: 'Check out these AI-generated flashcards!',
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
    // You can add API call here to save favorite status
  };

  const handleRestartSession = () => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setGotRight([]);
    setGotWrong([]);
    setSessionComplete(false);
  };

  const handleCloseSession = () => {
    router.push('/dashboard');
  };

  return (
    <div className="px-20 py-6">
      {/* Header with Breadcrumb and Actions */}
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
              <li className="text-foreground font-medium truncate max-w-[300px] sm:max-w-[500px]">
                Flashcards
              </li>
            </ol>

            {/* Share and Star Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="gap-2 rounded-2xl"
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
          <div className="text-2xl text-purple-800 pb-2">Flashcards for:</div>
          <h1 className="text-[19px] font-bold text-foreground leading-tight">
            {noteTitle || "Flashcards"}
          </h1>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[13px] text-muted-foreground">
            Card {currentIndex + 1} of {flashcards.length}
          </div>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 dark:bg-purple-400 transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / flashcards.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Flashcard Container with Stacked Deck Effect */}
      <div className="pt-12 pb-8">
        <div className="max-w-4xl mx-auto flex justify-center">

          {sessionComplete ? (
            <SessionComplete
              totalCards={flashcards.length}
              correctCards={gotRight.length}
              incorrectCards={gotWrong.length}
              onRestart={handleRestartSession}
              onClose={handleCloseSession}
            />
          ) : (
            <div className="relative" style={{ width: '560px', height: '300px', perspective: '1000px' }}>
              {/* Background Stacked Cards */}
              {flashcards.length - currentIndex - 1 >= 2 && (
                <div
                  className="absolute left-1/2 top-0 bg-white dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm"
                  style={{
                    width: '560px',
                    height: '300px',
                    transform: 'translateX(-50%) scale(0.92) translateY(-16px)',
                    opacity: 0.7,
                    zIndex: -2,
                  }}
                />
              )}
              {flashcards.length - currentIndex - 1 >= 1 && (
                <div
                  className="absolute left-1/2 top-0 bg-white dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm"
                  style={{
                    width: '560px',
                    height: '300px',
                    transform: 'translateX(-50%) scale(0.96) translateY(-8px)',
                    opacity: 0.85,
                    zIndex: -1,
                  }}
                />
              )}

              {/* Main Flashcard with 3D Flip */}
              <div
                className="absolute left-1/2 top-0 cursor-pointer"
                style={{
                  width: '560px',
                  height: '300px',
                  transformStyle: 'preserve-3d',
                  transform: `translateX(-50%) ${showAnswer ? 'rotateY(180deg)' : 'rotateY(0deg)'}`,
                  transition: 'transform 500ms cubic-bezier(0.4, 0.0, 0.2, 1)',
                }}
                onClick={handleFlip}
              >
                {/* Front of Card */}
                <div
                  className="absolute w-full h-full bg-white dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 p-8 flex flex-col items-center justify-center"
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                  }}
                >
                  <div className="text-center space-y-3 w-full">
                    <div className="text-[19px] font-medium leading-[1.5] text-foreground">
                      {currentFlashcard.question}
                    </div>
                  </div>

                  {!showAnswer && (
                    <div className="text-[13px] text-muted-foreground mt-3 opacity-60">
                      Click or press space to flip
                    </div>
                  )}
                </div>

                {/* Back of Card */}
                <div
                  className="absolute w-full h-full bg-purple-50 dark:bg-purple-950/20 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 p-8 flex flex-col items-center justify-center"
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  <div className="text-center space-y-3 w-full">
                    <div className="text-[19px] font-medium leading-[1.5] text-foreground">
                      {currentFlashcard.answer}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Controls */}
      <div className="flex flex-col items-center mt-6 max-w-4xl mx-auto">{!sessionComplete && (
        <div className="flex items-center gap-3">
          {/* Previous Arrow */}
          <Button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            variant="ghost"
            size="icon"
            className="w-9 h-9 rounded-full disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {/* Got it Wrong */}
          <Button
            onClick={handleGotWrong}
            variant="outline"
            className="box-border w-[134px] h-[38px] bg-[#FEF2F2] border border-[#FFC9C9] rounded-[8px] flex-none grow-0 text-destructive"
          >
            Got it wrong
          </Button>

          {/* Got it Right */}
          <Button
            onClick={handleGotRight}
            className="w-[133px] h-[38px] bg-[#00C950] rounded-[8px] flex-none grow-0 text-white font-medium transition-all"
          >
            Got it right
          </Button>

          {/* Next Arrow */}
          <Button
            onClick={handleNext}
            disabled={currentIndex === flashcards.length - 1}
            variant="ghost"
            size="icon"
            className="w-9 h-9 rounded-full disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}
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
