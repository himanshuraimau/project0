"use client";

import React, { useState } from "react";
import Link from "next/link";
import { jakarta } from "@/lib/fonts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Mail, Send, Trash2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

const SUBJECT_MIN_LENGTH = 3;
const SUBJECT_MAX_LENGTH = 120;
const MESSAGE_MIN_LENGTH = 10;
const MESSAGE_MAX_LENGTH = 2000;

interface ContactFormResponse {
  success?: boolean;
  message?: string;
}

export default function SupportPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedSubjectLength = subject.trim().length;
  const trimmedMessageLength = message.trim().length;

  const canSubmit =
    name.trim().length >= 2 &&
    email.trim().length >= 5 &&
    trimmedSubjectLength >= SUBJECT_MIN_LENGTH &&
    trimmedSubjectLength <= SUBJECT_MAX_LENGTH &&
    trimmedMessageLength >= MESSAGE_MIN_LENGTH &&
    trimmedMessageLength <= MESSAGE_MAX_LENGTH &&
    !isSubmitting;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;

    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;
      if (!accessKey) {
        throw new Error(
          "Support form is not configured. Please email us directly at customer@flinote.ai"
        );
      }

      const formData = new FormData(formElement);
      formData.set("access_key", accessKey);
      formData.set("name", name.trim());
      formData.set("email", email.trim());
      formData.set("replyto", email.trim());
      formData.set("subject", `[Flinote Support] ${subject.trim()}`);
      formData.set("source", "Public support page");
      formData.set("botcheck", "");

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json().catch(() => null)) as
        | ContactFormResponse
        | null;

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message || "We could not send your message. Please try again."
        );
      }

      toast.success("Message sent! Our support team will get back to you soon.");
      formElement.reset();
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to send message right now. Please email us at customer@flinote.ai"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen bg-background ${jakarta.className}`}>
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Flinote
          </Link>
          <Link
            href="/"
            className="text-lg font-semibold text-foreground tracking-tight"
          >
            Flinote
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Page header */}
        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Support
          </h1>
          <p className="text-muted-foreground mt-3 text-lg max-w-2xl">
            Need help? Send us a message and our team will get back to you
            within 24 hours on business days.
          </p>
        </div>

        <div className="space-y-8">
          {/* Support email card */}
          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Mail className="size-5" />
              </div>
              <h2 className="text-lg font-semibold text-foreground tracking-tight">
                Email us directly
              </h2>
            </div>
            <div className="p-5 rounded-xl bg-muted/30">
              <a
                href="mailto:customer@flinote.ai"
                className="font-medium text-primary hover:underline"
              >
                customer@flinote.ai
              </a>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                Send us an email anytime. For urgent issues, include
                &quot;URGENT&quot; in your subject line.
              </p>
            </div>
          </section>

          {/* Account deletion card */}
          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <Trash2 className="size-5" />
              </div>
              <h2 className="text-lg font-semibold text-foreground tracking-tight">
                Delete your account
              </h2>
            </div>
            <div className="p-5 rounded-xl bg-muted/30 space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                If you want to delete your account and all associated data,
                please email us at{" "}
                <a
                  href="mailto:customer@flinote.ai?subject=Account%20Deletion%20Request"
                  className="font-medium text-primary hover:underline"
                >
                  customer@flinote.ai
                </a>{" "}
                with the subject line <strong>&quot;Account Deletion Request&quot;</strong>.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Include the email address associated with your account. We will
                process your request within 7 business days and confirm once
                your account and data have been permanently deleted.
              </p>
              <p className="text-xs text-muted-foreground/70">
                Alternatively, you can use the contact form below with the
                subject &quot;Account Deletion Request&quot;.
              </p>
            </div>
          </section>

          {/* Contact form */}
          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MessageCircle className="size-5" />
              </div>
              <h2 className="text-lg font-semibold text-foreground tracking-tight">
                Send us a message
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6 ml-[52px]">
              Fill out the form and we&apos;ll follow up on your email.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="support-name"
                    className="text-sm font-medium text-foreground"
                  >
                    Name
                  </label>
                  <Input
                    id="support-name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="support-email"
                    className="text-sm font-medium text-foreground"
                  >
                    Email
                  </label>
                  <Input
                    id="support-email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

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
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What do you need help with?"
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
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what happened and what you need help with..."
                  rows={6}
                  maxLength={MESSAGE_MAX_LENGTH}
                  required
                />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Minimum {MESSAGE_MIN_LENGTH} characters
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
                      <Send className="size-4" />
                      Send message
                    </>
                  )}
                </Button>
              </div>
            </form>
          </section>
        </div>

        {/* Footer links */}
        <div className="mt-16 pt-8 border-t border-border text-center">
          <nav className="flex items-center justify-center gap-6 text-sm">
            <Link
              href="/terms"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
          </nav>
          <p className="mt-4 text-xs text-muted-foreground">
            &copy;{new Date().getFullYear()} Flinote
          </p>
        </div>
      </main>
    </div>
  );
}
