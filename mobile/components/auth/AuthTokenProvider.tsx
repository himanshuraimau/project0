import { useSession, authClient } from '@/lib/auth/auth-client';
import { setTokenProvider } from '@/lib/api/client';
import { useEffect } from 'react';

export const AuthTokenProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();

  useEffect(() => {
    const tokenProvider = async () => {
      try {
        if (!session?.user) {
          return null;
        }
        
        // Get session cookies to send with API requests
        const cookies = authClient.getCookie();
        
        if (cookies) {
          return cookies;
        } else {
          return null;
        }
      } catch (error) {
        console.error('❌ Error getting session cookies:', error);
        return null;
      }
    };

    setTokenProvider(tokenProvider);
  }, [session]);

  return <>{children}</>;
};
