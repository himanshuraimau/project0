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
        // Always try to get token, even if isSignedIn is false
        // This helps with timing issues after OAuth
        console.log('🔐 Getting Clerk token...');
        const token = await getToken();
        
        if (token) {
          console.log('✅ Clerk token:', `${token.substring(0, 20)}...`);
        } else if (isSignedIn) {
          console.log('⚠️ User signed in but no token - session may be syncing');
        } else {
          console.log('❌ User not signed in, no token available');
        }
        
        return token;
      } catch (error) {
        console.error('❌ Error getting Clerk token:', error);
        // If user should be signed in but token fetch fails, return null
        // This will trigger a 401 which can help debug the issue
        return null;
      }
    };

    console.log('🔧 Setting global token provider');
    setTokenProvider(tokenProvider);
  }, [getToken, isSignedIn]);

  return <>{children}</>;
};