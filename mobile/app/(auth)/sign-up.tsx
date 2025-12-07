import { authStyles } from '@/components/auth/styles'
import { useSignUp, useSSO } from '@clerk/clerk-expo'
import { OAuthStrategy } from '@clerk/types'
import * as AuthSession from 'expo-auth-session'
import { LinearGradient } from 'expo-linear-gradient'
import { Link, useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import * as React from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { markOnboardingCompleted } from '@/lib/storage/onboardingStorage'

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()
  const { startSSOFlow } = useSSO()

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [pendingVerification, setPendingVerification] = React.useState(false)
  const [code, setCode] = React.useState('')
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false)

  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) return

    // Start sign-up process using email and password provided
    try {
      await signUp.create({
        emailAddress,
        password,
      })

      // Send user an email with verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })

      // Set 'pendingVerification' to true to display second form
      // and capture OTP code
      setPendingVerification(true)
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
    }
  }

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return

    try {
      // Use the code the user provided to attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      })

      // If verification was completed, set the session to active
      // and redirect the user to home
      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId })
        // Mark onboarding as completed for new users
        try {
          await markOnboardingCompleted()
        } catch (error) {
          console.error('Failed to mark onboarding complete:', error)
        }
        router.replace('/(home)' as any)
      } else {
        // If the status is not complete, check why. User may need to
        // complete further steps.
        console.error(JSON.stringify(signUpAttempt, null, 2))
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
    }
  }

  React.useEffect(() => {
    void WebBrowser.warmUpAsync()
    return () => {
      void WebBrowser.coolDownAsync()
    }
  }, [])
  WebBrowser.maybeCompleteAuthSession()

  const signUpWith = React.useCallback(
    async (strategy: OAuthStrategy) => {
      setIsGoogleLoading(true)
      try {
        console.log('🔵 [1/5] Starting Google OAuth sign-up flow...')
        
        // Create proper redirect URL for both dev and production
        const redirectUrl = __DEV__ 
          ? AuthSession.makeRedirectUri({ scheme: undefined }) // Use exp:// in dev
          : AuthSession.makeRedirectUri({ scheme: 'mobile' })   // Use mobile:// in production
        
        console.log('🔗 Using redirect URL:', redirectUrl)
        
        const result = await startSSOFlow({
          strategy,
          redirectUrl,
        })
        
        console.log('🔵 [2/5] OAuth sign-up flow returned:', {
          createdSessionId: result.createdSessionId ? `${result.createdSessionId.substring(0, 20)}...` : 'null',
          hasSetActive: !!result.setActive,
          strategy: strategy
        })

        if (result.createdSessionId) {
          console.log('🔵 [3/5] Session ID found, activating...')
          await result.setActive!({ session: result.createdSessionId })
          console.log('✅ [4/5] Session activated successfully!')
          
          // Mark onboarding as completed for OAuth sign-up users
          try {
            await markOnboardingCompleted()
            console.log('✅ Onboarding marked as completed')
          } catch (error) {
            console.error('Failed to mark onboarding complete:', error)
          }
          
          console.log('🔵 [5/5] Navigating to home...')
          router.replace('/(home)' as any)
        } else {
          console.warn('❌ No session ID returned from OAuth sign-up')
          alert('Could not complete sign up. Please try again.')
        }
      } catch (err: any) {
        console.error('❌ Google OAuth sign-up error:', err)
        console.error('❌ Error details:', JSON.stringify(err, null, 2))
        alert(err?.message || 'Sign up failed. Please try again.')
      } finally {
        setIsGoogleLoading(false)
      }
    },
    [router, startSSOFlow]
  )

  if (pendingVerification) {
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
            <Text style={authStyles.mainHeading}>Verify your email</Text>
            <Text style={authStyles.verificationDescription}>
              Enter the code sent to your email address
            </Text>
          </View>

          {/* Verification Code Input */}
          <View style={authStyles.inputContainer}>
            <TextInput
              value={code}
              placeholder="Verification code"
              placeholderTextColor="#A0A0A0"
              onChangeText={(value) => setCode(value)}
              style={authStyles.input}
              keyboardType="number-pad"
              autoCapitalize="none"
            />
          </View>

          {/* Primary Button */}
          <Pressable style={authStyles.primaryButton} onPress={onVerifyPress}>
            <Text style={authStyles.primaryButtonText}>Verify</Text>
          </Pressable>

          {/* Clerk Branding */}
          <View style={authStyles.clerkBranding}>
            <Text style={authStyles.clerkText}>Secured by Clerk</Text>
          </View>
        </View>
      </LinearGradient>
    )
  }

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
            onPress={() => signUpWith('oauth_google')}
            disabled={isGoogleLoading}
          >
            <Text style={authStyles.socialButtonText}>
              {isGoogleLoading ? 'Signing up...' : 'Continue with Google'}
            </Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View style={authStyles.dividerContainer}>
          <View style={authStyles.dividerLine} />
          <Text style={authStyles.dividerText}>or</Text>
          <View style={authStyles.dividerLine} />
        </View>

        {/* Email Input */}
        <View style={authStyles.inputContainer}>
          <TextInput
            autoCapitalize="none"
            value={emailAddress}
            placeholder="Email"
            placeholderTextColor="#A0A0A0"
            onChangeText={(value) => setEmailAddress(value)}
            style={authStyles.input}
          />
        </View>

        {/* Password Input */}
        <View style={authStyles.inputContainer}>
          <TextInput
            value={password}
            placeholder="Password"
            placeholderTextColor="#A0A0A0"
            secureTextEntry={true}
            onChangeText={(value) => setPassword(value)}
            style={authStyles.input}
          />
        </View>

        {/* Primary Button */}
        <Pressable style={authStyles.primaryButton} onPress={onSignUpPress}>
          <Text style={authStyles.primaryButtonText}>Continue</Text>
        </Pressable>

        {/* Footer Link */}
        <View style={authStyles.footerContainer}>
          <Text style={authStyles.footerText}>Already have an account?</Text>
          <Link href="/sign-in" asChild>
            <Pressable>
              <Text style={authStyles.footerLink}>Sign in</Text>
            </Pressable>
          </Link>
        </View>

        {/* Clerk Branding */}
        <View style={authStyles.clerkBranding}>
          <Text style={authStyles.clerkText}>Secured by Clerk</Text>
        </View>
      </View>
    </LinearGradient>
  )
}