'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Router component that handles backward compatibility for course creation
 * Redirects to wizard by default unless manual mode is explicitly requested
 */
export function CourseCreationRouter() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const mode = searchParams?.get('mode');
    
    // If no mode is specified, redirect to wizard (new default behavior)
    if (!mode) {
      router.replace('/dashboard/create/wizard');
    }
    // If mode=manual, stay on current page to show manual form
    // This maintains backward compatibility for any existing links
  }, [searchParams, router]);

  const mode = searchParams?.get('mode');
  
  // Don't render anything while redirecting
  if (!mode) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting to AI Course Wizard...</p>
        </div>
      </div>
    );
  }

  return null;
}