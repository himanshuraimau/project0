import type { Metadata } from "next";
import { Hero } from "@/components/landing/hero";
import { Stats } from "@/components/landing/stats";
import { Features } from "@/components/landing/features";
import { Testimonials } from "@/components/landing/testimonials";
import { FAQ } from "@/components/landing/faq";
import { faqs } from "@/components/landing/faq-data";
import { GetItFree } from "@/components/landing/get-it-free";
import { Footer } from "@/components/landing/footer";
import { HowItWorks, SectionReveal } from "@/components/landing";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
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
