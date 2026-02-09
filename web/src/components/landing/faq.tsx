"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Plus, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const faqs = [
  {
    id: "get-started",
    question: "How do I get started?",
    answer:
      "Sign up for free, then create a note or upload a PDF, audio, or video. Flinote will generate summaries, flashcards, quizzes, and mindmaps. You can also paste a YouTube link to turn lectures into study material in seconds.",
  },
  {
    id: "file-formats",
    question: "What file formats are supported?",
    answer:
      "We support PDF, TXT, and DOCX for documents, and MP3, WAV, M4A, and FLAC for audio. You can also paste URLs (e.g. YouTube) or type notes directly. Our AI works with any of these to create study tools.",
  },
  {
    id: "cancel",
    question: "Can I cancel anytime?",
    answer:
      "Yes. You can cancel your subscription anytime from your account settings. Your subscription stays active until the end of the current billing period, and you won't be charged again.",
  },
  {
    id: "refund",
    question: "What's your refund policy?",
    answer:
      "We offer a 30-day money-back guarantee for new subscriptions. If you're not satisfied within the first 30 days, contact us and we'll process a full refund.",
  },
  {
    id: "languages",
    question: "Do you support my language?",
    answer:
      "We support 50+ languages for transcription and note generation, including English, Spanish, French, German, Italian, Portuguese, Hindi, and many more. Notes and study tools can be created in your preferred language.",
  },
  {
    id: "organize",
    question: "How can I organize my notes?",
    answer:
      "Use folders to group notes by subject or course. Search across all your notes to find content quickly. Our AI also helps surface relevant notes when you're studying.",
  },
];

export function FAQ() {
  return (
    <section className="border-b border-border bg-background py-16 md:py-28">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="mb-12 flex flex-col items-center text-center">
          <Link
            href="/dashboard/support"
            className="mb-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Need help?
          </Link>
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl">
            Frequently asked questions
          </h2>
        </div>

        <AccordionPrimitive.Root
          type="single"
          collapsible
          className="flex flex-col gap-3"
        >
          {faqs.map(({ id, question, answer }) => (
            <AccordionPrimitive.Item
              key={id}
              value={id}
              className={cn(
                "rounded-xl transition-colors data-[state=open]:bg-muted/50"
              )}
            >
              <AccordionPrimitive.Header>
                <AccordionPrimitive.Trigger className="group cursor-pointer flex w-full items-start gap-4 rounded-xl px-4 py-4 text-left transition-colors hover:data-[state=closed]:bg-muted/30 data-[state=open]:bg-muted/50 data-[state=open]:pb-2">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors group-data-[state=open]:border-primary/30 group-data-[state=open]:bg-primary/10 group-data-[state=open]:text-primary">
                    <Plus className="h-3.5 w-3.5 transition-all group-data-[state=open]:hidden" />
                    <X className="hidden h-3.5 w-3.5 group-data-[state=open]:block" />
                  </span>
                  <span className="flex-1 font-medium text-[18px] text-foreground group-data-[state=open]:font-bold">
                    {question}
                  </span>
                </AccordionPrimitive.Trigger>
              </AccordionPrimitive.Header>
              <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <p className="px-4 pb-4 pl-14 leading-relaxed text-muted-foreground md:pl-[4.5rem]">
                  {answer}
                </p>
              </AccordionPrimitive.Content>
            </AccordionPrimitive.Item>
          ))}
        </AccordionPrimitive.Root>
      </div>
    </section>
  );
}
