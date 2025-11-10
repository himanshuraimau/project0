import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';

const useRedirectMiddleware = () => {
  const router = useRouter();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn) {
      router.replace('/(drawer)/(home)');
    }
  }, [isSignedIn, router]);
};

export default useRedirectMiddleware;