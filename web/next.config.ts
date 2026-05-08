import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  trailingSlash: false,
  turbopack: {
    root: process.cwd(),
  },
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  // output: "standalone", 
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb", 
    },
    proxyClientMaxBodySize: "100mb", 
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s3.us-west-2.amazonaws.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.s3.**.amazonaws.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatar.vercel.sh",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "s.ytimg.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
        port: "",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              process.env.NODE_ENV === "development"
                ? "default-src 'self'; " +
                  "script-src 'self' 'unsafe-inline' 'unsafe-eval' " +
                  "https://clerk.com https://*.clerk.accounts.dev https://*.clerk.dev " +
                  "https://challenges.cloudflare.com https://static.cloudflareinsights.com " +
                  "https://vercel.live " +
                  "https://www.youtube.com https://s.ytimg.com https://www.youtube.com/iframe_api " +
                  "https://cdn.paddle.com " +
                  "http://localhost:* ws://localhost:*; " + // Allow dev server
                  "style-src 'self' 'unsafe-inline' " +
                  "https://clerk.com https://*.clerk.accounts.dev " +
                  "https://cdn.paddle.com https://sandbox-cdn.paddle.com; " +
                  "img-src 'self' data: https: " +
                  "https://img.youtube.com https://i.ytimg.com https://images.clerk.dev https://*.clerk.dev https://s.ytimg.com " +
                  "https://utfs.io; " + // UploadThing images
                  "font-src 'self' data: " +
                  "https://clerk.com https://*.clerk.accounts.dev; " +
                  "connect-src 'self' " +
                  "https://api.clerk.com https://*.clerk.accounts.dev https://clerk.com https://*.clerk.dev " +
                  "https://challenges.cloudflare.com https://cloudflareinsights.com " +
                  "https://vercel.live " +
                  "https://www.youtube.com https://s.ytimg.com " +
                  "https://utfs.io https://api.uploadthing.com " + // UploadThing API
                  "https://*.paddle.com " + // Paddle API
                  "https://*.amazonaws.com " + // AWS S3 buckets for audio uploads
                  "https://*.pusher.com wss://*.pusher.com " + // Pusher real-time updates
                  "ws://localhost:* http://localhost:*; " + // Allow dev server websockets
                  "media-src 'self' " +
                  "https://utfs.io " + // UploadThing media files
                  "https://*.amazonaws.com " + // AWS S3 buckets (all regions and formats)
                  "blob: data:; " + // Allow blob URLs for audio playback
                  "frame-src 'self' " +
                  "https://www.youtube.com https://www.youtube-nocookie.com " +
                  "https://clerk.com https://*.clerk.accounts.dev " +
                  "https://challenges.cloudflare.com " +
                  "https://*.paddle.com; " + // Paddle checkout overlay
                  "worker-src blob:; " +
                  "child-src blob:;"
                : "default-src 'self'; " +
                  "script-src 'self' 'unsafe-inline' 'unsafe-eval' " +
                  "https://clerk.com https://*.clerk.accounts.dev https://*.clerk.dev " +
                  "https://challenges.cloudflare.com https://static.cloudflareinsights.com " +
                  "https://vercel.live https://va.vercel-scripts.com " +
                  "https://www.youtube.com https://s.ytimg.com " +
                  "https://cdn.paddle.com https://sandbox-cdn.paddle.com; " +
                  "style-src 'self' 'unsafe-inline' " +
                  "https://clerk.com https://*.clerk.accounts.dev " +
                  "https://cdn.paddle.com https://sandbox-cdn.paddle.com; " +
                  "img-src 'self' data: https: " +
                  "https://utfs.io; " +
                  "font-src 'self' data: " +
                  "https://clerk.com https://*.clerk.accounts.dev; " +
                  "connect-src 'self' " +
                  "https://api.clerk.com https://*.clerk.accounts.dev https://clerk.com https://*.clerk.dev " +
                  "https://challenges.cloudflare.com https://cloudflareinsights.com " +
                  "https://vercel.live https://va.vercel-scripts.com " +
                  "https://www.youtube.com https://s.ytimg.com " +
                  "https://utfs.io https://api.uploadthing.com " +
                  "https://*.paddle.com " +
                  "https://*.amazonaws.com " +
                  "https://*.pusher.com wss://*.pusher.com; " +
                  "media-src 'self' https://utfs.io https://*.amazonaws.com blob: data:; " +
                  "frame-src 'self' " +
                  "https://www.youtube.com https://www.youtube-nocookie.com " +
                  "https://clerk.com https://*.clerk.accounts.dev " +
                  "https://challenges.cloudflare.com " +
                  "https://*.paddle.com; " +
                  "worker-src blob:; " +
                  "child-src blob:;"
          },
        ],
      },
    ];
  },
};

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
});

export default withMDX(nextConfig);
