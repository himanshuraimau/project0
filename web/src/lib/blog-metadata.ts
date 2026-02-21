import type { Metadata } from "next";

export const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://flinote.ai";
const appName = "Flinote";

export interface GetMetadataOptions {
  path: string;
  title: string;
  description: string;
  image?: string | { src: string; width?: number; height?: number };
  ogType?: "website" | "article";
}

export function getMetadata({
  path,
  title,
  description,
  image,
  ogType = "website",
}: GetMetadataOptions): Metadata {
  const canonical = path.startsWith("http") ? path : `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const imageUrl =
    typeof image === "string"
      ? image.startsWith("http")
        ? image
        : `${baseUrl}${image.startsWith("/") ? image : `/${image}`}`
      : image
        ? `${baseUrl}${image.src.startsWith("/") ? image.src : `/${image.src}`}`
        : undefined;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: ogType,
      url: canonical,
      title,
      description,
      siteName: appName,
      ...(imageUrl && {
        images: [
          {
            url: imageUrl,
            width: typeof image === "object" && image?.width ? image.width : 1200,
            height: typeof image === "object" && image?.height ? image.height : 630,
            alt: title,
          },
        ],
      }),
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(imageUrl && { images: [imageUrl] }),
    },
    robots: { index: true, follow: true },
  };
}
