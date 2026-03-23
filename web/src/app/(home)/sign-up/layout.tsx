import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your free Flinote account. Start converting lectures and PDFs into notes, flashcards, and quizzes.",
  alternates: {
    canonical: "/sign-up",
  },
  robots: { index: true, follow: true },
};

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
