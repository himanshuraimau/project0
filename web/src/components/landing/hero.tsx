"use client";

import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { SmartPhone01Icon, BrowserIcon } from "@hugeicons/core-free-icons";
import { motion, useReducedMotion } from "framer-motion";

// Helper component for floating icons
// Updated Helper component for a smooth, subtle hover
function FloatingIcon({
  src,
  containerClass,
  delay = 0,
  duration = 5, // Slower is better for "float"
}: {
  src: string;
  containerClass: string;
  delay?: number;
  duration?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={`absolute z-0 ${containerClass}`}>
      <motion.div
        className="w-full h-full"
        animate={
          reduceMotion
            ? {}
            : {
                // Subtle 15px movement up and down
                y: [0, -15],
                // Very slight tilt
                rotate: [-2, 2],
              }
        }
        transition={{
          duration: duration,
          repeat: Infinity,
          // Mirror creates the smooth "up then down" sequence
          repeatType: "mirror",
          ease: "easeInOut",
          delay: delay,
        }}
      >
        <Image
          src={src}
          alt=""
          width={300}
          height={300}
          className="w-full h-auto drop-shadow-[0_15px_30px_rgba(0,0,0,0.08)]"
          priority
        />
      </motion.div>
    </div>
  );
}
export function Hero() {
  const { data: session } = useSession();

  return (
    <section className="relative w-full min-h-screen flex max-w-7xl mx-auto flex-col items-center justify-center overflow-hidden bg-background">
      {/* --- Floating Icons Layer --- */}
      <div
        className="absolute inset-0 pointer-events-none select-none"
        aria-hidden="true"
      >
        {/* PDF Icon - Mid Left - Fast & Shallow */}
        <FloatingIcon
          src="/hero/pdf.png"
          containerClass="left-[5%] top-[30%] w-[144px] md:w-[192px] lg:w-[240px]"
          duration={3.5}
          delay={0}
        />

        {/* Headphone Icon - Top Right - Slower & Deeper */}
        <FloatingIcon
          src="/hero/Headphone.png"
          containerClass="right-[10%] top-[5%] w-[120px] md:w-[168px] lg:w-[220px]"
          duration={4.5}
          delay={0.5}
        />

        {/* Microphone Icon - Bottom Right - Medium */}
        <FloatingIcon
          src="/hero/mic.png"
          containerClass="right-[5%] bottom-[20%] w-[156px] md:w-[204px] lg:w-[260px]"
          duration={4}
          delay={1}
        />
      </div>

      {/* --- Main Content --- */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-20 text-center">
        {/* ... rest of your hero content remains the same ... */}
        <motion.h1
          className="font-bold -mt-10 leading-[1] tracking-[-3%] text-foreground text-5xl md:text-6xl lg:text-[76px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          Turn anything into <br />
          <span className="md:text-6xl lg:text-[72.5px] text-5xl font-bold">
            Instant notes
          </span>
        </motion.h1>

        <motion.p
          className="mt-4 text-xl w-full text-muted-foreground mx-auto leading-relaxed tracking-wide md:text-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          Instantly turn audio, video, and PDFs into <br /> notes, flashcards,
          quizzes, and podcasts
        </motion.p>

        <motion.div
          className="mt-14 flex flex-col items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
        >
          <Link
            href={session ? "/dashboard" : "/sign-up"}
            className="w-full flex justify-center"
          >
            <Button
              size="lg"
              className="sm:w-[80%] w-full font-medium rounded-2xl py-7 cursor-pointer px-10 bg-foreground text-background hover:bg-foreground/90 shadow-[0_10px_20px_rgba(0,0,0,0.15)] transition-all hover:scale-[1.02] active:scale-[0.98] gap-3 text-lg"
            >
              Download the app
              <HugeiconsIcon icon={SmartPhone01Icon} className="size-7" />
            </Button>
          </Link>

          <Link href="/dashboard" className="w-full flex justify-center">
            <Button
              size="lg"
              className="sm:w-[80%] w-full font-medium rounded-2xl py-7 cursor-pointer px-10 bg-muted hover:bg-muted/80 text-foreground transition-all hover:scale-[1.02] active:scale-[0.98] gap-3 text-lg"
            >
              Continue on web
              <HugeiconsIcon icon={BrowserIcon} className="size-7" />
            </Button>
          </Link>
        </motion.div>

        <motion.div
          className="mt-12 flex flex-col items-center gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
        >
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="h-5 w-5 fill-[#ffb800] text-[#ffb800]" />
            ))}
            <span className="ml-2 font-medium text-foreground">4.9 stars</span>
          </div>
          <p className="font-medium text-muted-foreground">
            Trusted by{" "}
            <span className="text-foreground font-semibold">10000+</span>{" "}
            students worldwide
          </p>
        </motion.div>
      </div>
    </section>
  );
}
