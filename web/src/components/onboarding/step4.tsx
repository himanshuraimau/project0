"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/contexts/onboarding-context";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Mic01Icon,
  File01Icon,
  AiChat01Icon,
  Quiz01Icon,
  GraduationScrollIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

const features: { id: string; label: string; icon: IconSvgElement }[] = [
  { id: "record", label: "Record lectures", icon: Mic01Icon },
  { id: "notes", label: "Instant notes", icon: File01Icon },
  { id: "transcripts", label: "Quick transcripts", icon: File01Icon },
  { id: "ai-chat", label: "Chat with AI", icon: AiChat01Icon },
  { id: "quiz", label: "AI quizzes", icon: Quiz01Icon },
  { id: "flashcards", label: "Flashcards", icon: GraduationScrollIcon },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function OnboardingStep4() {
  const [selected, setSelected] = useState<string[]>([]);
  const { saveStep } = useOnboarding();
  const router = useRouter();

  const toggleFeature = (featureId: string) => {
    setSelected((prev) =>
      prev.includes(featureId)
        ? prev.filter((id) => id !== featureId)
        : [...prev, featureId]
    );
  };

  const handleContinue = async () => {
    if (selected.length === 0) return;
    try {
      await saveStep(4, { features: selected });
      router.push("/onboarding/step5");
    } catch (err) {
      console.error("Failed to save step 4:", err);
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
        What will help you most?
      </motion.h1>
      <motion.p
        className="mt-2 text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        Select all that apply.
      </motion.p>

      <motion.div
        className="mt-8 grid grid-cols-2 gap-3"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {features.map((feature) => {
          const isSelected = selected.includes(feature.id);
          return (
            <motion.button
              key={feature.id}
              type="button"
              variants={item}
              className={`cursor-pointer flex flex-col items-center gap-2.5 rounded-xl px-4 py-4 transition-colors ${
                isSelected
                  ? "border-primary bg-primary/15 text-foreground"
                  : "border-border bg-muted/80 text-foreground hover:border-muted-foreground/50 hover:bg-muted"
              }`}
              onClick={() => toggleFeature(feature.id)}
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.02 }}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <HugeiconsIcon icon={feature.icon} size={20} strokeWidth={2} />
              </span>
              <span className="text-sm font-medium">{feature.label}</span>
            </motion.button>
          );
        })}
      </motion.div>

      <motion.div
        className="mt-8"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.35 }}
      >
        <motion.button
          type="button"
          onClick={handleContinue}
          disabled={selected.length === 0}
          className="cursor-pointer h-12 w-full max-w-xs mx-auto rounded-xl bg-primary font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-opacity hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center"
          whileTap={{ scale: 0.98 }}
          whileHover={{ scale: 1.02 }}
        >
          Continue
        </motion.button>
      </motion.div>
    </div>
  );
}
