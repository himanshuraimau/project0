import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow ngrok domain for development
  allowedDevOrigins: [
    'binate-nonperceptively-celestina.ngrok-free.dev'
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's3.us-west-2.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's.ytimg.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'development'
              ? "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' " +
              "https://clerk.com https://*.clerk.accounts.dev https://*.clerk.dev " +
              "https://challenges.cloudflare.com https://static.cloudflareinsights.com " +
              "https://www.youtube.com https://s.ytimg.com https://www.youtube.com/iframe_api " +
              "http://localhost:* ws://localhost:*; " + // Allow dev server
              "style-src 'self' 'unsafe-inline' " +
              "https://clerk.com https://*.clerk.accounts.dev; " +
              "img-src 'self' data: https: " +
              "https://img.youtube.com https://i.ytimg.com https://images.clerk.dev https://*.clerk.dev https://s.ytimg.com " +
              "https://utfs.io; " + // UploadThing images
              "font-src 'self' data: " +
              "https://clerk.com https://*.clerk.accounts.dev; " +
              "connect-src 'self' " +
              "https://api.clerk.com https://*.clerk.accounts.dev https://clerk.com https://*.clerk.dev " +
              "https://challenges.cloudflare.com https://cloudflareinsights.com " +
              "https://www.youtube.com https://s.ytimg.com " +
              "https://utfs.io https://api.uploadthing.com " + // UploadThing API

              "ws://localhost:* http://localhost:*; " + // Allow dev server websockets
              "media-src 'self' " +
              "https://utfs.io " + // UploadThing media files
              "blob: data:; " + // Allow blob URLs for audio playback
              "frame-src 'self' " +
              "https://www.youtube.com https://www.youtube-nocookie.com " +
              "https://clerk.com https://*.clerk.accounts.dev " +
              "https://challenges.cloudflare.com; " +
              "worker-src blob:; " +
              "child-src blob:;"
              : "" // Production CSP handled by middleware
          }
        ]
      }
    ]
  }
};

export default nextConfig;
