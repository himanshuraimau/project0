"use client";

import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "I'm doing 2x less work, but getting better grades. My professor thought I had a tutor. Nope, it's Flinote.",
    name: "Jamie",
    affiliation: "University of Michigan",
  },
  {
    quote:
      "I show this app to a lot of my peers. It's a game-changer for managing study materials. The quizzes are awesome!",
    name: "Emery",
    affiliation: "Cornell and NYU alum",
  },
  {
    quote:
      "The AI-generated flashcards from my lecture notes are insanely good. Wish I had this during undergrad.",
    name: "Jordan",
    affiliation: "Johns Hopkins Grad",
  },
  {
    quote:
      "I honestly could not believe I got a B+ on my Bio exam! I really appreciate the makers of this app. Incredible!",
    name: "Sam",
    affiliation: "Pre-med student",
  },
  {
    quote:
      "I recently got a 97 on my Chem exam. Flinote made studying almost fun? Wild. 10/10 would recommend.",
    name: "Riley",
    affiliation: "UC Berkeley",
  },
  {
    quote:
      "I went from struggling to absolutely acing it. My study sessions cut in half. Thank you Flinote team!",
    name: "Casey",
    affiliation: "Stanford",
  },
];

export function Testimonials() {
  return (
    <section className="border-b border-border bg-background py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="text-center text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-[2.5rem]">
          Reviews from the{" "}
          <span
            className="bg-clip-text"
            style={{
              backgroundImage:
                "linear-gradient(to right, hsl(var(--primary)), oklch(0.55 0.2 260))",
            }}
          >
            Customers
          </span>
        </h2>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {testimonials.map(({ quote, name, affiliation }) => (
            <article
              key={name + affiliation}
              className="flex flex-col rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-shadow hover:shadow-md md:p-7"
            >
              <div className="mb-4 flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-amber-400 text-amber-400"
                    aria-hidden
                  />
                ))}
              </div>
              <blockquote className="flex-1 text-[15px] leading-relaxed text-foreground/90 md:text-base">
                &ldquo;{quote}&rdquo;
              </blockquote>
              <footer className="mt-5 border-t border-border/50 pt-4">
                <p className="font-semibold text-foreground">{name}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {affiliation}
                </p>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
