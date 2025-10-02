import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)', 
  '/sign-up(.*)',
  '/api/webhooks/clerk', // Clerk webhook endpoint
])

const isProtectedApiRoute = createRouteMatcher([
  '/api/course/(.*)',
  '/api/chatbot',
])

const isAuthRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()
  const pathname = req.nextUrl.pathname
  
  // If user is authenticated and visiting auth pages, redirect to dashboard
  if (userId && isAuthRoute(req)) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  
  // If user is authenticated and visiting home page, redirect to dashboard
  // Add a check to prevent redirect loops
  if (userId && pathname === '/' && !req.nextUrl.searchParams.has('stay')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  
  // Protect API routes that require authentication
  if (isProtectedApiRoute(req)) {
    await auth.protect()
  }
  
  // Protect non-public routes
  if (!isPublicRoute(req)) {
    await auth.protect()
  }

  // Add security headers to all responses
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN') // Allow same-origin framing for YouTube embeds
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Content Security Policy for additional XSS protection - updated to allow YouTube iframe API, Clerk, and UploadThing
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' " +
      "https://clerk.com https://*.clerk.accounts.dev https://*.clerk.dev " +
      "https://challenges.cloudflare.com https://static.cloudflareinsights.com " +
      "https://www.youtube.com https://s.ytimg.com https://www.youtube.com/iframe_api; " +
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
      "https://api.elevenlabs.io; " + // ElevenLabs TTS API
    "media-src 'self' " +
      "https://utfs.io " + // UploadThing media files
      "blob: data:; " + // Allow blob URLs for audio playback
    "frame-src 'self' " +
      "https://www.youtube.com https://www.youtube-nocookie.com " +
      "https://clerk.com https://*.clerk.accounts.dev " +
      "https://challenges.cloudflare.com; " +
    "worker-src blob:; " +
    "child-src blob:;"
  )

  return response
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};