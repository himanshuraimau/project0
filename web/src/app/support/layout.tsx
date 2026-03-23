import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Get help with Flinote. Contact our support team, request account deletion, or send us a message.",
  alternates: {
    canonical: "/support",
  },
  openGraph: {
    title: "Support | Flinote",
    description:
      "Get help with Flinote. Contact our support team, request account deletion, or send us a message.",
    url: "/support",
  },
};

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
