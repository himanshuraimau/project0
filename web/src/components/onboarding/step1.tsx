"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/contexts/onboarding-context";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  GoogleIcon,
  YoutubeIcon,
  InstagramIcon,
  TiktokIcon,
  Facebook01Icon,
  NewTwitterIcon,
  Linkedin01Icon,
  RedditIcon,
  PinterestIcon,
  SnapchatIcon,
  ThreadsIcon,
  AppStoreIcon,
  ChatGptIcon,
  UserMultiple02Icon,
  Edit01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

const sources: { id: string; label: string; icon: IconSvgElement }[] = [
  { id: "google", label: "Google Search", icon: GoogleIcon },
  { id: "youtube", label: "YouTube", icon: YoutubeIcon },
  { id: "instagram", label: "Instagram", icon: InstagramIcon },
  { id: "tiktok", label: "TikTok", icon: TiktokIcon },
  { id: "facebook", label: "Facebook", icon: Facebook01Icon },
  { id: "twitter", label: "Twitter / X", icon: NewTwitterIcon },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin01Icon },
  { id: "reddit", label: "Reddit", icon: RedditIcon },
  { id: "pinterest", label: "Pinterest", icon: PinterestIcon },
  { id: "snapchat", label: "Snapchat", icon: SnapchatIcon },
  { id: "threads", label: "Threads", icon: ThreadsIcon },
  { id: "chatgpt", label: "ChatGPT", icon: ChatGptIcon },
  { id: "appstore", label: "App Store", icon: AppStoreIcon },
  { id: "friends", label: "Friends or family", icon: UserMultiple02Icon },
  { id: "other", label: "Other", icon: Edit01Icon },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function OnboardingStep1() {
  const [selected, setSelected] = useState<string | null>(null);
  const [otherText, setOtherText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const otherInputRef = useRef<HTMLInputElement>(null);
  const { saveStep } = useOnboarding();
  const router = useRouter();

  const isOther = selected === "other";

  useEffect(() => {
    if (isOther) {
      otherInputRef.current?.focus();
    }
  }, [isOther]);

  const advance = async (sourceId: string, detail?: string) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await saveStep(1, {
        source: sourceId,
        sourceDetail: detail?.trim() || undefined,
      });
      setTimeout(() => router.push("/onboarding/step2"), 200);
    } catch (err) {
      console.error("Failed to save step 1:", err);
      setSubmitting(false);
    }
  };

  const handleSelect = (sourceId: string) => {
    setSelected(sourceId);
    if (sourceId === "other") return;
    advance(sourceId);
  };

  const handleOtherSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!otherText.trim()) return;
    advance("other", otherText);
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

      <AnimatePresence>
        {isOther && (
          <motion.form
            key="other-form"
            onSubmit={handleOtherSubmit}
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.22, ease: [0.33, 1, 0.68, 1] }}
            className="mt-4 overflow-hidden text-left"
          >
            <label
              htmlFor="other-source"
              className="block text-xs font-medium text-muted-foreground"
            >
              Where did you hear about us?
            </label>
            <div className="mt-2 flex gap-2">
              <input
                ref={otherInputRef}
                id="other-source"
                type="text"
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                placeholder="e.g. a podcast, newsletter, blog…"
                maxLength={200}
                className="flex-1 rounded-lg border border-border bg-muted/80 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="submit"
                disabled={!otherText.trim() || submitting}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
