"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Zap,
  LayoutDashboard,
  Play,
  Mic,
  Search,
  ChevronLeft,
  MoreVertical,
  FileText,
  BrainCircuit,
  HelpCircle,
  X,
  Pause,
  Maximize2,
  MoreHorizontal,
  Wifi,
  Battery,
  Signal,
  User,
  GraduationCap,
  Sparkles,
  Command,
  Smartphone,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

// --- Platform button icon (no website PNG in folder) ---
function WebsiteIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

// --- Utility Components for the Mobile Screens ---

const StatusBar = ({ dark = false }: { dark?: boolean }) => (
  <div
    className={cn(
      "flex justify-between items-center px-6 pt-3 pb-2 w-full select-none z-20 relative",
      dark ? "text-white" : "text-black"
    )}
  >
    <span className="text-[10px] font-semibold tracking-wide">9:41</span>
    <div
      className={cn(
        "absolute left-1/2 -translate-x-1/2 top-2 h-[22px] w-[70px] rounded-full z-20 flex items-center justify-end px-2",
        dark ? "bg-black" : "bg-black"
      )}
    >
      <div className="h-1.5 w-1.5 rounded-full bg-green-500/50 shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
    </div>
    <div className="flex items-center gap-1.5">
      <Signal className="h-3 w-3" strokeWidth={2.5} />
      <Wifi className="h-3 w-3" strokeWidth={2.5} />
      <Battery className="h-3 w-3" strokeWidth={2.5} />
    </div>
  </div>
);

const HomeIndicator = ({ dark = false }: { dark?: boolean }) => (
  <div
    className={cn(
      "absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-28 rounded-full z-20",
      dark ? "bg-white/20" : "bg-black/20"
    )}
  />
);

// --- Screen 1: Explore / Home ---
const ScreenExplore = () => (
  <div className="bg-white h-full w-full flex flex-col font-sans relative overflow-hidden">
    {/* Background Decorative Blob */}
    <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-orange-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

    <StatusBar />
    <div className="flex-1 overflow-hidden flex flex-col px-4 pt-4 relative z-10">
      {/* Avatar Header */}
      <div className="flex flex-col items-center justify-center mb-6">
        <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-orange-300 via-yellow-300 to-orange-100 p-[3px] mb-3 shadow-sm">
          <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden">
            <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-400">
              <User className="h-8 w-8" fill="currentColor" />
            </div>
          </div>
        </div>
        <h2 className="text-center text-lg font-bold leading-tight text-slate-900">
          What topic do you want
          <br />
          to explore today?
        </h2>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          disabled
          type="text"
          placeholder="Enter any topic..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs shadow-sm"
        />
      </div>

      {/* Tags */}
      <div className="flex gap-2 overflow-x-hidden mb-5">
        <div className="bg-black text-white px-3 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap flex items-center gap-1 shadow-md shadow-slate-200">
          <LayoutDashboard className="h-3 w-3" /> Computer Science
        </div>
        <div className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap border border-slate-200">
          Nursing
        </div>
        <div className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap border border-slate-200">
          Business
        </div>
      </div>

      {/* Course List */}
      <div className="space-y-2.5">
        <div className="p-3 bg-white rounded-xl border border-slate-100 flex gap-3 items-center shadow-sm">
          <div className="h-8 w-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500">
            <LayoutDashboard className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-800">
              Data Structures
            </div>
            <div className="text-[9px] text-slate-400">
              Learn about data structures...
            </div>
          </div>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-100 flex gap-3 items-center shadow-sm">
          <div className="h-8 w-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-500">
            <BrainCircuit className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-800">
              Algorithms
            </div>
            <div className="text-[9px] text-slate-400">
              Sorting, searching & big O...
            </div>
          </div>
        </div>
        {/* Partial Item for scroll hint */}
        <div className="p-3 bg-white rounded-xl border border-slate-100 flex gap-3 items-center opacity-50">
          <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500">
            <Wifi className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-800">
              Computer Networks
            </div>
            <div className="text-[9px] text-slate-400">
              Learn about protocols...
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-auto pb-6">
        <div className="w-full bg-[#8b8df7] text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 border-t border-indigo-400/20">
          <Zap className="h-3.5 w-3.5 fill-white" /> Start Exploring
        </div>
      </div>
    </div>
    <HomeIndicator />
  </div>
);

// --- Screen 2: Voice Mode ---
const ScreenVoice = () => (
  <div className="bg-white h-full w-full flex flex-col font-sans relative overflow-hidden">
    <StatusBar />
    <div className="absolute top-4 left-4 h-8 w-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center z-10">
      <ChevronLeft className="h-4 w-4 text-slate-600" />
    </div>

    <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-10 relative z-0">
      {/* Decorative rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-orange-100 rounded-full opacity-50" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-orange-50 rounded-full opacity-30" />

      {/* Avatar */}
      <div className="h-28 w-28 rounded-full bg-gradient-to-b from-amber-300 to-orange-500 p-1.5 shadow-xl shadow-orange-200/50 mb-8 relative">
        <div className="h-full w-full rounded-full bg-[#F5F5F0] border-[4px] border-white overflow-hidden flex items-end justify-center relative">
          {/* CSS Generated "Flinote" Bust */}
          <div className="relative w-16 h-16 mb-[-5px]">
            <GraduationCap
              className="w-16 h-16 text-slate-800 opacity-80"
              strokeWidth={1}
            />
          </div>
        </div>
        {/* Status Badge */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-white px-2 py-0.5 rounded-full shadow-md border border-slate-100">
          <div className="flex gap-0.5 items-center">
            <div className="h-1 w-1 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[6px] font-bold text-slate-600 uppercase">
              Online
            </span>
          </div>
        </div>
      </div>

      {/* Text */}
      <h3 className="text-xl font-bold text-center text-slate-900 leading-snug mb-16 relative">
        Explain the Pharmacology
        <br />
        like I'm five years old?
        <Sparkles
          className="h-4 w-4 text-yellow-400 absolute -top-4 right-0"
          fill="currentColor"
        />
      </h3>

      {/* Listening State */}
      <div className="flex items-center gap-2 mb-8">
        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest animate-pulse">
          Listening...
        </span>
      </div>

      {/* Mic Button */}
      <div className="h-16 w-16 rounded-full bg-[#5b5ef5] flex items-center justify-center shadow-[0_10px_30px_rgba(91,94,245,0.4)] relative group transition-transform active:scale-95">
        <div className="absolute inset-0 bg-[#5b5ef5] rounded-full animate-ping opacity-20 duration-1000" />
        <div className="absolute inset-0 border border-white/20 rounded-full" />
        <Mic className="h-7 w-7 text-white" />
      </div>
    </div>
    <HomeIndicator />
  </div>
);

// --- Screen 3: Mind Map (Dark Mode) ---
const ScreenMindMap = () => (
  <div className="bg-zinc-950 h-full w-full flex flex-col font-sans text-white relative overflow-hidden">
    <StatusBar dark />
    <div className="flex justify-between items-center px-4 pt-2 z-10">
      <div className="h-8 w-8 bg-zinc-900/50 backdrop-blur-md rounded-full border border-white/5 flex items-center justify-center">
        <ChevronLeft className="h-4 w-4" />
      </div>
      <div className="h-8 w-8 bg-zinc-900/50 backdrop-blur-md rounded-full border border-white/5 flex items-center justify-center text-amber-500">
        <BrainCircuit className="h-4 w-4" />
      </div>
    </div>

    {/* Mindmap Nodes Visualization */}
    <div className="flex-1 relative scale-[0.85] origin-center mt-4">
      {/* Center Node */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-full text-[10px] font-bold border border-indigo-400/30 shadow-[0_0_20px_rgba(99,102,241,0.4)] flex items-center gap-1">
          <Sparkles className="h-2 w-2" /> Pharmacology
        </div>
      </div>

      {/* Radiating Lines (SVG) */}
      <svg className="absolute inset-0 h-full w-full pointer-events-none opacity-40">
        <path
          d="M120 250 Q 80 180 60 150"
          stroke="#f472b6"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="4 2"
        />
        <path
          d="M120 250 Q 180 150 200 120"
          stroke="#818cf8"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M120 250 Q 60 350 50 380"
          stroke="#fca5a5"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M120 250 Q 180 350 200 380"
          stroke="#c4b5fd"
          strokeWidth="1.5"
          fill="none"
        />
      </svg>

      {/* Floating Nodes */}
      <div className="absolute top-[30%] left-[15%] bg-pink-500/10 border border-pink-500/30 text-pink-200 px-2 py-1.5 rounded-xl text-[8px] font-semibold backdrop-blur-sm">
        Mechanisms
      </div>
      <div className="absolute top-[24%] right-[15%] bg-indigo-500/10 border border-indigo-500/30 text-indigo-200 px-2 py-1.5 rounded-xl text-[8px] font-semibold backdrop-blur-sm">
        Interactions
      </div>
      <div className="absolute top-[75%] left-[15%] bg-rose-500/10 border border-rose-500/30 text-rose-200 px-2 py-1.5 rounded-xl text-[8px] font-semibold backdrop-blur-sm">
        Side Effects
      </div>
      <div className="absolute top-[76%] right-[15%] bg-violet-500/10 border border-violet-500/30 text-violet-200 px-2 py-1.5 rounded-xl text-[8px] font-semibold backdrop-blur-sm">
        Dosage
      </div>
    </div>

    {/* Bottom Controls */}
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
      <div className="h-9 w-9 bg-zinc-800/80 rounded-full border border-zinc-700 flex items-center justify-center hover:bg-zinc-700 transition-colors">
        <Maximize2 className="h-4 w-4 text-zinc-400" />
      </div>
      <div className="h-9 w-9 bg-zinc-800/80 rounded-full border border-zinc-700 flex items-center justify-center hover:bg-zinc-700 transition-colors">
        <Search className="h-4 w-4 text-zinc-400" />
      </div>
    </div>
    <HomeIndicator dark />
  </div>
);

// --- Screen 4: Content / Video ---
const ScreenCourse = () => (
  <div className="bg-slate-50 h-full w-full flex flex-col font-sans">
    <StatusBar />
    <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-100 bg-white shadow-sm z-10">
      <ChevronLeft className="h-5 w-5 text-slate-500" />
      <span className="text-[10px] font-medium text-slate-500">Back</span>
      <MoreVertical className="h-4 w-4 text-slate-400 ml-auto" />
    </div>

    <div className="flex-1 overflow-hidden relative">
      <div className="bg-white px-4 pt-4 pb-20 overflow-y-auto h-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <h1 className="text-xl font-bold text-slate-900 leading-tight mb-2">
          Moral Dilemmas in Troll...
        </h1>
        <div className="text-[9px] text-slate-400 mb-4 flex items-center gap-1">
          <span>23 Oct 2024</span> • <span>06:21 PM</span>
        </div>

        <div className="flex gap-2 mb-4">
          <button className="flex items-center gap-1.5 bg-zinc-900 text-white pl-2 pr-3 py-1.5 rounded-lg text-[9px] font-medium shadow-sm">
            <FileText className="h-3 w-3" /> Note
          </button>
          <button className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 pl-2 pr-3 py-1.5 rounded-lg text-[9px] font-medium shadow-sm">
            <MoreHorizontal className="h-3 w-3" /> Transcript
          </button>
          <button className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 pl-2 pr-3 py-1.5 rounded-lg text-[9px] font-medium shadow-sm">
            <HelpCircle className="h-3 w-3" /> Quiz
          </button>
        </div>

        {/* Mock Video Player (No External Image) */}
        <div className="w-full aspect-video bg-zinc-900 rounded-xl mb-4 relative overflow-hidden group shadow-lg">
          {/* CSS Pattern Background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-700 via-zinc-900 to-black opacity-80" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />

          {/* Harvard Text Overlay */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <div className="bg-red-900/80 text-white text-[8px] font-serif px-1.5 py-0.5 border border-red-700">
              HARVARD
            </div>
            <div className="text-white/60 text-[8px]">
              Justice: What's The Right Thing...
            </div>
          </div>

          {/* Play Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-12 w-12 bg-red-600/90 hover:bg-red-600 rounded-full flex items-center justify-center shadow-xl backdrop-blur-sm transition-transform hover:scale-105 border border-white/10">
              <Play className="h-5 w-5 fill-white text-white ml-0.5" />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div className="h-full w-1/3 bg-red-600 relative">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 h-2.5 w-2.5 bg-red-600 rounded-full shadow" />
            </div>
          </div>
        </div>

        {/* View Mind Map Button */}
        <div className="w-full bg-[#5b5ef5] hover:bg-[#4a4ddc] text-white py-2.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 mb-6 shadow-md transition-colors">
          <BrainCircuit className="h-3.5 w-3.5" /> View Mind Map
        </div>

        <h3 className="text-[#5b5ef5] text-xs font-bold mb-2 flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> Introduction
        </h3>
        <p className="text-[10px] text-slate-600 leading-relaxed mb-4">
          This document explores the moral dilemmas presented in trolley
          problems and real-life scenarios, focusing on the ethical implications
          of consequentialist...
        </p>
      </div>

      {/* Sticky Bottom Action */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-zinc-900 text-white w-full py-3 rounded-xl flex items-center justify-center gap-3 shadow-xl border border-zinc-800 cursor-pointer hover:bg-black transition-colors">
          <div className="h-5 w-5 rounded-full bg-indigo-500 flex items-center justify-center border border-white/20">
            <GraduationCap className="h-3 w-3 text-white" />
          </div>
          <span className="text-[11px] font-semibold">Start Flinote Test</span>
        </div>
      </div>
    </div>
    <HomeIndicator />
  </div>
);

// --- Screen 5: Recording ---
const ScreenRecording = () => (
  <div className="bg-slate-50 h-full w-full flex flex-col font-sans">
    <StatusBar />
    <div className="flex-1 flex flex-col items-center pt-10 px-4">
      <div className="flex items-center gap-2 text-red-500 mb-8 bg-red-50 px-3 py-1 rounded-full border border-red-100">
        <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[9px] font-bold uppercase tracking-widest">
          Recording
        </span>
      </div>

      {/* CSS Waveform Visualization */}
      <div className="w-full h-32 bg-zinc-900 rounded-2xl flex items-center justify-center gap-[3px] px-6 mb-8 shadow-2xl relative overflow-hidden ring-1 ring-black/5">
        {/* Center Line */}
        <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-zinc-800" />

        {/* Red Playhead */}
        <div className="absolute left-1/2 top-4 bottom-4 w-0.5 bg-red-500 z-10 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />

        {/* Generated Bars */}
        {Array.from({ length: 30 }).map((_, i) => {
          const height = 15 + Math.random() * 70;
          return (
            <div
              key={i}
              className={cn(
                "w-1.5 rounded-full transition-all duration-300 ease-in-out",
                i === 14 || i === 15 ? "bg-red-500" : "bg-zinc-700"
              )}
              style={{ height: `${height}%` }}
            />
          );
        })}

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/80 backdrop-blur px-3 py-1 rounded-full border border-zinc-800">
          <Mic className="h-2.5 w-2.5 text-white" />
          <span className="text-[9px] text-zinc-300 font-medium tracking-tight">
            Flinote AI
          </span>
        </div>
      </div>

      {/* Language Selection */}
      <div className="w-full bg-white rounded-xl p-3 border border-slate-200 mb-8 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <BrainCircuit className="h-3.5 w-3.5 text-indigo-500" />
          <span className="text-[10px] font-bold text-slate-700">
            Note language
          </span>
        </div>
        <div className="w-full bg-slate-50/50 rounded-lg py-2.5 px-3 flex justify-between items-center text-[10px] font-medium text-slate-600 border border-slate-200 hover:border-indigo-200 transition-colors cursor-pointer">
          <span className="flex items-center gap-2">🇺🇸 Auto detect</span>
          <MoreVertical className="h-3 w-3 text-slate-400" />
        </div>
      </div>

      {/* Timer */}
      <div className="text-4xl font-mono font-bold text-slate-900 tracking-tighter mb-10 tabular-nums">
        00:00:03
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-10 w-full">
        <div className="flex flex-col items-center gap-2 group cursor-pointer">
          <div className="h-12 w-12 rounded-full bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-semibold text-slate-400">
            Cancel
          </span>
        </div>

        <div className="h-20 w-20 rounded-full border-[3px] border-slate-100 p-1 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
          <div className="h-full w-full bg-red-500 rounded-full shadow-lg shadow-red-200 flex items-center justify-center group">
            <div className="h-6 w-6 bg-white rounded-md group-hover:scale-90 transition-transform" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 group cursor-pointer">
          <div className="h-12 w-12 rounded-full bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors">
            <Pause className="h-5 w-5 fill-slate-600" />
          </div>
          <span className="text-[10px] font-semibold text-slate-400">
            Pause
          </span>
        </div>
      </div>
    </div>
    <HomeIndicator />
  </div>
);

// --- Main Presentation Component ---

function MobileFrame({
  rotation,
  children,
}: {
  rotation: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative shrink-0 w-[240px] h-[500px]"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <div className="h-full w-full rounded-[35px] border-[8px] border-zinc-950 bg-zinc-950 shadow-2xl overflow-hidden ring-1 ring-white/10 relative select-none">
        {children}
      </div>
    </div>
  );
}

export function Hero() {
  const { data: session } = useSession();

  return (
    <section className="relative w-full flex flex-col items-center border-b border-border bg-background overflow-hidden min-h-[113vh]">
      <div className="max-w-7xl mx-auto items-center gap-12 px-4 py-24 z-10 relative">
        <div className="flex flex-col gap-6 items-center">
          <span className="inline-flex w-fit rounded-full bg-primary/5 px-4 py-1.5 text-sm font-semibold text-primary border border-primary/10 shadow-sm">
            Learn like a pro
          </span>
          <h1 className="text-[40px] font-extrabold leading-[1.1] tracking-tight text-foreground md:text-[56px] lg:text-[72px] text-center">
            Never take notes again
          </h1>
          <p className="max-w-xl text-center text-lg text-muted-foreground leading-relaxed">
            The all-in-one AI study companion. Generate quizzes, flashcards, and
            mindmaps from your notes instantly.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {!session ? (
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="rounded-full h-12 px-8 bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all hover:-translate-y-0.5"
                >
                  <Zap className="mr-2 h-5 w-5 fill-current" />
                  Start Learning
                </Button>
              </Link>
            ) : (
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="rounded-full h-12 px-8 bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
                >
                  <LayoutDashboard className="mr-2 h-5 w-5" />
                  Go to Dashboard
                </Button>
              </Link>
            )}
            <Link href="/sign-in">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full h-12 px-8 border-2 hover:bg-muted/50 font-medium"
              >
                Try free lesson
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="w-full relative pb-10 overflow-hidden">
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12 z-10 relative">
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-xl bg-foreground px-4 py-2.5 text-white transition-all hover:opacity-90 hover:scale-105 shadow-md active:scale-95"
            aria-label="Download on the App Store"
          >
            <Image
              src="/button-icons/Apple.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 shrink-0 object-contain"
            />
            <div className="text-left">
              <span className="block text-[10px] leading-tight opacity-80 font-medium">
                Download on the
              </span>
              <span className="block text-sm font-bold leading-tight tracking-wide">
                App Store
              </span>
            </div>
          </a>
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-xl bg-foreground px-4 py-2.5 text-white transition-all hover:opacity-90 hover:scale-105 shadow-md active:scale-95"
            aria-label="Get it on Google Play"
          >
            <Image
              src="/button-icons/playstore.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 shrink-0 object-contain"
            />
            <div className="text-left">
              <span className="block text-[10px] leading-tight opacity-80 font-medium">
                GET IT ON
              </span>
              <span className="block text-sm font-bold leading-tight tracking-wide">
                Google Play
              </span>
            </div>
          </a>
          <a
            href="#"
            className="inline-flex items-center gap-3 rounded-xl bg-foreground px-4 py-2.5 text-white transition-all hover:opacity-90 hover:scale-105 shadow-md active:scale-95"
            aria-label="Start on the Web version"
          >
            <WebsiteIcon className="h-7 w-7 shrink-0 text-white" />
            <div className="text-left">
              <span className="block text-[10px] leading-tight opacity-80 font-medium">
                Start on the
              </span>
              <span className="block text-sm font-bold leading-tight tracking-wide">
                Web version
              </span>
            </div>
          </a>
        </div>

        <div className="flex items-center justify-center -space-x-24 md:-space-x-12 lg:-space-x-8 px-4 perspective-1000 scale-[0.6] md:scale-[0.8] lg:scale-100 origin-top">
          {/* Screen 1 (Explore) */}
          <div className="hidden lg:block cursor-pointer scale-[0.85] opacity-80 hover:opacity-100 transition-all hover:scale-90 hover:z-30 duration-500 hover:-translate-y-4">
            <MobileFrame rotation="-8">
              <ScreenExplore />
            </MobileFrame>
          </div>

          {/* Screen 2 (Voice) */}
          <div className="hidden md:block cursor-pointer scale-[0.9] opacity-90 hover:opacity-100 z-10 transition-all hover:scale-95 hover:z-30 duration-500 hover:-translate-y-4">
            <MobileFrame rotation="-4">
              <ScreenVoice />
            </MobileFrame>
          </div>

          {/* Screen 3 (Mind Map) - Center */}
          <div className="z-20 scale-100 cursor-pointer shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] transition-all hover:scale-[1.05] duration-500 hover:z-30 hover:-translate-y-2">
            <MobileFrame rotation="0">
              <ScreenCourse />
            </MobileFrame>
          </div>

          {/* Screen 4 (Course) */}
          <div className="hidden md:block cursor-pointer scale-[0.9] opacity-90 hover:opacity-100 z-10 transition-all hover:scale-95 hover:z-30 duration-500 hover:-translate-y-4">
            <MobileFrame rotation="4">
              <ScreenRecording />
            </MobileFrame>
          </div>

          {/* Screen 5 (Recording) */}
          <div className="hidden cursor-pointer lg:block scale-[0.85] opacity-80 hover:opacity-100 transition-all hover:scale-90 hover:z-30 duration-500 hover:-translate-y-4">
            <MobileFrame rotation="8">
              <ScreenMindMap />
            </MobileFrame>
          </div>
        </div>
      </div>
    </section>
  );
}
