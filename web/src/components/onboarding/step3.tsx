"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/contexts/onboarding-context";
import { motion } from "framer-motion";

const roles = [
  {
    id: "professional",
    emoji: "💼",
    title: "Working professional",
    description: "Employed full or part time",
  },
  {
    id: "student",
    emoji: "🍎",
    title: "Student",
    description: "Lectures, notes, summaries",
  },
  {
    id: "parent",
    emoji: "👶",
    title: "Parent",
    description: "For my child’s classes",
  },
  {
    id: "teacher",
    emoji: "✏️",
    title: "Teacher",
    description: "Record lectures, notes",
  },
  {
    id: "administrator",
    emoji: "🏛️",
    title: "Administrator",
    description: "School or district",
  },
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

export function OnboardingStep3() {
  const [selected, setSelected] = useState<string | null>(null);
  const { saveStep } = useOnboarding();
  const router = useRouter();

  const handleSelect = async (roleId: string) => {
    setSelected(roleId);
    try {
      await saveStep(3, { role: roleId });
      setTimeout(() => router.push("/onboarding/step4"), 280);
    } catch (err) {
      console.error("Failed to save step 3:", err);
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
        Which best describes you?
      </motion.h1>
      <motion.p
        className="mt-2 text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        We’ll surface the right features.
      </motion.p>

      <motion.div
        className="mt-8 space-y-3"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {roles.map((role) => {
          const isSelected = selected === role.id;
          return (
            <motion.button
              key={role.id}
              type="button"
              variants={item}
              className={`cursor-pointer flex w-full items-center gap-4 rounded-xl  px-4 py-4 text-left transition-colors ${
                isSelected
                  ? "border-primary bg-primary/15 text-foreground"
                  : "border-border bg-muted/80 text-foreground hover:border-muted-foreground/50 hover:bg-muted"
              }`}
              onClick={() => handleSelect(role.id)}
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.01 }}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl">
                {role.emoji}
              </span>
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">{role.title}</p>
                <p className="text-sm text-muted-foreground">
                  {role.description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
