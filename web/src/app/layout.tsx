import type { Metadata } from "next";
import { DM_Sans, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";
import { Toaster } from "@/components/ui/sonner";

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

export const metadata: Metadata = {
  title: "Flinote - AI-Powered Study App",
  description:
    "Transform learning with AI-powered study tools. Convert lectures, videos, and PDFs into organized notes, flashcards, and quizzes.",
  keywords: ["AI study app", "note taking", "flashcards", "quiz generator", "learning tools", "study assistant"],
  authors: [{ name: "Flinote" }],
  creator: "Flinote",
  publisher: "Flinote",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://flinote.ai"),
  openGraph: {
    title: "Flinote - AI-Powered Study App",
    description: "Transform learning with AI-powered study tools. Convert lectures, videos, and PDFs into organized notes, flashcards, and quizzes.",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://flinote.ai",
    siteName: "Flinote",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Flinote Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flinote - AI-Powered Study App",
    description: "Transform learning with AI-powered study tools. Convert lectures, videos, and PDFs into organized notes, flashcards, and quizzes.",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${bricolage.variable} h-full min-h-screen font-sans antialiased bg-background text-foreground`}>
        <NextSSRPlugin
          routerConfig={extractRouterConfig(ourFileRouter)}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
