import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to Flinote to access your AI-powered notes, flashcards, and quizzes.",
  robots: { index: false, follow: true },
};

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
