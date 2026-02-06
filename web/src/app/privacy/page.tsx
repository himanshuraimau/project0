"use client";

import { Navbar } from "@/components/shared/navbar";
import { MDXRenderer } from "@/components/mdx-renderer";
import { Plus_Jakarta_Sans } from "next/font/google";
import { PRIVACY_CONTENT } from "@/lib/legal-content";

const jakarta = Plus_Jakarta_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin-ext", "vietnamese"],
});

export default function PrivacyPage() {
  return (
    <div className={`min-h-screen bg-background ${jakarta.className}`}>
      <Navbar title="Privacy Policy" showBackToDashboard={true} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <MDXRenderer content={PRIVACY_CONTENT} className="legal-content" />
        </div>
      </div>
    </div>
  );
}
