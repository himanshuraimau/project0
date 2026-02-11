"use client";

import { Hero } from "@/components/landing/hero";
import { Stats } from "@/components/landing/stats";
import { Features } from "@/components/landing/features";
import { Testimonials } from "@/components/landing/testimonials";
import { FAQ } from "@/components/landing/faq";
import { GetItFree } from "@/components/landing/get-it-free";
import { Footer } from "@/components/landing/footer";
import { HowItWorks, SectionReveal } from "@/components/landing";

export default function Home() {
  return (
    <>
      <Hero />
      <SectionReveal>
        <Stats />
      </SectionReveal>
      <SectionReveal delay={50}>
        <HowItWorks />
      </SectionReveal>
      <SectionReveal delay={100}>
        <Features />
      </SectionReveal>
      <SectionReveal delay={80}>
        <Testimonials />
      </SectionReveal>
      <SectionReveal delay={60}>
        <FAQ />
      </SectionReveal>
      <SectionReveal delay={50}>
        <GetItFree />
      </SectionReveal>
      <SectionReveal delay={40}>
        <Footer />
      </SectionReveal>
    </>
  );
}
