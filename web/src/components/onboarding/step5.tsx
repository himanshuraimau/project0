"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/contexts/onboarding-context";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";

const studyOptions = [
  { id: "light", emoji: "✅", label: "Light", duration: "10 min / day" },
  { id: "regular", emoji: "🔥", label: "Regular", duration: "20 min / day" },
  { id: "focused", emoji: "💪", label: "Focused", duration: "60 min / day" },
  { id: "intense", emoji: "🚀", label: "Intense", duration: "120 min / day" },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function OnboardingStep5() {
  const [selected, setSelected] = useState<string>("light");
  const [subscribe, setSubscribe] = useState(true);
  const { saveStep, completeOnboarding, isLoading } = useOnboarding();
  const router = useRouter();

  const handleComplete = async () => {
    try {
      await saveStep(5, { studyIntensity: selected, wantsProductUpdates: subscribe });
      await completeOnboarding();
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto text-center">
      <motion.h1
        className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        What’s your study commitment?
      </motion.h1>
      <motion.p
        className="mt-2 text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        We’ll nudge you at the right pace.
      </motion.p>

      <motion.div
        className="mt-8 space-y-3"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {studyOptions.map((option) => {
          const isSelected = selected === option.id;
          return (
            <motion.button
              key={option.id}
              type="button"
              variants={item}
              className={`cursor-pointer flex w-full items-center gap-4 rounded-xl  px-4 py-4 text-left transition-colors ${
                isSelected
                  ? "border-primary bg-primary/15 text-foreground"
                  : "border-border bg-muted/80 text-foreground hover:border-muted-foreground/50 hover:bg-muted"
              }`}
              onClick={() => setSelected(option.id)}
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.01 }}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl">
                {option.emoji}
              </span>
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">{option.label}</p>
                <p className="text-sm text-muted-foreground">
                  {option.duration}
                </p>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      <motion.label
        className="mt-6 flex cursor-pointer items-center justify-center gap-3 text-left"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <button
          type="button"
          role="checkbox"
          aria-checked={subscribe}
          onClick={() => setSubscribe((s) => !s)}
          className={`cursor-pointer flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
            subscribe
              ? "border-primary bg-primary"
              : "border-border bg-transparent"
          }`}
        >
          {subscribe && (
            <HugeiconsIcon
              icon={CheckmarkCircle01Icon}
              size={12}
              color="var(--primary-foreground)"
              strokeWidth={2.5}
            />
          )}
        </button>
        <span className="text-sm text-muted-foreground">
          Get Flinote tips and product updates
        </span>
      </motion.label>

      <motion.div
        className="mt-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.35 }}
      >
        <motion.button
          type="button"
          onClick={handleComplete}
          disabled={isLoading}
          className="cursor-pointer h-12 w-full max-w-xs mx-auto rounded-xl bg-primary font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-opacity hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
          whileTap={{ scale: 0.98 }}
          whileHover={{ scale: 1.02 }}
        >
          {isLoading ? "Setting things up…" : "Get started"}
        </motion.button>
      </motion.div>
    </div>
  );
}
