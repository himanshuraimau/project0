"use client";

import { Check, X, Sparkles, ShieldCheck, Globe, Zap } from "lucide-react";

const rows = [
  {
    feature: "AI notes from PDF, Video & URL",
    us: true,
    others: "Manual only",
    icon: Zap,
  },
  {
    feature: "Flashcards & Quizzes",
    us: true,
    others: "Limited/Paid",
    icon: Check,
  },
  { feature: "Mind Maps & Podcasts", us: true, others: false, icon: Sparkles },
  { feature: "50+ Languages Support", us: true, others: "Few", icon: Globe },
  {
    feature: "Study in one central place",
    us: true,
    others: "Scattered tools",
    icon: ShieldCheck,
  },
];

export function AuthComparison() {
  return (
    <div className="flex flex-col w-full max-w-xl mx-auto">
      {/* Motivational Header */}
      <div className="mb-8 relative">
        <div className="flex items-center gap-2">
          <h3 className="text-2xl font-bold tracking-tight text-foreground">
            The Flinote Edge
          </h3>
        </div>
        <p className="mt-1.5 text-[14.5px] text-muted-foreground">
          Stop wasting hours on formatting. Let AI handle the heavy lifting
          while you focus on learning.
        </p>
      </div>

      {/* Comparison Container */}
      <div className="relative rounded-sm border border-neutral-100 dark:border-neutral-800/50 shadow-2xl overflow-hidden">
        {/* Header Row */}
        <div className="grid grid-cols-[1fr_80px_80px] items-center border-b border-neutral-100 dark:border-neutral-800/50 bg-muted/50 px-5 py-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Comparison
          </span>
          <div className="relative flex justify-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
              Flinote
            </span>
            {/* The "AI Highlight" Glow */}
            <div className="absolute -inset-x-2 -inset-y-4 z-[-1] bg-primary/5 blur-sm rounded-lg border-x border-primary/20" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">
            Others
          </span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border/50">
          {rows.map(({ feature, us, others, icon: Icon }, i) => (
            <div
              key={feature}
              className="grid grid-cols-[1fr_80px_80px] items-center px-5 py-4 transition-colors hover:bg-muted/20"
            >
              {/* Feature Name */}
              <div className="flex items-center gap-3">
                <Icon
                  className="h-4 w-4 text-muted-foreground/70"
                  strokeWidth={2}
                />
                <span className="text-sm font-medium text-foreground/90 leading-tight">
                  {feature}
                </span>
              </div>

              {/* Flinote Column (Highlighted) */}
              <div className="relative flex justify-center">
                {/* Vertical Highlight Beam */}
                <div className="absolute inset-y-[-16px] w-[70px] bg-primary/[0.03] border-x border-primary/10 z-0" />

                <div className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.3)] text-primary-foreground">
                  <Check className="h-4 w-4" strokeWidth={3} />
                </div>
              </div>

              {/* Others Column */}
              <div className="flex justify-center">
                {others === false ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-muted/50 text-muted-foreground/40">
                    <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </div>
                ) : (
                  <span className="text-[10px] font-semibold text-muted-foreground/60 text-center bg-muted/50 px-2 py-1 rounded-md border border-border/50">
                    {others}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between px-2">
        <div>
          <p className="text-xs font-bold text-foreground">Global Reach</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
            50+ Countries
          </p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="text-right">
          <p className="text-xs font-bold text-foreground">Support</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
            24/7 AI Assistance
          </p>
        </div>
      </div>
    </div>
  );
}
