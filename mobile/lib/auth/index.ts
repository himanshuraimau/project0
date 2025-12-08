// Auth client exports
export { authClient, signIn, signUp, signOut, useSession } from './auth-client';

// Auth token provider type
export type TokenProvider = () => Promise<string | null>;

// Global token provider that can be set by components using hooks
let globalTokenProvider: TokenProvider | null = null;

export const setTokenProvider = (provider: TokenProvider) => {
  console.log('🔧 Setting global token provider');
  globalTokenProvider = provider;
};

export const getToken = async (): Promise<string | null> => {
  if (!globalTokenProvider) {
    console.warn('⚠️ No token provider set. Call setTokenProvider first.');
    return null;
  }
  return globalTokenProvider();
};
