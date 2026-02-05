"use client";

import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import { useTheme } from "next-themes";
import {
  FileText,
  Zap,
  Headphones,
  Languages,
  Smartphone,
  Clock,
  TrendingUp,
  Shield,
  Sparkles,
  Share2,
  Brain,
  Folder,
  // GraduationCap,
} from "lucide-react";

export function Features() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const colors = {
    sectionBg: isDark ? "#000000" : "#ffffff",
    textPrimary: isDark ? "#ffffff" : "#000000",
    textSecondary: isDark ? "#d4d4d4" : "#1f2937",
    textMuted: isDark ? "#a3a3a3" : "#737373",
    textHighlight: isDark ? "#737373" : "#a3a3a3",
    accent: isDark ? "#ffffff" : "#000000",
    badgeBg: isDark ? "rgba(23,23,23,0.75)" : "rgba(244,244,245,0.85)",
    badgeBorder: isDark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.08)",
    badgeText: isDark ? "#e5e5e5" : "#3f3f46",
    cardBg: isDark ? "rgba(23,23,23,0.85)" : "rgba(248,248,248,0.95)",
    cardBgHover: isDark ? "rgba(38,38,38,0.92)" : "rgba(233,233,233,0.98)",
    cardBorder: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
    cardBorderHover: isDark ? "rgba(255,255,255,0.24)" : "rgba(0,0,0,0.18)",
    iconBg: isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.92)",
    iconBorder: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
    iconColor: isDark ? "#f5f5f5" : "#1f2937",
    pillBg: isDark ? "rgba(34,34,34,0.95)" : "rgba(232,232,235,0.9)",
    pillBorder: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
    pillText: isDark ? "#d4d4d8" : "#3f3f46",
    listBg: isDark ? "rgba(15,15,15,0.9)" : "rgba(255,255,255,0.9)",
    listBorder: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
    benefitBg: isDark ? "rgba(23,23,23,0.65)" : "rgba(243,244,246,0.85)",
    benefitBorder: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
    overlayIcon: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
  } as const;

  const cardBaseStyle: CSSProperties = {
    backgroundColor: colors.cardBg,
    borderColor: colors.cardBorder,
    transition: "background-color 0.3s ease, border-color 0.3s ease, transform 0.3s ease",
  };

  const iconBaseStyle: CSSProperties = {
    backgroundColor: colors.iconBg,
    borderColor: colors.iconBorder,
    color: colors.iconColor,
    transition: "background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease",
  };

  const pillStyle: CSSProperties = {
    backgroundColor: colors.pillBg,
    borderColor: colors.pillBorder,
    color: colors.pillText,
  };

  const handleCardEnter = (event: ReactMouseEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    element.style.backgroundColor = colors.cardBgHover;
    element.style.borderColor = colors.cardBorderHover;
  };

  const handleCardLeave = (event: ReactMouseEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    element.style.backgroundColor = colors.cardBg;
    element.style.borderColor = colors.cardBorder;
  };

  const handleIconEnter = (event: ReactMouseEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    element.style.backgroundColor = colors.cardBgHover;
    element.style.borderColor = colors.cardBorderHover;
    element.style.color = colors.accent;
  };

  const handleIconLeave = (event: ReactMouseEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    element.style.backgroundColor = colors.iconBg;
    element.style.borderColor = colors.iconBorder;
    element.style.color = colors.iconColor;
  };

  return (
    <section
      className="py-24 relative"
      style={{ backgroundColor: colors.sectionBg, color: colors.textPrimary }}
    >
      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <div
            className="inline-flex items-center rounded-full border px-3 py-1 text-sm mb-6"
            style={{
              borderColor: colors.badgeBorder,
              backgroundColor: colors.badgeBg,
              color: colors.badgeText,
            }}
          >
            <span className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: colors.accent }}
                />
                <span
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ backgroundColor: colors.accent }}
                />
              </span>
              Powerful Features
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            <span style={{ color: colors.textPrimary }}>Everything You Need to</span>
            <br />
            <span style={{ color: colors.textHighlight }}>Excel in Your Studies</span>
          </h2>
          <p
            className="text-xl leading-relaxed"
            style={{ color: colors.textMuted }}
          >
            Flinote combines cutting-edge AI technology with intuitive design to transform how you learn.
          </p>
        </div>

        {/* BENTO GRID LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
          {/* 1. Large Feature (Spans 2 cols) */}
          <div
            className="md:col-span-2 rounded-3xl p-8 md:p-10 relative overflow-hidden group"
            style={{ ...cardBaseStyle }}
            onMouseEnter={handleCardEnter}
            onMouseLeave={handleCardLeave}
          >
            <div
              className="absolute top-0 right-0 p-10"
              style={{ opacity: isDark ? 0.06 : 0.08 }}
            >
              <FileText className="w-64 h-64" style={{ color: colors.overlayIcon }} />
            </div>
            <div className="relative z-10">
              <div
                className="w-12 h-12 rounded-xl border flex items-center justify-center mb-6"
                style={{ ...iconBaseStyle }}
                onMouseEnter={handleIconEnter}
                onMouseLeave={handleIconLeave}
              >
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-3" style={{ color: colors.textPrimary }}>
                Smart Note Generation
              </h3>
              <p className="text-lg max-w-lg" style={{ color: colors.textMuted }}>
                Create comprehensive notes from PDFs, audio, video, and web content with AI-powered extraction.
              </p>
              <div
                className="mt-6 inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold"
                style={{ ...pillStyle }}
              >
                Core Feature
              </div>
            </div>
          </div>

          {/* 2. Tall Feature (Row span 2) */}
          {/* TODO: COURSE_GENERATION_FEATURE - Uncomment to re-enable course generation feature */}
          {/* <div
            className="md:row-span-2 rounded-3xl p-8 md:p-10 relative overflow-hidden flex flex-col"
            style={{ ...cardBaseStyle }}
            onMouseEnter={handleCardEnter}
            onMouseLeave={handleCardLeave}
          >
            <div
              className="w-12 h-12 rounded-xl border flex items-center justify-center mb-6"
              style={{ ...iconBaseStyle }}
              onMouseEnter={handleIconEnter}
              onMouseLeave={handleIconLeave}
            >
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-3" style={{ color: colors.textPrimary }}>
              AI Course Generator
            </h3>
            <p className="text-lg mb-8" style={{ color: colors.textMuted }}>
              Generate complete courses with structured units, chapters, and video recommendations in seconds.
            </p>
            <div className="mt-auto space-y-3">
              {["Structured Units", "Video Links", "Key Concepts"].map((label) => (
                <div
                  key={label}
                  className="p-3 rounded-xl border text-sm font-medium"
                  style={{ ...pillStyle }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div> */}

          {/* 3. Regular Card */}
          <div
            className="rounded-3xl p-8 group"
            style={{ ...cardBaseStyle }}
            onMouseEnter={handleCardEnter}
            onMouseLeave={handleCardLeave}
          >
            <div
              className="w-10 h-10 rounded-lg border flex items-center justify-center mb-4"
              style={{ ...iconBaseStyle }}
              onMouseEnter={handleIconEnter}
              onMouseLeave={handleIconLeave}
            >
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
              Share & Collaborate
            </h3>
            <p className="text-sm" style={{ color: colors.textMuted }}>
              Share notes via secure links. Recipients can preview and save copies with full content.
            </p>
          </div>

          {/* 4. Regular Card */}
          <div
            className="rounded-3xl p-8 group"
            style={{ ...cardBaseStyle }}
            onMouseEnter={handleCardEnter}
            onMouseLeave={handleCardLeave}
          >
            <div
              className="w-10 h-10 rounded-lg border flex items-center justify-center mb-4"
              style={{ ...iconBaseStyle }}
              onMouseEnter={handleIconEnter}
              onMouseLeave={handleIconLeave}
            >
              <Folder className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
              Organize with Folders
            </h3>
            <p className="text-sm" style={{ color: colors.textMuted }}>
              Keep your notes organized in custom folders with color coding and easy navigation.
            </p>
          </div>

          {/* 5. Wide Card (Spans 2 cols) */}
          <div
            className="md:col-span-2 rounded-3xl p-8 flex flex-col md:flex-row md:items-center gap-8 group"
            style={{ ...cardBaseStyle }}
            onMouseEnter={handleCardEnter}
            onMouseLeave={handleCardLeave}
          >
            <div className="flex-1">
              <div
                className="w-10 h-10 rounded-lg border flex items-center justify-center mb-4"
                style={{ ...iconBaseStyle }}
                onMouseEnter={handleIconEnter}
                onMouseLeave={handleIconLeave}
              >
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
                Smart Flashcards & Quizzes
              </h3>
              <p style={{ color: colors.textMuted }}>
                Automatically generate interactive flashcards and quizzes from your notes for effective memorization.
              </p>
            </div>
            <div className="flex gap-3">
              {["Flashcards", "Quizzes"].map((label) => (
                <div
                  key={label}
                  className="px-4 py-2 rounded-lg border text-xs font-medium"
                  style={{ ...pillStyle }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* 6. Regular Card */}
          <div
            className="rounded-3xl p-8 group"
            style={{ ...cardBaseStyle }}
            onMouseEnter={handleCardEnter}
            onMouseLeave={handleCardLeave}
          >
            <div
              className="w-10 h-10 rounded-lg border flex items-center justify-center mb-4"
              style={{ ...iconBaseStyle }}
              onMouseEnter={handleIconEnter}
              onMouseLeave={handleIconLeave}
            >
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
              Visual Mindmaps
            </h3>
            <p className="text-sm" style={{ color: colors.textMuted }}>
              Transform complex concepts into clear mindmaps for better understanding.
            </p>
          </div>

          {/* 7. Regular Card */}
          <div
            className="rounded-3xl p-8 group"
            style={{ ...cardBaseStyle }}
            onMouseEnter={handleCardEnter}
            onMouseLeave={handleCardLeave}
          >
            <div
              className="w-10 h-10 rounded-lg border flex items-center justify-center mb-4"
              style={{ ...iconBaseStyle }}
              onMouseEnter={handleIconEnter}
              onMouseLeave={handleIconLeave}
            >
              <Headphones className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
              AI Podcasts
            </h3>
            <p className="text-sm" style={{ color: colors.textMuted }}>
              Convert your notes into engaging podcast-style audio for learning on the go.
            </p>
          </div>

          {/* 8. Regular Card */}
          <div
            className="rounded-3xl p-8 group"
            style={{ ...cardBaseStyle }}
            onMouseEnter={handleCardEnter}
            onMouseLeave={handleCardLeave}
          >
            <div
              className="w-10 h-10 rounded-lg border flex items-center justify-center mb-4"
              style={{ ...iconBaseStyle }}
              onMouseEnter={handleIconEnter}
              onMouseLeave={handleIconLeave}
            >
              <Languages className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
              100+ Languages
            </h3>
            <p className="text-sm" style={{ color: colors.textMuted }}>
              Support for over 100 languages with accurate transcription and translation.
            </p>
          </div>

          {/* 9. Regular Card */}
          <div
            className="rounded-3xl p-8 group"
            style={{ ...cardBaseStyle }}
            onMouseEnter={handleCardEnter}
            onMouseLeave={handleCardLeave}
          >
            <div
              className="w-10 h-10 rounded-lg border flex items-center justify-center mb-4"
              style={{ ...iconBaseStyle }}
              onMouseEnter={handleIconEnter}
              onMouseLeave={handleIconLeave}
            >
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
              Cross-Platform Sync
            </h3>
            <p className="text-sm" style={{ color: colors.textMuted }}>
              Access your notes seamlessly across web and mobile with real-time sync.
            </p>
          </div>
        </div>

        {/* Benefits Section */}
        <div
          className="rounded-3xl p-12"
          style={{ backgroundColor: colors.benefitBg, borderColor: colors.benefitBorder, borderWidth: 1, borderStyle: "solid" }}
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4" style={{ color: colors.textPrimary }}>
              Why Students Choose Flinote
            </h3>
            <p className="text-base" style={{ color: colors.textMuted }}>
              Built to remove friction so you can focus on learning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Clock,
                title: "Save Time",
                desc: "Reduce study preparation time by 70%.",
              },
              {
                icon: TrendingUp,
                title: "Better Retention",
                desc: "15-25% improvement in knowledge retention.",
              },
              {
                icon: Shield,
                title: "Secure & Private",
                desc: "Your notes are encrypted and secure.",
              },
              {
                icon: Sparkles,
                title: "AI-Powered",
                desc: "Adapts to your unique learning style.",
              },
            ].map((benefit) => (
              <div key={benefit.title} className="text-center">
                <div
                  className="w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto mb-6"
                  style={{ ...iconBaseStyle }}
                  onMouseEnter={handleIconEnter}
                  onMouseLeave={handleIconLeave}
                >
                  <benefit.icon className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold mb-2" style={{ color: colors.textPrimary }}>
                  {benefit.title}
                </h4>
                <p className="text-sm" style={{ color: colors.textMuted }}>
                  {benefit.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
