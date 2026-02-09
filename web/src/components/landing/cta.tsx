"use client";

import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export function CTA() {
  return (
    <section className="relative overflow-hidden border-y border-border bg-(--brand-950) py-20 md:py-28">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--neutral-50) 1px, transparent 1px),
            linear-gradient(to bottom, var(--neutral-50) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />
      <div className="container relative z-10 mx-auto max-w-4xl px-4 text-center">
        <h2 className="text-3xl font-bold leading-tight text-(--neutral-50) md:text-4xl lg:text-5xl">
          Start your first free lesson and discover how
          <br className="hidden sm:block" />
          AI-powered notes can transform your study.
        </h2>
        <div className="mt-10 flex justify-center">
          <Link href="/sign-up">
            <Button
              size="lg"
              className="group h-14 gap-3 rounded-full bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-primary/25"
            >
              Start a free trial lesson
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/20 transition-colors group-hover:bg-primary-foreground/30">
                <ArrowUpRight className="h-4 w-4 text-primary-foreground" />
              </span>
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
