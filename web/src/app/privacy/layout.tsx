import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Flinote – how we collect, use, and protect your data.",
  openGraph: {
    title: "Privacy Policy | Flinote",
    description: "Privacy policy for Flinote – how we collect, use, and protect your data.",
    url: "/privacy",
  },
  robots: { index: true, follow: true },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
