"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/contexts/onboarding-context";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  User02Icon,
  UserGroupIcon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

const userTypes: { id: string; label: string; icon: IconSvgElement }[] = [
  { id: "just-me", label: "Just me", icon: User02Icon },
  { id: "me-family", label: "Me + Family", icon: UserGroupIcon },
  { id: "someone-else", label: "Someone else (not me)", icon: UserCircleIcon },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function OnboardingStep2() {
  const [selected, setSelected] = useState<string | null>(null);
  const { saveStep } = useOnboarding();
  const router = useRouter();

  const handleSelect = async (userTypeId: string) => {
    setSelected(userTypeId);
    try {
      await saveStep(2, { userType: userTypeId });
      setTimeout(() => router.push("/onboarding/step3"), 280);
    } catch (err) {
      console.error("Failed to save step 2:", err);
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
        Who will use Flinote?
      </motion.h1>
      <motion.p
        className="mt-2 text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        We’ll tailor the experience.
      </motion.p>

      <motion.div
        className="mt-8 space-y-3"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {userTypes.map((type) => {
          const isSelected = selected === type.id;
          return (
            <motion.button
              key={type.id}
              type="button"
              variants={item}
              className={`cursor-pointer flex w-full items-center gap-4 rounded-xl px-4 py-4 text-left transition-colors ${
                isSelected
                  ? "border-primary bg-primary/15 text-foreground"
                  : "border-border bg-muted/80 text-foreground hover:border-muted-foreground/50 hover:bg-muted"
              }`}
              onClick={() => handleSelect(type.id)}
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.01 }}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <HugeiconsIcon icon={type.icon} size={20} strokeWidth={2} />
              </span>
              <span className="text-base font-medium">{type.label}</span>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
