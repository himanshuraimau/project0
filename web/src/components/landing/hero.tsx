"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  Play,
  FileText,
  Headphones,
  Zap,
  Users,
  LayoutDashboard,
  Share2,
  Brain,
  Sparkles,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { useTheme } from "next-themes";
import Link from "next/link";

export function Hero() {
  const { data: session } = useSession();
  const { theme } = useTheme();

  const isDark = theme === "dark";
  const colors = {
    bg: isDark ? "#000000" : "#ffffff",
    text: isDark ? "#ffffff" : "#000000",
    textGradientFrom: isDark ? "#ffffff" : "#000000",
    textGradientVia: isDark ? "#ffffff" : "#000000",
    textGradientTo: isDark ? "#737373" : "#a3a3a3",
    textMuted: isDark ? "#a3a3a3" : "#737373",
    textSubtle: isDark ? "#737373" : "#a3a3a3",
    badgeBg: isDark ? "rgba(23, 23, 23, 0.5)" : "rgba(244, 244, 245, 0.5)",
    badgeBorder: isDark ? "#262626" : "#e5e5e5",
    badgeRing: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
    badgeRingHover: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)",
    grid: isDark ? "#262626" : "#e5e5e5",
    spotlight: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
    buttonPrimary: isDark ? "#ffffff" : "#000000",
    buttonPrimaryText: isDark ? "#000000" : "#ffffff",
    buttonPrimaryHover: isDark ? "#e5e5e5" : "#171717",
    cardBg: isDark ? "rgba(23, 23, 23, 0.3)" : "rgba(249, 250, 251, 0.5)",
    cardBorder: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
    cardBorderHover: isDark
      ? "rgba(255, 255, 255, 0.2)"
      : "rgba(0, 0, 0, 0.15)",
    cardBgHover: isDark ? "rgba(23, 23, 23, 0.6)" : "rgba(249, 250, 251, 0.8)",
    cardIconBg: isDark ? "#000000" : "#ffffff",
    cardIconBorder: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
    cardIconBorderHover: isDark
      ? "rgba(255, 255, 255, 0.3)"
      : "rgba(0, 0, 0, 0.2)",
    cardIcon: isDark ? "#a3a3a3" : "#737373",
    cardIconHover: isDark ? "#ffffff" : "#000000",
    cardTitle: isDark ? "#e5e5e5" : "#171717",
    cardTitleHover: isDark ? "#ffffff" : "#000000",
    avatarBg: isDark
      ? "linear-gradient(to bottom, #404040, #171717)"
      : "linear-gradient(to bottom, #d4d4d4, #f4f4f5)",
    avatarBorder: isDark ? "#000000" : "#ffffff",
    avatarCountBg: isDark ? "#262626" : "#e5e5e5",
    avatarCountHover: isDark ? "#404040" : "#d4d4d4",
  };

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
      style={{ backgroundColor: colors.bg }}
    >
      {/* 1. Technical Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, ${colors.grid} 1px, transparent 1px), linear-gradient(to bottom, ${colors.grid} 1px, transparent 1px)`,
          backgroundSize: "4rem 4rem",
          maskImage:
            "radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%)",
        }}
      />

      {/* 2. Top Spotlight Effect */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] blur-[100px] rounded-full pointer-events-none"
        style={{ backgroundColor: colors.spotlight }}
      />

      <div className="container relative z-10 mx-auto px-6 text-center">
        {/* Main Heading */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl pt-16  font-bold tracking-tight mb-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage: `linear-gradient(to bottom, ${colors.textGradientFrom}, ${colors.textGradientVia}, ${colors.textGradientTo})`,
            }}
          >
            Master Any Subject
          </span>
          <br />
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage: `linear-gradient(to bottom, ${colors.textMuted}, ${colors.textSubtle})`,
            }}
          >
            in Seconds.
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className="text-xl leading-relaxed mb-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300"
          style={{ color: colors.textMuted }}
        >
          The all-in-one AI study companion. Generate quizzes, flashcards, and
          mindmaps from your notes instantly. Learning hasn't looked this good.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400">
          {!session ? (
            <>
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="rounded-full px-8 h-14 text-lg font-semibold transition-all hover:scale-105 border-none"
                  style={{
                    backgroundColor: colors.buttonPrimary,
                    color: colors.buttonPrimaryText,
                    boxShadow: isDark
                      ? "0 0 40px -10px rgba(255,255,255,0.3)"
                      : "0 0 40px -10px rgba(0,0,0,0.2)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      colors.buttonPrimaryHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      colors.buttonPrimary;
                  }}
                >
                  <Zap
                    className="w-5 h-5 mr-2"
                    style={{ fill: colors.buttonPrimaryText }}
                  />
                  Start Learning
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="rounded-full px-8 h-14 text-lg font-semibold transition-all hover:scale-105"
                  style={{
                    backgroundColor: colors.buttonPrimary,
                    color: colors.buttonPrimaryText,
                  }}
                >
                  <LayoutDashboard className="w-5 h-5 mr-2" />
                  Go to Dashboard
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Feature Cards (Glass Look) */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-1000 delay-500">
          {[
            { icon: FileText, label: "Smart Notes", desc: "Auto-summaries" },
            {
              icon: GraduationCap,
              label: "AI Courses",
              desc: "Generated paths",
            },
            { icon: Brain, label: "Mindmaps", desc: "Visual learning" },
            { icon: Headphones, label: "Podcasts", desc: "Audio study" },
            { icon: Share2, label: "Collab", desc: "Study together" },
          ].map((item, i) => (
            <div
              key={i}
              className="group relative p-4 rounded-2xl border transition-all duration-300 text-left"
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.cardBorderHover;
                e.currentTarget.style.backgroundColor = colors.cardBgHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.cardBorder;
                e.currentTarget.style.backgroundColor = colors.cardBg;
              }}
            >
              <div
                className="mb-3 inline-flex p-3 rounded-xl border transition-colors"
                style={{
                  backgroundColor: colors.cardIconBg,
                  borderColor: colors.cardIconBorder,
                  color: colors.cardIcon,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = colors.cardIconHover;
                  e.currentTarget.style.borderColor =
                    colors.cardIconBorderHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = colors.cardIcon;
                  e.currentTarget.style.borderColor = colors.cardIconBorder;
                }}
              >
                <item.icon className="w-5 h-5" />
              </div>
              <h3
                className="text-sm font-semibold mb-1"
                style={{ color: colors.cardTitle }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = colors.cardTitleHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = colors.cardTitle;
                }}
              >
                {item.label}
              </h3>
              <p
                className="text-xs"
                style={{ color: colors.textSubtle }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = colors.textMuted;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = colors.textSubtle;
                }}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Social Proof / Bottom Text */}
        <div className="mt-16 pb-20 animate-in fade-in duration-1000 delay-700 flex flex-col items-center gap-4">
          <div className="flex -space-x-4 rtl:space-x-reverse">
            {/* Fake Avatars using colored divs */}
            {[1, 2, 3, 4].map((_, i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-full border-2"
                style={{
                  background: colors.avatarBg,
                  borderColor: colors.avatarBorder,
                }}
              />
            ))}
            <div
              className="flex items-center justify-center w-10 h-10 text-xs font-medium rounded-full border-2 transition-colors"
              style={{
                color: colors.text,
                backgroundColor: colors.avatarCountBg,
                borderColor: colors.avatarBorder,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.avatarCountHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.avatarCountBg;
              }}
            >
              +99
            </div>
          </div>
          <p className="text-sm" style={{ color: colors.textSubtle }}>
            Join{" "}
            <span className="font-medium" style={{ color: colors.text }}>
              10,000+ students
            </span>{" "}
            acing their exams.
          </p>
        </div>
      </div>
    </section>
  );
}
