import { NextResponse, NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const publicRoutes = [
  "/",
  "/blog", // Blog listing and posts are public (read without login)
  "/pricing",
  "/terms",
  "/privacy",
  "/credits",
  "/manifest.json",
  "/sign-in",
  "/sign-up",
  // SEO: must be public for Google Search Console (no redirect to sign-in)
  "/sitemap.xml",
  "/robots.txt",
  "/sitemap_index.xml",
  "/api/auth", // Better Auth endpoints
  "/api/health",
  "/api/webhooks", // Webhook endpoints (authenticated via secret header)
  "/api/notes",
  "/api/transcripts",
  "/api/documents",
  "/api/folders",
  "/api/audio",
  "/api/pdf",
  "/api/search",
  "/api/mindmap",
  "/api/webpage",
  "/api/user",
  "/api/subscription",
];

// Protected API routes that require explicit auth checking
const protectedApiRoutes = ["/api/course", "/api/chatbot", "/api/podcast"];

const authRoutes = ["/sign-in", "/sign-up"];

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

function isProtectedApiRoute(pathname: string): boolean {
  return protectedApiRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

function isAuthRoute(pathname: string): boolean {
  return authRoutes.some((route) => pathname.startsWith(route));
}

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Handle CORS preflight requests for API routes
  if (req.method === "OPTIONS" && pathname.startsWith("/api/")) {
    const response = new NextResponse(null, { status: 200 });
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With",
    );
    response.headers.set("Access-Control-Max-Age", "86400");
    return response;
  }

  // Check for session cookie (optimistic redirect)
  const sessionCookie = getSessionCookie(req, {
    cookiePrefix: "better-auth",
  });

  const isAuthenticated = !!sessionCookie;

  // If user is authenticated and visiting auth pages, redirect to dashboard
  if (isAuthenticated && isAuthRoute(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // If user is authenticated and visiting home page, redirect to dashboard
  if (
    isAuthenticated &&
    pathname === "/" &&
    !req.nextUrl.searchParams.has("stay")
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Protect routes that require authentication
  if (!isPublicRoute(pathname) && !isAuthenticated) {
    // For protected API routes, return 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // For protected pages, redirect to sign-in
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Add security headers to all responses
  const response = NextResponse.next();

  // Add CORS headers for API routes (for mobile app and other clients)
  if (pathname.startsWith("/api/")) {
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With",
    );
  }

  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(self), geolocation=()",
  );

  // Content Security Policy
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' " +
      "https://challenges.cloudflare.com https://static.cloudflareinsights.com " +
      "https://vercel.live " +
      "https://www.youtube.com https://s.ytimg.com https://www.youtube.com/iframe_api; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https: " +
      "https://img.youtube.com https://i.ytimg.com https://s.ytimg.com " +
      "https://utfs.io; " +
      "font-src 'self' data:; " +
      "connect-src 'self' " +
      "https://challenges.cloudflare.com https://cloudflareinsights.com " +
      "https://vercel.live " +
      "https://www.youtube.com https://s.ytimg.com " +
      "https://utfs.io https://api.uploadthing.com " +
      "https://*.amazonaws.com " + // AWS S3 buckets for audio uploads
      "https://*.pusher.com wss://*.pusher.com; " + // Pusher real-time updates
      "media-src 'self' " +
      "https://utfs.io " +
      "https://*.amazonaws.com " +
      "blob: data:; " +
      "frame-src 'self' " +
      "https://www.youtube.com https://www.youtube-nocookie.com " +
      "https://challenges.cloudflare.com; " +
      "worker-src blob:; " +
      "child-src blob:;",
  );

  return response;
}

export const config = {
  matcher: [
    // Skip Next.js internals, static files, and public SEO files (must be reachable without auth)
    "/((?!_next|sitemap\\.xml|robots\\.txt|sitemap_index\\.xml|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
