"use client";

import React, { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Mail01Icon,
  NoteEditIcon,
  CreditCardIcon,
  SentIcon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";

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

const SUBJECT_MIN_LENGTH = 3;
const SUBJECT_MAX_LENGTH = 120;
const MESSAGE_MIN_LENGTH = 10;
const MESSAGE_MAX_LENGTH = 2000;

interface ContactSupportResponse {
  success?: boolean;
  message?: string;
}

export function SupportPageContent() {
  const { data: session } = useSession();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedSubjectLength = subject.trim().length;
  const trimmedMessageLength = message.trim().length;

  const canSubmit =
    trimmedSubjectLength >= SUBJECT_MIN_LENGTH &&
    trimmedSubjectLength <= SUBJECT_MAX_LENGTH &&
    trimmedMessageLength >= MESSAGE_MIN_LENGTH &&
    trimmedMessageLength <= MESSAGE_MAX_LENGTH &&
    !!session?.user?.email &&
    !isSubmitting;

  const getValidationError = (): string | null => {
    if (!session?.user?.email) {
      return "Your account email is missing. Please sign in again.";
    }
    if (trimmedSubjectLength < SUBJECT_MIN_LENGTH) {
      return `Subject must be at least ${SUBJECT_MIN_LENGTH} characters.`;
    }
    if (trimmedSubjectLength > SUBJECT_MAX_LENGTH) {
      return `Subject must be less than ${SUBJECT_MAX_LENGTH + 1} characters.`;
    }
    if (trimmedMessageLength < MESSAGE_MIN_LENGTH) {
      return `Message must be at least ${MESSAGE_MIN_LENGTH} characters.`;
    }
    if (trimmedMessageLength > MESSAGE_MAX_LENGTH) {
      return `Message must be less than ${MESSAGE_MAX_LENGTH + 1} characters.`;
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;

    const validationError = getValidationError();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSubmitting(true);
    setResult("Sending....");
    try {
      const accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;
      if (!accessKey) {
        throw new Error(
          "Support form is not configured. Add NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY."
        );
      }

      const user = session?.user;
      if (!user?.email) {
        throw new Error("Your account email is missing. Please sign in again.");
      }

      const userName = user.name?.trim() || "Flinote user";
      const userEmail = user.email.trim();

      const formData = new FormData(formElement);
      formData.set("access_key", accessKey);
      formData.set("name", userName);
      formData.set("email", userEmail);
      formData.set("replyto", userEmail);
      formData.set("subject", `[Flinote Support] ${subject.trim()}`);
      formData.set("source", "Web settings contact support form");
      formData.set("user_id", user.id);
      formData.set("botcheck", "");

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json().catch(() => null)) as
        | ContactSupportResponse
        | null;

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message || "We could not send your message. Please try again."
        );
      }

      setResult("Form Submitted Successfully");
      toast.success("Message sent. Our support team will reach out soon.");
      formElement.reset();
      setSubject("");
      setMessage("");
    } catch (error) {
      setResult("Error");
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to send message right now."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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

      {/* Support email */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground tracking-tight mb-4">
          Support email
        </h2>
        <div className="flex items-start gap-4 p-5 rounded-xl bg-muted/30">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <HugeiconsIcon icon={Mail01Icon} className="size-5" />
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">support@flinote.ai</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Our support team typically responds within 24 hours on business
              days. For urgent issues, include &quot;URGENT&quot; in your
              subject line.
            </p>
          </div>
        </div>
      </section>

      {/* Contact form */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground tracking-tight mb-1">
          Contact us
        </h2>
        <p className="text-sm text-muted-foreground mb-5">
          Share your issue or question and we will follow up on email.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="support-subject"
              className="text-sm font-medium text-foreground"
            >
              Subject
            </label>
            <Input
              id="support-subject"
              name="subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Write a short subject"
              maxLength={SUBJECT_MAX_LENGTH}
              required
            />
            <p className="text-xs text-muted-foreground text-right">
              {trimmedSubjectLength}/{SUBJECT_MAX_LENGTH}
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="support-message"
              className="text-sm font-medium text-foreground"
            >
              Message
            </label>
            <Textarea
              id="support-message"
              name="message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Tell us what happened and what you need help with."
              rows={6}
              maxLength={MESSAGE_MAX_LENGTH}
              required
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Minimum {MESSAGE_MIN_LENGTH} characters.
              </p>
              <p className="text-xs text-muted-foreground">
                {trimmedMessageLength}/{MESSAGE_MAX_LENGTH}
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={!canSubmit} className="min-w-32">
              {isSubmitting ? (
                "Sending..."
              ) : (
                <>
                  <HugeiconsIcon icon={SentIcon} className="size-4" />
                  Send message
                </>
              )}
            </Button>
          </div>
          {!!result && (
            <span className="block text-right text-sm text-muted-foreground">
              {result}
            </span>
          )}
        </form>
      </section>
    </>
  );
}
