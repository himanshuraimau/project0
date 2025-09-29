"use client";

import { useEffect } from 'react';

export function ClerkDebug() {
  useEffect(() => {
    console.log('Clerk Environment Variables:');
    console.log('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:', process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 20) + '...');
    console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    // Check if we're in development and log Clerk status
    if (process.env.NODE_ENV === 'development') {
      console.log('Running in development mode');
      
      // Check if Clerk is properly configured
      const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
      if (!publishableKey) {
        console.error('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing!');
      } else if (publishableKey.length < 50) {
        console.error('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY appears to be truncated!');
      }
    }
  }, []);

  return null;
}