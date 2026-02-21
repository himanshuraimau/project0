"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SparklesIcon,
  Tick01Icon,
  ArrowUp01Icon,
} from "@hugeicons/core-free-icons";

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function UpgradeToYearlyDialog({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
}: UpgradeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-primary">
            <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <HugeiconsIcon icon={ArrowUp01Icon} className="size-5" />
            </span>
            Upgrade to Yearly Plan
          </DialogTitle>
          <DialogDescription className="pt-2">
            Switch to our yearly plan and save big on your subscription.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Price comparison */}
          <div className="rounded-xl border border-border bg-muted/30 p-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="text-sm text-muted-foreground">
                  Current (Monthly)
                </span>
                <div className="text-right">
                  <div className="font-semibold text-foreground">$19/mo</div>
                  <div className="text-xs text-muted-foreground">
                    $228/year
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  Yearly Plan
                </span>
                <div className="text-right">
                  <div className="font-bold text-lg text-primary">$89/year</div>
                  <div className="text-xs text-primary">Save $139 (61% off)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">What you get:</p>
            <ul className="space-y-2">
              {[
                "Save $139 per year",
                "No price increases for 12 months",
                "Same great features",
                "Cancel anytime",
              ].map((benefit, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <HugeiconsIcon icon={Tick01Icon} className="size-3" />
                  </span>
                  <span className="text-muted-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Important note */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <HugeiconsIcon
                icon={SparklesIcon}
                className="size-5 text-primary mt-0.5 shrink-0"
              />
              <p className="text-sm text-foreground/90">
                Your card will be charged immediately when you complete checkout, and the yearly billing starts right away.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1"
          >
            Maybe later
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processing...
              </span>
            ) : (
              "Continue to Payment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
