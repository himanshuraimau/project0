"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Plus, Minus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const faqs = [
  {
    id: "upload",
    question: "What can I upload to Flinote?",
    answer:
      "PDFs, lecture slides, docs, links, and audio/recordings (where supported). Flinote turns them into structured notes, summaries, and study-ready formats.",
  },
  {
    id: "accuracy",
    question: "How accurate are the notes?",
    answer:
      "Flinote is fast, but not perfect. It highlights key points and organizes content, and you can quickly edit, regenerate sections, or ask it to explain anything that looks off.",
  },
  {
    id: "messy-audio",
    question: "Does Flinote work with messy lectures and real-world audio?",
    answer:
      "Yes—noise and accents happen. For best results, use clear audio and keep the phone close to the speaker. You'll get better transcripts and cleaner notes.",
  },
  {
    id: "flashcards-quizzes",
    question: "Can I create flashcards and quizzes automatically?",
    answer:
      "Yes. Flinote can generate flashcards + quizzes from your content—great for spaced repetition and quick revision before tests.",
  },
  {
    id: "privacy",
    question: "How does Flinote handle privacy and security?",
    answer:
      "Flinote is built for students and learners, so privacy is treated as a core feature, not an afterthought.",
  },
  {
    id: "replace-learning",
    question: "Will Flinote replace my learning?",
    answer:
      "No. It reduces busywork. You still learn by reviewing, quizzing, and understanding. Flinote helps you spend time on studying, not formatting notes.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className=" py-16 md:py-20">
      <div className="mx-auto max-w-2xl px-4">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Questions
        </h2>

        <AccordionPrimitive.Root
          type="single"
          collapsible
          defaultValue="upload"
          className="mt-12"
        >
          {faqs.map(({ id, question, answer }, index) => (
            <AccordionPrimitive.Item
              key={id}
              value={id}
              className={cn(
                "border-b border-border last:border-b-0",
                index === 0 && "border-t border-border"
              )}
            >
              <AccordionPrimitive.Header>
                <AccordionPrimitive.Trigger className="group flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-left transition-colors hover:opacity-90">
                  <span className="font-medium text-foreground group-data-[state=open]:font-semibold">
                    {question}
                  </span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted/40 text-muted-foreground transition-colors group-data-[state=open]:border-primary/20 group-data-[state=open]:bg-primary/10 group-data-[state=open]:text-primary">
                    <Plus className="h-4 w-4 group-data-[state=open]:hidden" />
                    <Minus className="hidden h-4 w-4 group-data-[state=open]:block" />
                  </span>
                </AccordionPrimitive.Trigger>
              </AccordionPrimitive.Header>
              <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <p className="pb-5 pr-12 text-[15px] leading-relaxed text-muted-foreground">
                  {answer}
                </p>
              </AccordionPrimitive.Content>
            </AccordionPrimitive.Item>
          ))}
        </AccordionPrimitive.Root>

        <p className="mt-10 text-center">
          <Link
            href="/dashboard/support"
            className="text-sm font-medium text-primary hover:underline"
          >
            Need help?
          </Link>
        </p>
      </div>
    </section>
  );
}
