'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface FreeTierStatus {
  used: number;
  limit: number;
  remaining: number;
}

export function FreeTierWarning() {
  const [status, setStatus] = useState<FreeTierStatus | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const router = useRouter();

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

  // Only show warning when near or at limit
  if (!isLimitReached && !isNearLimit) {
    return null;
  }

  return (
    <Alert variant={isLimitReached ? "destructive" : "default"} className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>
        {isLimitReached ? 'Free Tier Limit Reached' : 'Almost at Free Tier Limit'}
      </AlertTitle>
      <AlertDescription className="mt-2">
        {isLimitReached ? (
          <p className="mb-3">
            You've used all {status.limit} free notes. Upgrade to Pro for unlimited notes and features.
          </p>
        ) : (
          <p className="mb-3">
            You have {status.remaining} free note{status.remaining !== 1 ? 's' : ''} remaining out of {status.limit}. 
            Upgrade to Pro for unlimited access.
          </p>
        )}
        <Button 
          onClick={() => router.push('/pricing')}
          size="sm"
          className="mt-2"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Upgrade to Pro
        </Button>
      </AlertDescription>
    </Alert>
  );
}
