"use client";

import Image from "next/image";

const TOP_FEATURES = [
  {
    id: "record",
    title: "Record or upload",
    description: "Upload PDFs, links, audio, and more.",
    icon: "/bento-icons/Flinote MIc.png",
  },
  {
    id: "notes",
    title: "Get smart notes fast",
    description: "Clean, organized, and ready to study.",
    icon: "/bento-icons/Flinote Meeting notes.png",
  },
  {
    id: "Chat with notes",
    title: "Chat with notes",
    description: "Ask anything about your content.",
    icon: "/bento-icons/Flinote AI Chat.png",
  },
];

type BentoFeature = {
  id: string;
  title: string;
  description: string;
  icon: string | null;
  iconLabel?: "devices" | "game";
  wide: boolean;
};

const BENTO_FEATURES: BentoFeature[] = [
  {
    id: "podcast",
    title: "AI Podcasts",
    description: "Flinote reads your notes like a short podcast.",
    icon: "/bento-icons/Flinote AI Podcast.png",
    wide: false,
  },

  {
    id: "languages",
    title: "Multiple Languages",
    description: "Study in your language",
    icon: "/bento-icons/Flinote Language.png",
    wide: false,
  },
  {
    id: "quiz",
    title: "Quizzes and flashcards",
    description: "Flinote makes flashcards and quizzes for you.",
    icon: "/bento-icons/Flinote Quiz and flashcard.png",
    wide: true,
  },
];

function BentoIconPlaceholder({ type }: { type: "devices" | "game" }) {
  return (
    <div
      className="flex h-[120px] w-full items-center justify-center rounded-2xl bg-muted/50 sm:h-[144px]"
      aria-hidden
    >
      {type === "devices" ? (
        <svg
          className="size-[4.25rem] text-muted-foreground sm:size-20"
          fill="none"
          viewBox="0 0 64 64"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="8" y="12" width="28" height="44" rx="4" />
          <rect x="28" y="8" width="36" height="24" rx="2" />
          <path d="M28 20h36M28 26h24" />
        </svg>
      ) : (
        <svg
          className="size-[4.25rem] text-muted-foreground sm:size-20"
          fill="none"
          viewBox="0 0 64 64"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="32" cy="40" r="12" />
          <path d="M32 28v-8M32 20a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V20z" />
          <path d="M28 16h8M26 12h12" />
        </svg>
      )}
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon,
  iconLabel,
  wide,
  className = "",
}: {
  title: string;
  description: string;
  icon: string | null;
  iconLabel?: "devices" | "game";
  wide?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow duration-300  ${className}`}
    >
      <div className="mb-4 flex min-h-[120px] items-center justify-center sm:min-h-[144px]">
        {icon ? (
          <div className="relative h-[120px] w-full max-w-[168px] sm:h-[144px] sm:max-w-[192px]">
            <Image
              src={icon}
              alt=""
              fill
              className="object-contain object-center"
              sizes="(max-width: 640px) 168px, 192px"
            />
          </div>
        ) : iconLabel ? (
          <BentoIconPlaceholder type={iconLabel} />
        ) : null}
      </div>
      <h3 className="text-center text-3xl font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mt-2 text-center text-lg leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

export const featureStepCards = [
  {
    step: "01",
    title: "Add your content",
    shortDescription: "Upload a PDF, paste a YouTube link, or type.",
  },
  {
    step: "02",
    title: "AI generates your note",
    shortDescription: "Our AI extracts key points, structure, and summaries.",
  },
  {
    step: "03",
    title: "Turn it into study material",
    shortDescription: "Generate flashcards, quizzes, mindmaps, and podcasts.",
  },
  {
    step: "04",
    title: "Study, chat, and track",
    shortDescription:
      "Review your flashcards, take quizzes, and chat with your note.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-background py-16 md:py-24 lg:py-20">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-12 mt-16 text-center md:mb-16 md:mt-12">
          <span className="inline-block rounded-lg bg-muted px-4 py-2 text-base font-medium text-muted-foreground">
            Features
          </span>
          <h2 className="mt-5 text-4xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-[3rem] md:leading-tight">
            Made for students and people who <br /> want to learn 10x better and
            faster
          </h2>
        </div>

        {/* Top row: 3 equal cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6 md:gap-8">
          {TOP_FEATURES.map((f) => (
            <FeatureCard
              key={f.id}
              title={f.title}
              description={f.description}
              icon={f.icon}
            />
          ))}
        </div>

        {/* Bento grid: 2 wide + 3 narrow */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:mt-8 sm:grid-cols-1 sm:gap-6 md:mt-10 md:gap-8">
          {BENTO_FEATURES.filter((f) => f.wide).map((f) => (
            <FeatureCard
              key={f.id}
              title={f.title}
              description={f.description}
              icon={f.icon}
              iconLabel={f.iconLabel}
              wide
            />
          ))}
        </div>
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 md:mt-6 md:gap-8">
          {BENTO_FEATURES.filter((f) => !f.wide).map((f) => (
            <FeatureCard
              key={f.id}
              title={f.title}
              description={f.description}
              icon={f.icon}
              iconLabel={f.iconLabel}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
