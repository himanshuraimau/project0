"use client";

import { useTheme } from "next-themes";
import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { CTA } from "@/components/landing/cta"
import { Footer } from "@/components/landing/footer"

export default function Home() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const bgColor = isDark ? '#000000' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#000000';
  const selectionBg = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';
  
  return (
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: bgColor, 
        color: textColor,
      }}
    >
      <style jsx>{`
        ::selection {
          background: ${selectionBg};
          color: ${textColor};
        }
      `}</style>
      <main className="relative z-10 flex flex-col ">
        <Hero />
        <Features />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}