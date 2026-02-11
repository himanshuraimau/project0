"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const TrustLogos = [
  { src: "/university/mitLogo.png", alt: "MIT", width: 100 },
  { src: "/university/harvard.png", alt: "Harvard", width: 100 },
  { src: "/university/cambridge.png", alt: "Cambridge", width: 100 },
  { src: "/university/waterloo.png", alt: "Waterloo", width: 100 },
  { src: "/university/ugc.png", alt: "UGC", width: 100 },
];

function LogoItem({ logo }: { logo: (typeof TrustLogos)[number] }) {
  return (
    <div className="flex h-16 w-40 shrink-0 items-center justify-center px-4">
      <Image
        src={logo.src}
        alt={logo.alt}
        width={logo.width ?? 112}
        height={80}
        className="h-20 w-auto max-h-20 object-contain  transition-all duration-300"
      />
    </div>
  );
}

export function Stats() {
  // Triple the logos to ensure no white space on massive screens
  const marqueeLogos = [...TrustLogos, ...TrustLogos, ...TrustLogos];

  return (
    <section className="border-b border-border bg-background py-12 overflow-hidden">
      <div className="container max-w-7xl mx-auto px-4">
        <p className="text-center text-lg font-medium text-muted-foreground mb-10 tracking-wider uppercase">
          Trusted by the students of
        </p>

        {/* The Mask Container */}
        <div className="relative w-full overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
          <motion.div
            className="flex w-max items-center"
            animate={{ x: ["0%", "-33.33%"] }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 25, // Adjust for speed (lower = faster)
                ease: "linear",
              },
            }}
          >
            {marqueeLogos.map((logo, i) => (
              <LogoItem key={i} logo={logo} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
