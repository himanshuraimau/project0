import { AuthScreenShell } from '@/components/auth/AuthScreenShell'
import { maybeCompleteAuthSessionOnce, signInWithGoogleSingleFlight } from '@/lib/auth/social-google'
import { signInWithAppleSingleFlight } from '@/lib/auth/social-apple'
import Constants from 'expo-constants'
import { useRouter } from 'expo-router'
import * as ExpoLinking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import React, { useCallback, useEffect, useState } from 'react'
import { Alert, Linking, Text } from 'react-native'
import { useTheme } from '@/lib/hooks/useTheme'

maybeCompleteAuthSessionOnce()
const APP_SCHEME = (process.env.EXPO_PUBLIC_APP_SCHEME || 'flinote').toLowerCase()
const IS_EXPO_GO = Constants.appOwnership === 'expo'
// Redirect to an existing app route so Expo Router can resolve it reliably.
const MOBILE_AUTH_CALLBACK_URL = IS_EXPO_GO
  ? ExpoLinking.createURL('/sign-in')
  : ExpoLinking.createURL('/sign-in', { scheme: APP_SCHEME })

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
  const router = useRouter()

  useEffect(() => {
    void WebBrowser.warmUpAsync()
    return () => {
      void WebBrowser.coolDownAsync()
    }
  }, [])

  const handleGoogleSignUp = useCallback(async () => {
    setLoading(true)
    try {
      const result = await signInWithGoogleSingleFlight(MOBILE_AUTH_CALLBACK_URL)
      if (result.skipped) {
        return
      }
      const response = result.response
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

  const handleAppleSignUp = useCallback(async () => {
    setLoading(true)
    try {
      const result = await signInWithAppleSingleFlight(MOBILE_AUTH_CALLBACK_URL)
      if (result.skipped) {
        return
      }
      const response = result.response
      if (response.data && !response.error) {
        // The native flow resolves the session directly with no deep-link redirect,
        // so don't rely solely on the auth layout's reactive session watch to fire.
        router.replace('/(home)' as any)
      } else {
        console.error('Apple OAuth failed', response.error)
        Alert.alert('Sign up failed', response.error?.message ?? 'Something went wrong. Try again.')
      }
    } catch (err) {
      console.error('Apple OAuth error', err)
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
      appleButtonLabel="Continue with Apple"
      onApplePress={handleAppleSignUp}
      footerPrompt="Already have an account?"
      footerLinkLabel="Sign in"
      footerLinkHref="/(auth)/sign-in"
      footerExtra={footerExtra}
      loading={loading}
    />
  )
}
