import type { ReactNode } from "react";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://flinote.ai";

export interface ArticleSchemaOptions {
  headline: string;
  description: string;
  image?: string;
  author: { name: string; url?: string };
  datePublished: string;
  dateModified?: string;
  articleUrl: string;
}

export function renderArticleSchema({
  headline,
  description,
  image,
  author,
  datePublished,
  dateModified,
  articleUrl,
}: ArticleSchemaOptions): ReactNode {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline,
    description,
    ...(image && { image: image.startsWith("http") ? image : `${baseUrl}${image.startsWith("/") ? image : `/${image}`}` }),
    author: {
      "@type": "Person",
      name: author.name,
      ...(author.url && { url: author.url.startsWith("http") ? author.url : `${baseUrl}${author.url}` }),
    },
    publisher: {
      "@type": "Organization",
      name: "Flinote",
      url: baseUrl,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.png`,
      },
    },
    datePublished,
    ...(dateModified && { dateModified }),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl.startsWith("http") ? articleUrl : `${baseUrl}${articleUrl.startsWith("/") ? articleUrl : `/${articleUrl}`}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
