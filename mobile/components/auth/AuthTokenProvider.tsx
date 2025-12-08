import { useSession, authClient } from '@/lib/auth/auth-client';
import { setTokenProvider } from '@/lib/api/client';
import { useEffect } from 'react';

export const AuthTokenProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();

  useEffect(() => {
    console.log('🔧 Setting up Better Auth token provider');
    console.log('🔐 User signed in:', !!session?.user);
    
    const tokenProvider = async () => {
      try {
        if (!session?.user) {
          console.log('❌ No active session');
          return null;
        }
        
        // Get session cookies to send with API requests
        console.log('🔐 Getting Better Auth session cookies...');
        const cookies = authClient.getCookie();
        
        if (cookies) {
          console.log('✅ Session cookies available:', cookies.substring(0, 50) + '...');
          return cookies;
        } else {
          console.log('⚠️ User signed in but no cookies available');
          return null;
        }
      } catch (error) {
        console.error('❌ Error getting session cookies:', error);
        return null;
      }
    };

    console.log('🔧 Setting global token provider');
    setTokenProvider(tokenProvider);
  }, [session]);

  return <>{children}</>;
};
