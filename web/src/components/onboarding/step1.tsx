"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/contexts/onboarding-context";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  InstagramIcon,
  SmartphoneWifiIcon,
  Facebook01Icon,
  Message01Icon,
  Edit01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

const sources: { id: string; label: string; icon: IconSvgElement }[] = [
  { id: "instagram", label: "Instagram Reels", icon: InstagramIcon },
  { id: "tiktok", label: "TikTok", icon: SmartphoneWifiIcon },
  { id: "facebook", label: "Facebook", icon: Facebook01Icon },
  { id: "appstore", label: "App Store", icon: SmartphoneWifiIcon },
  { id: "reddit", label: "Reddit", icon: Message01Icon },
  { id: "chatgpt", label: "ChatGPT", icon: Message01Icon },
  { id: "friends", label: "From friends or family", icon: Message01Icon },
  { id: "other", label: "Other", icon: Edit01Icon },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function OnboardingStep1() {
  const [selected, setSelected] = useState<string | null>(null);
  const { saveStep } = useOnboarding();
  const router = useRouter();

  const handleSelect = async (sourceId: string) => {
    setSelected(sourceId);
    try {
      await saveStep(1, { source: sourceId });
      setTimeout(() => router.push("/onboarding/step2"), 280);
    } catch (err) {
      console.error("Failed to save step 1:", err);
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
        How did you hear about Flinote?
      </motion.h1>
      <motion.p
        className="mt-2 text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        Pick one — we use this to improve.
      </motion.p>

      <motion.div
        className="mt-8 grid grid-cols-2 gap-3"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {sources.map((source) => {
          const isSelected = selected === source.id;
          return (
            <motion.button
              key={source.id}
              type="button"
              variants={item}
              className={`cursor-pointer flex items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-colors ${
                isSelected
                  ? "border-primary bg-primary/15 text-foreground"
                  : "border-border bg-muted/80 text-foreground hover:border-muted-foreground/50 hover:bg-muted"
              }`}
              onClick={() => handleSelect(source.id)}
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.01 }}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <HugeiconsIcon icon={source.icon} size={16} strokeWidth={2} />
              </span>
              <span className="text-sm font-medium">{source.label}</span>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
