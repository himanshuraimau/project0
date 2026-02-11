"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionRevealProps {
  children: ReactNode;
  className?: string;
  /** Root margin: how much of section must be in view to trigger (default: 10% from bottom) */
  rootMargin?: string;
  /** Optional delay in ms before revealing (stagger) */
  delay?: number;
}

export function SectionReveal({
  children,
  className,
  rootMargin = "0px 0px -10% 0px",
  delay = 0,
}: SectionRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            timeoutId = setTimeout(() => setVisible(true), delay);
            break;
          }
        }
      },
      { rootMargin, threshold: 0.05 },
    );

    observer.observe(el);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [rootMargin, delay]);

  return (
    <div
      ref={ref}
      className={cn(
        "section-reveal",
        visible && "section-reveal-visible",
        className,
      )}
      style={delay > 0 ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
