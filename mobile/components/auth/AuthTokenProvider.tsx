import { useAuth } from '@clerk/clerk-expo';
import { setTokenProvider } from '@/lib/auth';
import { useEffect } from 'react';

export const AuthTokenProvider = ({ children }: { children: React.ReactNode }) => {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    console.log('🔧 Setting up Clerk token provider');
    console.log('🔐 User signed in:', isSignedIn);
    
    const tokenProvider = async () => {
      try {
        if (!isSignedIn) {
          console.log('❌ User not signed in, no token available');
          return null;
        }
        
        console.log('🔐 Getting Clerk token...');
        const token = await getToken();
        console.log('✅ Clerk token:', token ? `${token.substring(0, 20)}...` : 'null');
        return token;
      } catch (error) {
        console.error('❌ Error getting Clerk token:', error);
        return null;
      }
    };

    setTokenProvider(tokenProvider);
  }, [getToken, isSignedIn]);

  return <>{children}</>;
};