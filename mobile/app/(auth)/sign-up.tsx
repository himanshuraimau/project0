import { authClient } from '@/lib/auth/auth-client'
import { AuthScreenShell } from '@/components/auth/AuthScreenShell'
import * as WebBrowser from 'expo-web-browser'
import React, { useCallback, useEffect, useState } from 'react'
import { Alert, Linking, Text } from 'react-native'
import { useTheme } from '@/lib/hooks/useTheme'

WebBrowser.maybeCompleteAuthSession()

const TERMS_URL = 'https://flinote.ai/terms'
const PRIVACY_URL = 'https://flinote.ai/privacy'

function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError && err.message === 'Network request failed') return true
  const m = err && typeof err === 'object' && 'message' in err && (err as Error).message
  return typeof m === 'string' && m.includes('Network request failed')
}

export default function SignUpScreen() {
  const { theme } = useTheme()
  const c = theme.colors
  const t = theme.typography
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    void WebBrowser.warmUpAsync()
    return () => {
      void WebBrowser.coolDownAsync()
    }
  }, [])

  const handleGoogleSignUp = useCallback(async () => {
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
        Alert.alert('Sign up failed', response.error?.message ?? 'Something went wrong. Try again.')
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

  const footerExtra = (
    <Text
      style={{
        color: c.mutedForeground,
        fontSize: 13,
        lineHeight: 18,
        textAlign: 'center',
      }}
    >
      By signing up, you agree to our{' '}
      <Text
        style={{ color: c.primary, fontWeight: t.weightMedium }}
        onPress={() => Linking.openURL(TERMS_URL)}
      >
        Terms of Service
      </Text>
      {' and '}
      <Text
        style={{ color: c.primary, fontWeight: t.weightMedium }}
        onPress={() => Linking.openURL(PRIVACY_URL)}
      >
        Privacy Policy
      </Text>
      .
    </Text>
  )

  return (
    <AuthScreenShell
      title="Get started"
      subtitle="Create your account to start capturing and organizing your knowledge."
      googleButtonLabel="Continue with Google"
      onGooglePress={handleGoogleSignUp}
      footerPrompt="Already have an account?"
      footerLinkLabel="Sign in"
      footerLinkHref="/(auth)/sign-in"
      footerExtra={footerExtra}
      loading={loading}
    />
  )
}
