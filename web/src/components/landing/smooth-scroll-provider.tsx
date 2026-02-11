"use client";

import { ReactLenis } from "lenis/react";
import { useEffect, useState, type ReactNode } from "react";
import "lenis/dist/lenis.css";

/** Buttery smooth scroll for the landing page. Respects prefers-reduced-motion. */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const [useSmoothScroll, setUseSmoothScroll] = useState<boolean | null>(null);

  useEffect(() => {
    setUseSmoothScroll(
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);

  if (useSmoothScroll === null || useSmoothScroll === false) {
    return <>{children}</>;
  }

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.08,
        smoothWheel: true,
        wheelMultiplier: 0.9,
        gestureOrientation: "vertical",
        syncTouch: true,
        touchMultiplier: 1.25,
        autoRaf: true,
        anchors: true,
      }}
    >
      {children}
    </ReactLenis>
  );
}
