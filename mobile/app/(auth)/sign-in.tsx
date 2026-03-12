import { authClient } from '@/lib/auth/auth-client'
import { AuthScreenShell } from '@/components/auth/AuthScreenShell'
import * as WebBrowser from 'expo-web-browser'
import React, { useCallback, useEffect, useState } from 'react'
import { Alert, Text } from 'react-native'

WebBrowser.maybeCompleteAuthSession()

function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError && err.message === 'Network request failed') return true
  const m = err && typeof err === 'object' && 'message' in err && (err as Error).message
  return typeof m === 'string' && m.includes('Network request failed')
}

export default function SignInScreen() {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    void WebBrowser.warmUpAsync()
    return () => {
      void WebBrowser.coolDownAsync()
    }
  }, [])

  const handleGoogleSignIn = useCallback(async () => {
    setLoading(true)
    try {
      const response = await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/(home)',
      })
      if (response.data && !response.error) {
        // Navigation handled by auth layout
      } else {
        console.error('OAuth failed', response.error)
        Alert.alert('Sign in failed', response.error?.message ?? 'Something went wrong. Try again.')
      }
    } catch (err) {
      console.error('Google OAuth error', err)
      if (isNetworkError(err)) {
        Alert.alert(
          'Connection problem',
          'Could not reach the server. Check your internet connection and try again. If you use a custom backend, ensure EXPO_PUBLIC_API_URL in .env is correct and reachable from this device.'
        )
      } else {
        Alert.alert('Something went wrong', (err as Error)?.message ?? 'Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <AuthScreenShell
      title="Welcome back"
      subtitle="Sign in to continue to your notes and meetings."
      googleButtonLabel="Continue with Google"
      onGooglePress={handleGoogleSignIn}
      footerPrompt="Don't have an account yet?"
      footerLinkLabel="Register one here"
      footerLinkHref="/(auth)/sign-up"
      loading={loading}
    />
  )
}
