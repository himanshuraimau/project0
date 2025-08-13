'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CrownIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UpgradeButtonProps {
  className?: string;
}

export function UpgradeToProButton({ className }: UpgradeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleUpgrade = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        alert('Successfully upgraded to Pro! You now have unlimited notes.');
        
        // Refresh the page to update UI
        router.refresh();
      } else {
        const error = await response.json();
        alert(`Failed to upgrade: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error upgrading to Pro:', error);
      alert('An error occurred while upgrading to Pro. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Button 
      onClick={handleUpgrade}
      className={`bg-amber-500 hover:bg-amber-600 text-white ${className}`}
      disabled={isLoading}
    >
      <CrownIcon className="mr-2 h-4 w-4" />
      {isLoading ? 'Upgrading...' : 'Upgrade to Pro'}
    </Button>
  );
}
