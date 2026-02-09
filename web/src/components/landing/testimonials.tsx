"use client";

import { Button } from "@/components/ui/button";
import { Zap, LayoutDashboard } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";

const testimonials = [
  {
    quote:
      "I went from drowning in lecture notes to acing exams. The flashcards and quizzes generated from my notes saved me hours every week.",
    name: "Liam Turner",
    level: "Medical student",
    duration: "4 months",
    avatar: "LT",
  },
  {
    quote:
      "The mindmaps helped me see connections I never would have found on my own. My essay grades went from Bs to As in one semester.",
    name: "Sara Kim",
    level: "Upper-Intermediate",
    duration: "6 months",
    avatar: "SK",
  },
  {
    quote:
      "I struggled to stay focused before. Now I turn every PDF into a quiz, study in bite-sized chunks, and actually remember what I read.",
    name: "Anna Salmon",
    level: "Law student",
    duration: "2 months",
    avatar: "AS",
  },
  {
    quote:
      "Started with zero structure. Flinote turned my messy notes into clear summaries, flashcards, and podcasts. Game changer for finals.",
    name: "Yuki Matsuda",
    level: "Beginner",
    duration: "1 month",
    avatar: "YM",
  },
];

export function Testimonials() {
  const { data: session } = useSession();

  return (
    <section className="border-b border-border bg-muted/30 py-16 md:py-28">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <span className="inline-flex w-fit rounded-lg bg-primary/10 px-3 py-1.5 mb-4 text-sm font-medium text-primary">
              Real feedback
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl">
              What Our
              <br />
              Learners Say
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {!session ? (
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="rounded-lg bg-primary font-medium cursor-pointer text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  Start Learning
                </Button>
              </Link>
            ) : (
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="rounded-lg bg-primary border-none text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  Dashboard
                  <LayoutDashboard className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            )}
            <Link href="/sign-in">
              <Button
                size="lg"
                variant="outline"
                className="rounded-lg border-none font-medium cursor-pointer bg-primary/10 text-primary hover:bg-primary/10"
              >
                Try free lesson
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-4 pt-2 md:gap-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {testimonials.map(({ quote, name, level, duration, avatar }) => (
            <div
              key={name}
              className="min-w-[300px] max-w-[340px] shrink-0 flex flex-col gap-8 rounded-2xl border border-border bg-card p-6 md:min-w-[320px]"
            >
              <p className="relative text-sm leading-relaxed text-foreground md:text-base">
                <span className="absolute -top-1 right-0 text-4xl font-serif leading-none text-primary/20">
                  "
                </span>
                {quote}
              </p>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                  {avatar}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">
                    {name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {level} · {duration}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
