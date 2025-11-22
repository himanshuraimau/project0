'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import Link from 'next/link';

interface FreeTierStatus {
  used: number;
  limit: number;
  remaining: number;
}

export function FreeTierBadge() {
  const [status, setStatus] = useState<FreeTierStatus | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/subscription/status');
      const data = await response.json();
      
      setHasSubscription(data.hasSubscription && data.access?.hasAccess);
      
      if (data.features?.freeNotes) {
        setStatus(data.features.freeNotes);
      }
    } catch (error) {
      console.error('Error fetching free tier status:', error);
    }
  };

  // Don't show if user has subscription
  if (hasSubscription) {
    return null;
  }

  // Don't show if status not loaded
  if (!status) {
    return null;
  }

  const isLimitReached = status.remaining === 0;
  const isNearLimit = status.remaining <= 1 && status.remaining > 0;

  return (
    <Link href="/pricing">
      <Badge 
        variant={isLimitReached ? "destructive" : isNearLimit ? "secondary" : "outline"}
        className="cursor-pointer hover:opacity-80 transition-opacity"
      >
        <FileText className="h-3 w-3 mr-1" />
        {status.used}/{status.limit} Free Notes
      </Badge>
    </Link>
  );
}
