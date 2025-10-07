// Subscription Badge Component - Shows subscription status in navigation

'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown, Loader2 } from 'lucide-react';
import Link from 'next/link';

export function SubscriptionBadge() {
  const [status, setStatus] = useState<{
    hasAccess: boolean;
    isTrial: boolean;
    daysRemaining: number | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/subscription/status');
      const data = await response.json();
      
      setStatus({
        hasAccess: data.access?.hasAccess || false,
        isTrial: data.access?.isTrial || false,
        daysRemaining: data.access?.daysRemaining || null,
      });
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!status?.hasAccess) {
    return (
      <Link href="/dashboard">
        <Badge variant="outline" className="cursor-pointer hover:bg-accent">
          Subscribe
        </Badge>
      </Link>
    );
  }

  if (status.isTrial && status.daysRemaining !== null) {
    return (
      <Link href="/dashboard">
        <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
          <Crown className="h-3 w-3 mr-1" />
          Trial ({status.daysRemaining}d)
        </Badge>
      </Link>
    );
  }

  return (
    <Link href="/dashboard">
      <Badge variant="default" className="cursor-pointer hover:bg-primary/80">
        <Crown className="h-3 w-3 mr-1" />
        Pro
      </Badge>
    </Link>
  );
}
