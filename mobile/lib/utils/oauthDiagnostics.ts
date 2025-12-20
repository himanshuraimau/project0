// Diagnostic utility for OAuth debugging
// Add this temporarily to your sign-in component to help with testing

import * as AuthSession from 'expo-auth-session'
import { Platform } from 'react-native'

export const logOAuthDiagnostics = () => {
  console.log('🔍 OAuth Diagnostics:')
  
  // Show both development and production redirect URLs
  const devRedirectUrl = AuthSession.makeRedirectUri({ scheme: undefined })
  const prodRedirectUrl = AuthSession.makeRedirectUri({ scheme: 'jellinote' })
  
  console.log('📱 Dev Redirect URL:', devRedirectUrl)
  console.log('📱 Prod Redirect URL:', prodRedirectUrl)
  console.log('🔧 __DEV__ mode:', __DEV__)
  console.log('🔧 AuthSession available:', !!AuthSession)
  console.log('📱 Platform:', Platform.OS)
  
  // Check current redirect URL format
  const currentRedirectUrl = __DEV__ ? devRedirectUrl : prodRedirectUrl
  console.log('🎯 Current redirect URL:', currentRedirectUrl)
  
  if (__DEV__ && !currentRedirectUrl.startsWith('exp://')) {
    console.warn('⚠️ Dev redirect URL format unexpected:', currentRedirectUrl)
  } else if (!__DEV__ && !currentRedirectUrl.startsWith('jellinote://')) {
    console.warn('⚠️ Prod redirect URL format may be incorrect:', currentRedirectUrl)
  } else {
    console.log('✅ Redirect URL format is correct for current environment')
  }
}

// Call this function when the component mounts to check the setup
export default logOAuthDiagnostics