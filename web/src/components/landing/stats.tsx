"use client";

import Image from "next/image";
import { motion } from "framer-motion";

// Logos for "Trusted by the students of" marquee (from public/university/).
const TrustLogos: Array<{
  type: "image";
  src: string;
  alt: string;
  width?: number;
}> = [
  { type: "image", src: "/logo.png", alt: "Flinote", width: 90 },
  { type: "image", src: "/university/mitLogo.png", alt: "MIT", width: 100 },
  { type: "image", src: "/university/harvard.png", alt: "Harvard", width: 100 },
  {
    type: "image",
    src: "/university/cambridge.png",
    alt: "Cambridge",
    width: 100,
  },
  {
    type: "image",
    src: "/university/waterloo.png",
    alt: "Waterloo",
    width: 100,
  },
  { type: "image", src: "/university/ugc.png", alt: "UGC", width: 100 },
];

function LogoItem({
  logo,
  index,
}: {
  logo: (typeof TrustLogos)[number];
  index: number;
}) {
  return (
    <div
      key={index}
      className="flex h-16 w-28 shrink-0 items-center justify-center"
    >
      <Image
        src={logo.src}
        alt={logo.alt}
        width={logo.width ?? 112}
        height={64}
        className="h-14 w-auto max-h-14 object-contain object-center"
      />
    </div>
  );
}

export function Stats() {
  const duplicatedLogos = [...TrustLogos, ...TrustLogos];

  return (
    <section className="border-b border-border bg-background py-12">
      <div className="container max-w-7xl mx-auto px-4">
        <p className="text-center text-sm font-medium text-muted-foreground mb-6">
          Trusted by the students of
        </p>
        <div className="relative w-full overflow-hidden">
          <motion.div
            className="flex w-max gap-8 items-center pr-10"
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 35,
                ease: "linear",
              },
            }}
          >
            {duplicatedLogos.map((logo, i) => (
              <LogoItem key={i} logo={logo} index={i} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
