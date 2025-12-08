import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useSession } from '@/lib/auth';

const useRedirectMiddleware = () => {
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      router.replace('/(home)');
    }
  }, [session, router]);
};

export default useRedirectMiddleware;