"use client";

import { PricingCard } from "@/components/subscription/pricing-card";
import { SubscriptionStatusCard } from "@/components/subscription/subscription-status-card";
import { Navbar } from "@/components/shared/navbar";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SparklesIcon,
  File01Icon,
  Brain01Icon,
} from "@hugeicons/core-free-icons";
import { useEffect, useState } from "react";

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export default function PricingPage() {
  const [hasSubscription, setHasSubscription] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const response = await fetch("/api/subscription/status");
        if (response.ok) {
          const data = await response.json();
          setHasSubscription(data.hasSubscription);
        }
      } catch (error) {
        console.error("Failed to fetch subscription status", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionStatus();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar title="Pricing" showBackToDashboard={true} />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="flex flex-col gap-12 lg:flex-row lg:gap-16 lg:items-start">
          {/* Left: Hero + features */}
          <div className="flex-1 min-w-0">
            <motion.div
              className="mx-auto max-w-xl text-center lg:max-w-none lg:text-left mb-16"
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 mb-6">
                <HugeiconsIcon
                  icon={SparklesIcon}
                  className="size-4 text-primary"
                />
                <span className="text-sm font-medium text-primary">
                  Simple pricing
                </span>
              </div>

              <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-5xl">
                Unlock unlimited learning
              </h1>

              <p className="mt-4 text-lg text-muted-foreground leading-relaxed sm:max-w-xl lg:mx-0">
                One simple plan. All features included. No hidden fees.
              </p>
            </motion.div>

            <motion.div
              className="grid gap-4 sm:grid-cols-2 lg:max-w-2xl"
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <FeatureCard
                icon={File01Icon}
                title="Process anything"
                description="PDFs, audio, YouTube videos, and web pages — one place."
              />
              <FeatureCard
                icon={Brain01Icon}
                title="AI-powered notes"
                description="Smart notes, flashcards, quizzes, and mind maps."
              />
            </motion.div>

            {/* Trust line */}
            <motion.p
              className="mt-10 text-sm text-muted-foreground lg:max-w-xl"
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              transition={{ duration: 0.5, delay: 0.25 }}
            >
              Join students and professionals who use Flinote to learn faster and
              remember more.
            </motion.p>
          </div>

          {/* Right: Pricing or subscription card */}
          <div className="w-full shrink-0 lg:w-[420px]">
            {!loading && !hasSubscription && (
              <motion.div
                className="sticky top-24"
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <PricingCard />
              </motion.div>
            )}

            {!loading && hasSubscription && (
              <motion.div
                className="sticky top-24"
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <SubscriptionStatusCard />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof File01Icon;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      className="rounded-xl border border-border bg-card p-6 text-left shadow-sm transition-colors hover:bg-muted/30"
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <HugeiconsIcon icon={Icon} className="size-6" />
      </div>
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}
