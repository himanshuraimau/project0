"use client";

import {
  Upload,
  Sparkles,
  BookOpen,
  FileText,
  Youtube,
  BrainCircuit,
  CheckCircle2,
  MessageCircle,
  TrendingUp,
  MoreHorizontal,
  Play,
  Search,
} from "lucide-react";

// --- Custom Visual Components for the Right Side ---

const Step1Visual = () => (
  <div className="relative flex h-full w-full items-center justify-center bg-muted/20">
    {/* Technical Background Pattern: Dots instead of Gradient */}
    <div
      className="absolute inset-0 opacity-[0.4]"
      style={{
        backgroundImage: "radial-gradient(#a1a1aa 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    />

    {/* Main "Drop Zone" UI */}
    <div className="relative z-10 flex h-40 w-72 flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/20 bg-card px-6 py-8 text-center shadow-sm transition-all hover:border-primary/50 hover:bg-card/80">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Upload className="h-5 w-5" strokeWidth={2.5} />
      </div>
      <p className="text-sm font-semibold text-foreground">Upload or Drop</p>
      <p className="mt-1 text-xs text-muted-foreground">
        PDF, MP4, MP3, or URL
      </p>
    </div>

    {/* Floating "File" Cards - positioned to look like a messy desk being organized */}
    <div className="absolute top-8 right-12 z-20 flex items-center gap-3 rounded-lg border border-border bg-card p-2 shadow-lg shadow-black/5 animate-bounce [animation-duration:4s]">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-100 text-red-600 dark:bg-red-900/20">
        <Youtube size={16} strokeWidth={2.5} />
      </div>
      <div className="hidden min-w-[60px] flex-col gap-1 pr-2 md:flex">
        <div className="h-1.5 w-12 rounded-full bg-muted-foreground/20" />
        <div className="h-1.5 w-8 rounded-full bg-muted-foreground/20" />
      </div>
    </div>

    <div className="absolute bottom-8 left-12 z-20 -rotate-3 flex items-center gap-3 rounded-lg border border-border bg-card p-2 shadow-lg shadow-black/5 transition-transform hover:rotate-0">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-100 text-orange-600 dark:bg-orange-900/20">
        <FileText size={16} strokeWidth={2.5} />
      </div>
      <div className="hidden min-w-[60px] flex-col gap-1 pr-2 md:flex">
        <div className="h-1.5 w-16 rounded-full bg-muted-foreground/20" />
        <div className="h-1.5 w-10 rounded-full bg-muted-foreground/20" />
      </div>
    </div>
  </div>
);

const Step2Visual = () => (
  <div className="relative flex h-full w-full items-center justify-center bg-muted/20 p-8">
    <div className="relative z-10 w-72 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
        </div>
        <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
          <span>Analyzing</span>
        </div>
      </div>

      {/* Content Body */}
      <div className="space-y-3 p-5">
        <div className="flex gap-2">
          <div className="h-2 w-1/3 rounded-full bg-muted-foreground/20" />
          <div className="h-2 w-1/4 rounded-full bg-muted-foreground/20" />
        </div>
        <div className="h-2 w-full rounded-full bg-muted-foreground/10" />
        <div className="h-2 w-5/6 rounded-full bg-muted-foreground/10" />
        <div className="h-2 w-4/5 rounded-full bg-muted-foreground/10" />

        {/* Extracted Tags */}
        <div className="mt-4 flex flex-wrap gap-2 pt-2">
          <span className="rounded-md border border-green-200 bg-green-50 px-2 py-1 text-[10px] font-medium text-green-700 dark:border-green-900/30 dark:bg-green-900/10 dark:text-green-400">
            Concept
          </span>
          <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700 dark:border-blue-900/30 dark:bg-blue-900/10 dark:text-blue-400">
            Definition
          </span>
          <span className="rounded-md border border-purple-200 bg-purple-50 px-2 py-1 text-[10px] font-medium text-purple-700 dark:border-purple-900/30 dark:bg-purple-900/10 dark:text-purple-400">
            Formula
          </span>
        </div>
      </div>
    </div>
  </div>
);

const Step3Visual = () => (
  <div className="relative flex h-full w-full items-center justify-center bg-muted/20">
    <div
      className="absolute inset-0 opacity-[0.4]"
      style={{
        backgroundImage: "radial-gradient(#a1a1aa 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    />

    {/* Stacked Interactive Cards */}
    <div className="relative h-48 w-64 perspective-1000">
      {/* Back Card: Quiz */}
      <div className="absolute top-0 right-4 h-40 w-56 rotate-6 rounded-xl border border-border bg-card p-4 shadow-md transition-all duration-300 hover:rotate-12 hover:translate-x-4 hover:shadow-xl">
        <div className="flex items-center gap-2 mb-3 text-muted-foreground">
          <CheckCircle2 size={14} />
          <span className="text-[10px] uppercase tracking-wider font-semibold">
            Quiz Mode
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded border border-border bg-muted/20 p-2">
            <div className="h-3 w-3 rounded-full border border-muted-foreground" />
            <div className="h-1.5 w-24 rounded-full bg-muted-foreground/30" />
          </div>
          <div className="flex items-center gap-2 rounded border border-green-500/20 bg-green-500/5 p-2">
            <div className="flex h-3 w-3 items-center justify-center rounded-full bg-green-500 text-[8px] text-white">
              ✓
            </div>
            <div className="h-1.5 w-16 rounded-full bg-green-500/30" />
          </div>
        </div>
      </div>

      {/* Middle Card: Mindmap */}
      <div className="absolute top-2 left-4 h-40 w-56 -rotate-3 rounded-xl border border-border bg-card p-4 shadow-md transition-all duration-300 hover:-rotate-6 hover:-translate-x-4 hover:shadow-xl">
        <div className="flex items-center gap-2 mb-3 text-muted-foreground">
          <BrainCircuit size={14} />
          <span className="text-[10px] uppercase tracking-wider font-semibold">
            Mind Map
          </span>
        </div>
        <div className="relative flex h-20 items-center justify-center">
          <div className="absolute h-8 w-8 rounded-full border-2 border-primary/20 bg-primary/5" />
          <div className="absolute top-2 right-4 h-2 w-2 rounded-full bg-primary/40" />
          <div className="absolute bottom-2 left-4 h-2 w-2 rounded-full bg-primary/40" />
          {/* Connecting lines SVG */}
          <svg
            className="absolute inset-0 h-full w-full text-primary/20"
            style={{ pointerEvents: "none" }}
          >
            <line
              x1="50%"
              y1="50%"
              x2="80%"
              y2="20%"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <line
              x1="50%"
              y1="50%"
              x2="20%"
              y2="80%"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      </div>

      {/* Front Card: Flashcard */}
      <div className="absolute top-4 left-0 right-0 mx-auto h-40 w-56 rounded-xl border border-border bg-card p-0 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border p-3">
            <div className="flex items-center gap-2">
              <BookOpen size={14} className="text-primary" />
              <span className="text-xs font-semibold">Flashcard</span>
            </div>
            <span className="text-[10px] text-muted-foreground">1/12</span>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
            <p className="text-sm font-medium leading-snug">
              What is the primary function of Mitochondria?
            </p>
          </div>
          <div className="border-t border-border bg-muted/20 p-2 text-center">
            <p className="text-[10px] font-medium text-muted-foreground">
              Click to flip
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Step4Visual = () => (
  <div className="relative flex h-full w-full items-center justify-center bg-muted/20 p-6">
    <div
      className="absolute inset-0 opacity-[0.4]"
      style={{
        backgroundImage: "radial-gradient(#a1a1aa 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    />

    {/* Chat Interface Mockup */}
    <div className="relative z-10 w-64 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-border bg-background p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary">
            <BrainCircuit size={14} />
          </div>
          <span className="text-xs font-semibold">AI Tutor</span>
        </div>
        <MoreHorizontal size={14} className="text-muted-foreground" />
      </div>

      {/* Chat Body */}
      <div className="flex flex-col gap-3 bg-muted/10 p-4">
        {/* User Bubble */}
        <div className="self-end rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-primary-foreground">
          <p className="text-[10px] leading-relaxed">
            Explain this concept like I'm 5.
          </p>
        </div>

        {/* AI Bubble */}
        <div className="flex gap-2">
          <div className="mt-1 h-5 w-5 shrink-0 rounded-full bg-primary/10" />
          <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-3 py-2 shadow-sm">
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              Imagine the cell is like a big city...
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Input Area */}
      <div className="flex items-center gap-2 border-t border-border bg-background p-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-muted/30 text-muted-foreground">
          <TrendingUp size={12} />
        </div>
        <div className="h-6 flex-1 rounded-md bg-muted/30 px-2 text-[10px] leading-6 text-muted-foreground">
          Ask a follow up...
        </div>
      </div>
    </div>
  </div>
);

const steps = [
  {
    step: "01",
    title: "Add your content",
    description:
      "Upload a PDF, paste a YouTube link, or type. Drop in a lecture, article, or your own draft. Your starting point is ready in seconds. We support 50+ languages.",
    visual: Step1Visual,
  },
  {
    step: "02",
    title: "AI generates your note",
    description:
      "Our AI extracts key points, structure, and summaries. One click and you get a clear note—without the manual work. Edit and refine the output to fit your style.",
    visual: Step2Visual,
  },
  {
    step: "03",
    title: "Turn it into study material",
    description:
      "Generate flashcards, quizzes, mindmaps, and podcasts from the same note. One source, many ways to study. Pick what works for you—spaced repetition or visual maps.",
    visual: Step3Visual,
  },
  {
    step: "04",
    title: "Study, chat, and track",
    description:
      "Review your flashcards, take quizzes, and chat with your note to ask follow-up questions. Your progress is saved so you can pick up exactly where you left off.",
    visual: Step4Visual,
  },
];

export const featureStepCards = steps.map(({ step, title, description }) => {
  const first = description.split(/[.!]/)[0]?.trim() ?? "";
  return {
    step,
    title,
    shortDescription: first ? (first.endsWith(".") ? first : first + ".") : "",
  };
});

export function Features() {
  return (
    <section
      id="features"
      className="border-b border-border bg-background py-16 md:py-32"
    >
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl">
            How it works
          </h2>
          <p className="mt-2.5 font-medium text-muted-foreground">
            Create and use notes in four simple steps
          </p>
        </div>

        <div className="space-y-20 md:space-y-32">
          {steps.map(({ step, title, description, visual: Visual }, index) => (
            <div
              key={step}
              className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-20"
            >
              <div className={index % 2 === 1 ? "md:order-2" : ""}>
                <div className="flex items-center gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/5 text-sm font-bold text-primary shadow-sm">
                    {step}
                  </span>
                </div>

                <h3 className="mt-6 text-2xl font-bold tracking-tight text-foreground md:text-4xl">
                  {title}
                </h3>
                <p className="mt-4 text-base font-medium leading-relaxed text-muted-foreground md:text-lg">
                  {description}
                </p>
              </div>

              <div className={index % 2 === 1 ? "md:order-1" : ""}>
                {/* Visual Container */}
                <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-background md:aspect-4/3">
                  <Visual />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
