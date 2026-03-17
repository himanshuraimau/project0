export type BlogCategory = "Insights" | "Interview Questions";

export interface Blog {
  title: string;
  slug: string;
  category: BlogCategory;
  author: string;
  publishedOn: string;
  image: { src: string; height: number; width: number; blurDataURL?: string };
}

// All blog posts now come from the database (BlogPost table).
export const blogs: Blog[] = [];
