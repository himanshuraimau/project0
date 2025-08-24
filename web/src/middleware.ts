import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)', 
  '/sign-up(.*)',
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
  
  // If user is authenticated and visiting auth pages or home, redirect to dashboard
  if (userId && (isAuthRoute(req) || req.nextUrl.pathname === '/')) {
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
  
  // Content Security Policy for additional XSS protection - updated to allow YouTube
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com https://*.clerk.accounts.dev; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: https://img.youtube.com https://i.ytimg.com; font-src 'self' data:; connect-src 'self' https://api.clerk.com https://*.clerk.accounts.dev https://clerk.com; frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com;"
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