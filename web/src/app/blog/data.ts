import type { StaticImageData } from "next/image";

export const BLOG_CATEGORIES = ["Insights", "Interview Questions"] as const;
export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export interface Author {
  name: string;
  bio: string;
  description: string;
  link: string;
  image: StaticImageData;
}

export type Authors = Record<string, Author>;

export interface Blog {
  title: string;
  slug: string;
  category: BlogCategory;
  author: string;
  publishedOn: string;
  image: StaticImageData;
}

// Author placeholder image: use a default avatar or add real images under src/app/blog/authors/
// For now we use a data URI or require a placeholder; Next.js Image needs StaticImageData.
// You can add author images to public/ and reference via import or use a shared placeholder.
const defaultAuthorImage = {
  src: "/logo.png",
  height: 40,
  width: 40,
  blurDataURL: "",
} as StaticImageData;

export const authors: Authors = {
  darshil: {
    name: "Darshil",
    bio: "Product & Engineering",
    description: "Building Flinote.",
    link: "/blog",
    image: defaultAuthorImage,
  },
  khushbu: {
    name: "Khushbu",
    bio: "Content & Learning",
    description: "Creating study resources.",
    link: "/blog",
    image: defaultAuthorImage,
  },
};

// Cover images: add cover.jpg or cover.png in each post folder and import here.
// Placeholder: use a fallback until you add real cover images.
const defaultCoverImage = {
  src: "/logo.png",
  height: 630,
  width: 1200,
  blurDataURL: "",
} as StaticImageData;

// Import cover from post folder when you add the file, e.g.:
// import DataEngineeringCover from "@/app/blog/data-engineering-roadmap-2026/cover.jpg";
// For the first post we use the default until you add app/blog/data-engineering-roadmap-2026/cover.jpg
export const blogs: Blog[] = [
  {
    title: "Study Tips for 2026",
    slug: "study-tips-2026",
    category: "Insights",
    author: "khushbu",
    publishedOn: "12 Feb 2026",
    image: defaultCoverImage,
  },
  {
    title: "Data Engineering Roadmap 2026",
    slug: "data-engineering-roadmap-2026",
    category: "Insights",
    author: "darshil",
    publishedOn: "5 Feb 2026",
    image: defaultCoverImage,
  },
];
