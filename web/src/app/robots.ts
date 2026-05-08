import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://flinote.ai";

const privateRoutes = [
  "/api/",
  "/dashboard/",
  "/notes/",
  "/settings/",
  "/onboarding/",
  "/customer-portal",
  "/success",
  "/share/",
  "/mobile-checkout",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: privateRoutes,
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: privateRoutes,
      },
      // Explicitly allow AI crawlers for GEO visibility
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: privateRoutes,
      },
      {
        userAgent: "ChatGPT-User",
        allow: "/",
        disallow: privateRoutes,
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: privateRoutes,
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: privateRoutes,
      },
      {
        userAgent: "Applebot-Extended",
        allow: "/",
        disallow: privateRoutes,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
