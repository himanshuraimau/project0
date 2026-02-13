"use client";

import Image from "next/image";

const STEPS = [
  {
    id: 1,
    title: "Upload content",
    description: "Upload a PDF, paste a YouTube link, or add audio.",
    image: "/works/upload.png",
    alt: "Upload content illustration",
  },
  {
    id: 2,
    title: "AI processes it",
    description:
      "We transcribe, extract key ideas, and organize everything into clean notes.",
    image: "/works/ai-processing.png",
    alt: "AI processing illustration",
  },
  {
    id: 3,
    title: "Get study tools",
    description:
      "Create summaries, flashcards, quizzes, and key takeaways from your content.",
    image: "/works/study.png",
    alt: "Study tools illustration",
  },
  {
    id: 4,
    title: "Study Effortlessly",
    description:
      "Review anywhere, share with classmates, and prep faster for exams.",
    image: "/works/improve.png",
    alt: "Study and improve illustration",
  },
];

export function HowItWorks() {
  return (
    <section className="border-b border-border bg-background py-16 md:py-24">
      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-6xl">
          How it works
        </h2>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground md:text-xl">
          Turn any PDF, YouTube video, or audio into notes and study tools in
          minutes.
        </p>
      </div>

      <div className="relative mx-auto mt-10 max-w-7xl px-4">
        {/* Connecting line behind cards on large screens */}
        <div className="pointer-events-none absolute inset-x-[6%] top-16 hidden h-px bg-border/70 lg:block" />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <article
              key={step.id}
              className="relative flex h-full flex-col rounded-xl border border-border/70 bg-card/90 px-5 py-6 text-left shadow-sm backdrop-blur-sm"
            >
              <div className=" flex justify-center">
                <Image
                  src={step.image}
                  alt={step.alt}
                  width={325}
                  height={325}
                  className="h-48 w-48 object-contain md:h-52 md:w-52"
                />
              </div>

              <h3 className="text-lg font-medium text-foreground md:text-3xl">
                <span className="text-amber-500">{step.id}.</span> {step.title}
              </h3>
              <p className="mt-2 text-lg leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </article>
          ))}
        </div>

        <p className="mt-10 text-center text-xl font-semibold text-muted-foreground">
          Upload once. <span className="text-foreground">Study smarter.</span>
        </p>
      </div>
    </section>
  );
}
