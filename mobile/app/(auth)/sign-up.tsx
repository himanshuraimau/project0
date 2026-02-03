import { authStyles } from '@/components/auth/styles'
import { authClient } from '@/lib/auth/auth-client'
import { LinearGradient } from 'expo-linear-gradient'
import { Link } from 'expo-router'
import * as React from 'react'
import { Pressable, Text, View } from 'react-native'

export default function SignUpScreen() {
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false)

  const handleGoogleSignUp = React.useCallback(async () => {
    setIsGoogleLoading(true)
    try {
      console.log('🔵 Starting Google OAuth sign-up...')
      
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/(home)',
      })
      
      console.log('✅ Google OAuth completed')
      // The home layout will check onboarding status and redirect accordingly
    } catch (err: any) {
      console.error('❌ Google OAuth sign-up error:', err)
      alert(err?.message || 'Sign up failed. Please try again.')
    } finally {
      setIsGoogleLoading(false)
    }
  }, [])

  return (
    <LinearGradient
      colors={['#F5F4FF', '#FFFFFF']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={authStyles.container}
    >
      <View style={authStyles.contentWrapper}>
        {/* Header */}
        <View style={authStyles.headerSection}>
          <Text style={authStyles.subHeading}>Join us!</Text>
          <Text style={authStyles.mainHeading}>Create your account</Text>
        </View>

        {/* Social Button */}
        <View style={authStyles.socialButtonWrapper}>
          <Pressable
            style={[authStyles.socialButton, { opacity: isGoogleLoading ? 0.6 : 1 }]}
            onPress={handleGoogleSignUp}
            disabled={isGoogleLoading}
          >
            <Text style={authStyles.socialButtonText}>
              {isGoogleLoading ? 'Signing up...' : 'Continue with Google'}
            </Text>
          </Pressable>
        </View>

        {/* Footer Link */}
        <View style={authStyles.footerContainer}>
          <Text style={authStyles.footerText}>Already have an account?</Text>
          <Link href="/sign-in" asChild>
            <Pressable>
              <Text style={authStyles.footerLink}>Sign in</Text>
            </Pressable>
          </Link>
        </View>

        {/* Better Auth Branding */}
        <View style={authStyles.clerkBranding}>
          <Text style={authStyles.clerkText}>Secured by Better Auth</Text>
        </View>
      </View>
    </LinearGradient>
  )
}