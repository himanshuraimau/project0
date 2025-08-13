"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { CrownIcon } from 'lucide-react';
import Link from 'next/link';

export function UpgradeCreditButton({ 
  className, 
  compact = false 
}: { 
  className?: string; 
  compact?: boolean;
}) {
  if (compact) {
    return (
      <Link href="/pricing">
        <Button 
          variant="ghost" 
          size="sm" 
          className={`w-full flex items-center justify-center gap-1 text-xs ${className}`}
        >
          <CrownIcon className="h-3 w-3 text-amber-500" />
          <span>Upgrade</span>
        </Button>
      </Link>
    );
  }

  return (
    <Link href="/pricing">
      <Button 
        variant="outline" 
        size="sm" 
        className={`w-full flex items-center gap-2 ${className}`}
      >
        <CrownIcon className="h-4 w-4 text-amber-500" />
        <span>Upgrade to Pro</span>
      </Button>
    </Link>
  );
}
