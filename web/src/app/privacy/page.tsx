"use client";

import { Navbar } from "@/components/shared/navbar";
import { MDXRenderer } from "@/components/mdx-renderer";
import { jakarta } from "@/lib/fonts";
import { PRIVACY_CONTENT } from "@/lib/legal-content";

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
