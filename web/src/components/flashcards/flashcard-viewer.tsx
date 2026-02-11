import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Share07Icon,
  StarIcon,
  Tick01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { FlashcardViewerProps } from "@/lib/types";
import { useRouter } from "next/navigation";
import { SessionComplete } from "./SessionComplete";
import { toast } from "sonner";

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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Card className="rounded-xl border border-border bg-card shadow-sm">
          <CardContent className="py-10 px-6 text-center space-y-3">
            <h3 className="text-xl font-semibold text-foreground">
              Generate flashcards
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Turn this note into a focused flashcard session to practice active
              recall and spaced repetition.
            </p>
            <Button
              onClick={onGenerate}
              className="h-10 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 px-5 text-sm font-medium"
            >
              Start flashcard session
            </Button>
            <p className="text-xs text-muted-foreground">
              This may take a few moments…
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
          text: "Check out these AI-generated flashcards!",
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
    router.back();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header and progress */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Flashcards session
            </p>
            <h1 className="mt-1 text-xl font-semibold text-foreground">
              {noteTitle || "Flashcards"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Card {currentIndex + 1} of {flashcards.length} ·{" "}
              {gotRight.length} got it right · {gotWrong.length} to review
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

        <div className="mt-4 h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / flashcards.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Flashcard and completion views */}
      <div className="mt-8 flex justify-center">
        {sessionComplete ? (
          <SessionComplete
            totalCards={flashcards.length}
            correctCards={gotRight.length}
            incorrectCards={gotWrong.length}
            onRestart={handleRestartSession}
            onClose={handleCloseSession}
          />
        ) : (
          <div className="relative w-full max-w-xl aspect-4/3">
            {/* Subtle stacked background cards */}
            {flashcards.length - currentIndex - 1 >= 2 && (
              <div className="absolute inset-0 rounded-xl border border-border bg-card opacity-60 scale-[0.94] translate-y-3" />
            )}
            {flashcards.length - currentIndex - 1 >= 1 && (
              <div className="absolute inset-0 rounded-xl border border-border bg-card opacity-80 scale-[0.97] translate-y-1.5" />
            )}

            {/* Main flashcard with flip */}
            <div
              className="absolute inset-0 cursor-pointer"
              style={{
                transformStyle: "preserve-3d",
                transform: showAnswer ? "rotateY(180deg)" : "rotateY(0deg)",
                transition:
                  "transform 500ms cubic-bezier(0.4, 0.0, 0.2, 1)",
              }}
              onClick={handleFlip}
            >
              {/* Front */}
              <div
                className="absolute inset-0 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow duration-200 p-6 sm:p-8 flex flex-col items-center justify-center"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              >
                <div className="w-full text-center space-y-3">
                  <div className="text-[17px] font-medium leading-normal text-foreground">
                    {currentFlashcard.question}
                  </div>
                </div>

                {!showAnswer && (
                  <div className="mt-3 text-[13px] text-muted-foreground opacity-70">
                    Click or press space to flip
                  </div>
                )}
              </div>

              {/* Back */}
              <div
                className="absolute inset-0 rounded-xl border border-border bg-muted shadow-sm hover:shadow-md transition-shadow duration-200 p-6 sm:p-8 flex flex-col items-center justify-center"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <div className="w-full text-center space-y-3">
                  <div className="text-[17px] font-medium leading-normal text-foreground">
                    {currentFlashcard.answer}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      {!sessionComplete && (
        <div className="mt-8 flex flex-col items-center">
          <div className="flex items-center gap-3">
            <Button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full border-border text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
            </Button>

            <Button
              onClick={handleGotWrong}
              variant="outline"
              className="h-10 rounded-lg border-destructive/40 bg-destructive/5 text-sm font-medium text-destructive px-4"
            >
              Got it wrong
            </Button>

            <Button
              onClick={handleGotRight}
              className="h-10 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium px-4"
            >
              Got it right
            </Button>

            <Button
              onClick={handleNext}
              disabled={currentIndex === flashcards.length - 1}
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full border-border text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
            </Button>
          </div>
        </div>
      )}
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
