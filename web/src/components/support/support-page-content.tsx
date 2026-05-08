"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Mail01Icon,
  NoteEditIcon,
  CreditCardIcon,
  SentIcon,
} from "@hugeicons/core-free-icons";

const FAQ_SECTIONS = [
  {
    id: "recording-notes",
    title: "Recording & notes",
    icon: NoteEditIcon,
    items: [
      {
        value: "recording-quality",
        q: "How do I improve recording quality?",
        a: "For best results, use a quiet environment, speak clearly, and ensure your microphone is positioned 6–12 inches from your mouth. External microphones typically provide better quality than built-in laptop mics.",
      },
      {
        value: "file-formats",
        q: "What file formats are supported?",
        a: "We support most common audio formats including MP3, WAV, M4A, FLAC, and more. For documents, we support PDF, TXT, DOCX, and direct text input.",
      },
      {
        value: "note-organization",
        q: "How can I organize my notes?",
        a: "You can search through your notes to quickly find what you need. Use folders to group notes by topic or project, and filter by folder from the dashboard.",
      },
    ],
  },
  {
    id: "subscription",
    title: "Subscription & payments",
    icon: CreditCardIcon,
    items: [
      {
        value: "cancel-subscription",
        q: "How do I cancel my subscription?",
        a: "You can cancel your subscription anytime from your account settings. Your subscription will remain active until the end of your current billing period.",
      },
      {
        value: "payment-methods",
        q: "What payment methods do you accept?",
        a: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and Apple Pay for convenient and secure payments.",
      },
    ],
  },
] as const;

const SUPPORT_EMAIL = "support@flinote.ai";
const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
  "[Flinote Support] "
)}`;

export function SupportPageContent() {
  return (
    <>
      {/* Intro */}
      <header className="mb-10">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          Help centre
        </h1>
        <p className="text-muted-foreground mt-1.5 max-w-xl">
          Find answers to common questions and get the help you need.
        </p>
      </header>

      {/* FAQ Sections */}
      {FAQ_SECTIONS.map((section) => (
        <section
          key={section.id}
          className="rounded-2xl border border-border bg-card overflow-hidden"
        >
          <div className="flex items-center gap-3 px-6 py-5 border-b border-border/60 bg-muted/20">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HugeiconsIcon icon={section.icon} className="size-5" />
            </div>
            <h2 className="text-lg font-semibold text-foreground tracking-tight">
              {section.title}
            </h2>
          </div>
          <div className="px-2">
            <Accordion type="single" collapsible className="w-full">
              {section.items.map((item) => (
                <AccordionItem
                  key={item.value}
                  value={item.value}
                  className="border-border/60 px-4 last:border-b-0"
                >
                  <AccordionTrigger className="text-left py-4 font-medium text-foreground hover:no-underline hover:text-primary data-[state=open]:text-primary">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-4 pt-0">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      ))}

      {/* Contact support */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground tracking-tight mb-1">
          Contact support
        </h2>
        <p className="text-sm text-muted-foreground mb-5">
          Email us directly and we&apos;ll follow up as soon as possible.
        </p>

        <div className="flex flex-col gap-4 p-5 rounded-xl bg-muted/30 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <HugeiconsIcon icon={Mail01Icon} className="size-5" />
            </div>
            <div>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-medium text-foreground hover:text-primary"
              >
                {SUPPORT_EMAIL}
              </a>
              <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                Our support team typically responds within 24 hours on business
                days. For urgent issues, include &quot;URGENT&quot; in your
                subject line.
              </p>
            </div>
          </div>

          <Button asChild className="sm:shrink-0">
            <a href={SUPPORT_MAILTO}>
              <HugeiconsIcon icon={SentIcon} className="size-4" />
              Send email
            </a>
          </Button>
        </div>
      </section>
    </>
  );
}
