"use client";

import {
  FileText,
  Headphones,
  Brain,
  Smartphone,
  BookOpen,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";

// Data for the icons floating around the center
const centerIcons = [
  { icon: FileText, label: "Notes", badge: 12, color: "text-blue-500" },
  { icon: Headphones, label: "Podcasts", badge: 5, color: "text-purple-500" },
  { icon: Brain, label: "Mindmaps", badge: 8, color: "text-pink-500" },
  { icon: Smartphone, label: "Mobile", badge: 24, color: "text-green-500" },
  { icon: BookOpen, label: "Quizzes", badge: 3, color: "text-orange-500" },
  { icon: Zap, label: "Flashcards", badge: 15, color: "text-yellow-500" },
];

const features = [
  {
    title: "Clear System",
    description:
      "Follow a simple system that guides every note and study session you create.",
  },
  {
    title: "Every Format",
    description:
      "Create once and show up everywhere. PDFs, audio, or text turn into study material instantly.",
  },
  {
    title: "Real Results",
    description:
      "Results that keep building instead of fading away. Better retention and long-term recall.",
  },
];

export function WhyChooseUs() {
  return (
    <section className="bg-background py-20 overflow-hidden">
      <div className="container mx-auto px-4 relative max-w-6xl">
        {/* HERO SECTION WITH FLOATING ICONS */}
        <div className="relative h-[400px] flex items-center justify-center mb-12">
          {/* Central Headline */}
          <div className="z-10 text-center max-w-xl relative">
            <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              Built to Go <br /> Everywhere
            </h2>

            {/* Decorative decorative swirls (Optional visual flair) */}
            <svg
              className="absolute -top-12 -right-12 w-24 h-24 text-muted-foreground/20 rotate-12 hidden md:block"
              viewBox="0 0 100 100"
              fill="none"
              stroke="currentColor"
            >
              <path d="M20,50 Q50,0 80,50 T100,50" strokeWidth="2" />
            </svg>
          </div>

          {/* Orbiting Icons */}
          <div className="absolute inset-0 pointer-events-none">
            {centerIcons.map((item, index) => {
              // Calculate position on a semi-circle/oval
              // We distribute them roughly around the top/sides
              const total = centerIcons.length;
              const angle = (index / (total - 1)) * 180 + 180; // Arc from left to right over top

              // We use responsive radius approximation logic in styling below,
              // but for cleaner code we use absolute positioning with transforms

              // Custom spread for visual randomness like the reference image
              const positions = [
                { top: "15%", left: "20%" }, // Top Left
                { top: "5%", left: "35%" }, // Top Mid-Left
                { top: "5%", right: "35%" }, // Top Mid-Right
                { top: "15%", right: "20%" }, // Top Right
                { bottom: "20%", left: "25%" }, // Bottom Left
                { bottom: "10%", right: "30%" }, // Bottom Right
              ];

              const pos = positions[index % positions.length];

              return (
                <motion.div
                  key={item.label}
                  className="absolute hidden md:flex flex-col items-center justify-center"
                  style={{ ...pos }}
                  animate={{
                    y: [0, -15, 0], // Float animation
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.5, // Stagger animations
                  }}
                >
                  <div className="relative bg-white dark:bg-card p-4 rounded-2xl shadow-xl border border-border/50">
                    <item.icon className={`w-8 h-8 ${item.color}`} />

                    {/* Notification Badge */}
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full border-2 border-background">
                      {item.badge}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* FEATURE COLUMNS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center px-4 md:px-12">
          {features.map((feature, i) => (
            <div key={i} className="flex flex-col items-center">
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Mobile View Icons (Only visible on small screens) */}
        <div className="md:hidden mt-12 flex flex-wrap justify-center gap-6">
          {centerIcons.map((item) => (
            <div
              key={item.label}
              className="relative bg-card p-3 rounded-xl shadow-sm border border-border"
            >
              <item.icon className={`w-6 h-6 ${item.color}`} />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {item.badge}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default WhyChooseUs;
