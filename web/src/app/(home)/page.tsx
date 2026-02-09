"use client";

import { Hero } from "@/components/landing/hero";
import { Stats } from "@/components/landing/stats";
import { Features } from "@/components/landing/features";
import { Testimonials } from "@/components/landing/testimonials";
import { FAQ } from "@/components/landing/faq";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";
import { WhyChooseUs } from "@/components/landing";

export default function Home() {
  return (
    <>
      <Hero />
      <Stats />
      <Features />
      {/* <WhyChooseUs /> */}
      <Testimonials />
      <FAQ />
      {/* <CTA /> */}
      <Footer />
    </>
  );
}
