"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ZapIcon, CreditCardIcon, AlertTriangleIcon } from "lucide-react";
import Link from "next/link";

interface CreditDisplayProps {
  initialCredits?: number;
  showPurchaseButton?: boolean;
}

export function CreditDisplay({
  initialCredits = 0,
  showPurchaseButton = true,
}: CreditDisplayProps) {
  const [credits, setCredits] = useState(initialCredits);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch current credits
  useEffect(() => {
    const fetchCredits = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/users/credits");
        if (response.ok) {
          const data = await response.json();
          setCredits(data.credits);
        }
      } catch (error) {
        console.error("Error fetching credits:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCredits();
  }, []);

  const isLowCredits = credits <= 5;
  const isOutOfCredits = credits <= 0;

  return (
    <div className="p-3 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`p-1 rounded-full ${
              isLowCredits
                ? "bg-yellow-100 dark:bg-yellow-900/30"
                : "bg-blue-100 dark:bg-blue-900/30"
            }`}
          >
            {isLowCredits ? (
              <AlertTriangleIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            ) : (
              <ZapIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <span className="font-semibold text-stone-900 dark:text-stone-100 text-sm">
            {isLoading ? "..." : credits}
          </span>
          <span className="text-xs text-stone-500 dark:text-stone-400 ml-1">
            Credits
          </span>
        </div>
        {showPurchaseButton && (
          <Button
            asChild
            size="sm"
            variant={isLowCredits ? "default" : "outline"}
            className="px-2 py-1 text-xs h-7"
          >
            <Link href="/credits" className="flex items-center gap-1">
              <CreditCardIcon className="h-3 w-3" />
              {isOutOfCredits ? "Buy" : "Top Up"}
            </Link>
          </Button>
        )}
      </div>
      <div className="text-xs text-stone-500 dark:text-stone-400">
        {isOutOfCredits
          ? "Purchase credits to continue."
          : isLowCredits
          ? "Low balance - purchase more credits."
          : "Available for notes, quizzes & flashcards."}
      </div>
      {isLowCredits && (
        <div className="mt-2 pt-2 border-t border-stone-200 dark:border-stone-800">
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {isOutOfCredits
              ? "You need credits to create notes, quizzes, and flashcards."
              : `You have ${credits} credit${
                  credits === 1 ? "" : "s"
                } remaining.`}
          </p>
        </div>
      )}
    </div>
  );
}
