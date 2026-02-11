import React from "react";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MedalFirstPlaceIcon,
  Tick01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";

interface SessionCompleteProps {
  totalCards: number;
  correctCards: number;
  incorrectCards: number;
  onRestart?: () => void;
  onClose?: () => void;
}

export const SessionComplete: React.FC<SessionCompleteProps> = ({
  totalCards,
  correctCards,
  incorrectCards,
  onRestart,
  onClose,
}) => {
  const accuracy = totalCards > 0 ? Math.round((correctCards / totalCards) * 100) : 0;

  return (
    <div className="w-full flex items-center justify-center py-6">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 text-primary mb-4">
            <HugeiconsIcon icon={MedalFirstPlaceIcon} className="size-8" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-1">
            Session complete
          </h1>
          <p className="text-sm text-muted-foreground">
            Great work—this repetition just strengthened your memory traces.
          </p>
        </div>

        {/* Main score card */}
        <div className="rounded-2xl border border-border bg-card shadow-sm p-6 mb-6">
          <div className="text-center mb-6">
            <div className="text-4xl font-semibold text-foreground mb-1">
              {accuracy}%
            </div>
            <div className="text-sm text-muted-foreground">
              Overall accuracy this session
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${accuracy}%` }}
              />
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="rounded-xl border border-border bg-muted/40 p-4 text-center">
              <div className="text-lg font-semibold text-foreground">
                {totalCards}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Total cards
              </div>
            </div>

            <div className="rounded-xl border border-border bg-emerald-50/80 dark:bg-emerald-950/30 p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <HugeiconsIcon
                  icon={Tick01Icon}
                  className="size-4 text-emerald-600 dark:text-emerald-300"
                />
                <span className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                  {correctCards}
                </span>
              </div>
              <div className="text-xs text-emerald-700 dark:text-emerald-300">
                Got it right
              </div>
            </div>

            <div className="rounded-xl border border-border bg-red-50/80 dark:bg-red-950/30 p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  className="size-4 text-red-600 dark:text-red-300"
                />
                <span className="text-lg font-semibold text-red-600 dark:text-red-300">
                  {incorrectCards}
                </span>
              </div>
              <div className="text-xs text-red-600 dark:text-red-300">
                To review again
              </div>
            </div>
          </div>
        </div>

        {/* Quick insight */}
        <div className="rounded-2xl border border-border bg-muted/40 px-5 py-4 mb-6">
          <p className="text-sm text-muted-foreground">
            {accuracy >= 80
              ? "You’re retaining this note very well. Space out the next review for long-term memory."
              : accuracy >= 50
              ? "Solid progress—focus your next session on the cards you missed."
              : "Good start. Another quick pass will significantly improve your recall."}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          {onRestart && (
            <Button
              onClick={onRestart}
              className="h-10 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 px-6 text-sm font-medium"
            >
              Study again
            </Button>
          )}
          {onClose && (
            <Button
              onClick={onClose}
              variant="outline"
              className="h-10 rounded-lg px-6 text-sm font-medium"
            >
              Back to note
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
