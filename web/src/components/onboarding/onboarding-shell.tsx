"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";

const TOTAL_STEPS = 5;

function getStepFromPathname(pathname: string): number {
  const match = pathname.match(/\/onboarding\/step(\d+)/);
  return match ? Math.min(parseInt(match[1], 10), TOTAL_STEPS) : 1;
}

export function OnboardingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const step = getStepFromPathname(pathname);

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <div className="absolute left-6 top-8 z-10">
        <AnimatePresence mode="wait">
          {step > 1 ? (
            <motion.div
              key="back"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Link
                href={step === 2 ? "/onboarding/step1" : `/onboarding/step${step - 1}`}
                className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={2} />
                Back
              </Link>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12 pt-20">
        <motion.div
          className="mb-10 flex shrink-0 justify-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
            <Image
              src="/logo.png"
              alt=""
              width={36}
              height={36}
              className="object-contain invert"
            />
          </div>
        </motion.div>
        {children}
      </main>

      <div className="flex justify-center gap-2 pb-10">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => {
          const active = s <= step;
          return (
            <motion.div
              key={s}
              className={`h-1.5 w-8 rounded-sm ${active ? "bg-primary" : "border border-border bg-transparent"}`}
              initial={false}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25, ease: [0.33, 1, 0.68, 1] }}
            />
          );
        })}
      </div>
    </div>
  );
}
