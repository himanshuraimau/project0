"use client";

import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mic, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";

export function CTA() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const colors = {
    sectionBg: isDark ? "#000000" : "#ffffff",
    sectionBorder: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
    glow: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)",
    textPrimary: isDark ? "#ffffff" : "#000000",
    textMuted: isDark ? "#a3a3a3" : "#737373",
    textHighlight: isDark ? "#737373" : "#a3a3a3",
    badgeBg: isDark ? "rgba(23,23,23,0.75)" : "rgba(244,244,245,0.9)",
    badgeBorder: isDark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.12)",
    badgeText: isDark ? "#e5e5e5" : "#3f3f46",
    buttonPrimary: isDark ? "#ffffff" : "#000000",
    buttonPrimaryText: isDark ? "#000000" : "#ffffff",
    buttonPrimaryHover: isDark ? "#e5e5e5" : "#171717",
    buttonSecondary: "transparent",
    buttonSecondaryText: isDark ? "#ffffff" : "#000000",
    buttonSecondaryBorder: isDark ? "rgba(255,255,255,0.24)" : "rgba(0,0,0,0.16)",
    buttonSecondaryHoverBg: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
    statBorder: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
    logoColor: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
    logoHover: isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.85)",
  } as const;

  const primaryButtonBase: CSSProperties = {
    backgroundColor: colors.buttonPrimary,
    color: colors.buttonPrimaryText,
    border: "none",
    transition: "background-color 0.3s ease, transform 0.3s ease",
    boxShadow: isDark ? "0 0 40px -10px rgba(255,255,255,0.35)" : "0 0 40px -10px rgba(0,0,0,0.25)",
  };

  const secondaryButtonBase: CSSProperties = {
    backgroundColor: colors.buttonSecondary,
    color: colors.buttonSecondaryText,
    borderColor: colors.buttonSecondaryBorder,
    transition: "background-color 0.3s ease, color 0.3s ease",
  };

  const handlePrimaryEnter = (event: ReactMouseEvent<HTMLButtonElement>) => {
    const element = event.currentTarget;
    element.style.backgroundColor = colors.buttonPrimaryHover;
    element.style.transform = "scale(1.03)";
  };

  const handlePrimaryLeave = (event: ReactMouseEvent<HTMLButtonElement>) => {
    const element = event.currentTarget;
    element.style.backgroundColor = colors.buttonPrimary;
    element.style.transform = "scale(1)";
  };

  const handleSecondaryEnter = (event: ReactMouseEvent<HTMLButtonElement>) => {
    const element = event.currentTarget;
    element.style.backgroundColor = colors.buttonSecondaryHoverBg;
  };

  const handleSecondaryLeave = (event: ReactMouseEvent<HTMLButtonElement>) => {
    const element = event.currentTarget;
    element.style.backgroundColor = colors.buttonSecondary;
  };

  const handleLogoEnter = (event: ReactMouseEvent<HTMLSpanElement>) => {
    event.currentTarget.style.color = colors.logoHover;
    event.currentTarget.style.opacity = "1";
    event.currentTarget.style.filter = "grayscale(0)";
  };

  const handleLogoLeave = (event: ReactMouseEvent<HTMLSpanElement>) => {
    event.currentTarget.style.color = colors.logoColor;
    event.currentTarget.style.opacity = "0.6";
    event.currentTarget.style.filter = "grayscale(100%)";
  };

  return (
    <section
      className="py-32 relative overflow-hidden border-t"
      style={{ backgroundColor: colors.sectionBg, borderColor: colors.sectionBorder }}
    >
      {/* Background Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[120px] rounded-full pointer-events-none"
        style={{ backgroundColor: colors.glow }}
      />

      <div className="container relative z-10 mx-auto px-6 text-center">
        {/* Badge */}
        <div className="mb-8 flex justify-center">
          <div
            className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium gap-2"
            style={{
              borderColor: colors.badgeBorder,
              backgroundColor: colors.badgeBg,
              color: colors.badgeText,
            }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: colors.buttonPrimaryText }} />
            <span>Start Your Learning Revolution</span>
          </div>
        </div>

        {/* Heading */}
        <h2
          className="text-4xl lg:text-6xl font-bold leading-tight mb-8 max-w-4xl mx-auto"
          style={{ color: colors.textPrimary }}
        >
          Ready to Transform <br />
          <span style={{ color: colors.textHighlight }}>Your Study Experience?</span>
        </h2>

        {/* Description */}
        <p
          className="text-xl leading-relaxed mb-12 max-w-2xl mx-auto"
          style={{ color: colors.textMuted }}
        >
          Join thousands of students who have revolutionized their learning with Flinote. Start creating, sharing, and mastering your notes today.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
          <Link href="/sign-up">
            <Button
              size="lg"
              className="rounded-full px-10 h-14 text-lg font-semibold"
              style={{ ...primaryButtonBase }}
              onMouseEnter={handlePrimaryEnter}
              onMouseLeave={handlePrimaryLeave}
            >
              <Mic className="w-5 h-5 mr-3" />
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-3" />
            </Button>
          </Link>

          <Button
            variant="outline"
            size="lg"
            className="rounded-full px-10 h-14 text-lg font-medium"
            style={{ ...secondaryButtonBase }}
            onMouseEnter={handleSecondaryEnter}
            onMouseLeave={handleSecondaryLeave}
          >
            Learn More
          </Button>
        </div>

        {/* Stats Grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto pt-12 border-t"
          style={{ borderColor: colors.statBorder }}
        >
          {[{
            value: "10k+",
            label: "Active Students",
          }, {
            value: "100+",
            label: "Languages",
          }, {
            value: "25%",
            label: "Grade Improvement",
          }].map((stat) => (
            <div key={stat.label} className="text-center">
              <div
                className="text-4xl font-bold mb-2 transition-colors"
                style={{ color: colors.textPrimary }}
              >
                {stat.value}
              </div>
              <div
                className="text-sm font-medium uppercase tracking-wider"
                style={{ color: colors.textMuted }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Logos */}
        <div className="mt-16 pt-8 flex flex-wrap justify-center items-center gap-8 md:gap-16">
          {["MIT", "Stanford", "Harvard", "Oxford"].map((logo) => (
            <span
              key={logo}
              className="text-2xl font-bold transition-all duration-500"
              style={{ color: colors.logoColor, opacity: 0.6, filter: "grayscale(100%)" }}
              onMouseEnter={handleLogoEnter}
              onMouseLeave={handleLogoLeave}
            >
              {logo}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
