import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Flinote pricing plans. Start free with AI notes, flashcards, and quizzes. Upgrade for more credits and premium features.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pricing | Flinote",
    description:
      "Flinote pricing plans. Start free with AI notes, flashcards, and quizzes. Upgrade for more credits and premium features.",
    url: "/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
