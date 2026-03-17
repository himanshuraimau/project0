import type { Metadata, Viewport } from "next";
import { DM_Sans, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { UpgradeModalProvider } from "@/contexts/upgrade-modal-context";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://flinote.ai";

export const metadata: Metadata = {
  title: {
    default: "Flinote",
    template: "%s | Flinote",
  },
  description:
    "Transform learning with AI-powered study tools. Convert lectures, videos, and PDFs into organized notes, flashcards, and quizzes.",
  keywords: [
    "AI study app",
    "note taking",
    "flashcards",
    "quiz generator",
    "learning tools",
    "study assistant",
    "lecture notes",
    "video to notes",
    "PDF summarizer",
  ],
  authors: [{ name: "Flinote", url: appUrl }],
  creator: "Flinote",
  publisher: "Flinote",
  metadataBase: new URL(appUrl),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: "Flinote – AI-Powered Study Tools",
    description:
      "Transform learning with AI-powered study tools. Convert lectures, videos, and PDFs into organized notes, flashcards, and quizzes.",
    url: appUrl,
    siteName: "Flinote",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Flinote – AI-Powered Study Tools for Students",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flinote – AI-Powered Study Tools",
    description:
      "Transform learning with AI-powered study tools. Convert lectures, videos, and PDFs into organized notes, flashcards, and quizzes.",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  manifest: "/manifest.json",
  category: "education",
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Flinote",
    description:
      "Transform learning with AI-powered study tools. Convert lectures, videos, and PDFs into organized notes, flashcards, and quizzes.",
    url: appUrl,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "AI-generated notes from lectures and videos",
      "Flashcards and quiz generation",
      "PDF to notes conversion",
      "Mind maps and podcasts from study material",
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${bricolage.variable} h-full min-h-screen font-sans antialiased bg-background text-foreground`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <UpgradeModalProvider>
            {children}
            <Toaster />
            <Analytics />
          </UpgradeModalProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
