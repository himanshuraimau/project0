import { authStyles } from '@/components/auth/styles'
import { useSignIn, useSSO } from '@clerk/clerk-expo'
import { OAuthStrategy } from '@clerk/types'
import * as AuthSession from 'expo-auth-session'
import { LinearGradient } from 'expo-linear-gradient'
import { Link, useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import React, { useCallback, useEffect } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'

export default function Page() {
  // Warm-up/cool-down the browser and complete pending sessions
  useEffect(() => {
    void WebBrowser.warmUpAsync()
    return () => {
      void WebBrowser.coolDownAsync()
    }
  }, [])
  WebBrowser.maybeCompleteAuthSession()

  const { signIn, setActive, isLoaded } = useSignIn()
  const { startSSOFlow } = useSSO()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')

  const signInWith = useCallback(
    async (strategy: OAuthStrategy) => {
      try {
        const { createdSessionId, setActive: setActiveFromSSO } = await startSSOFlow({
          strategy,
          redirectUrl: AuthSession.makeRedirectUri({ scheme: 'mobile' }),
        })
        if (createdSessionId) {
          await setActiveFromSSO!({ session: createdSessionId })
          router.replace('/')
        }
      } catch (err) {
        console.error(JSON.stringify(err, null, 2))
      }
    },
    [router, startSSOFlow]
  )

  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    if (!isLoaded) return

    // Start the sign-in process using the email and password provided
    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      })

      // If sign-in process is complete, set the created session as active
      // and redirect the user
      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId })
        router.replace('/')
      } else {
        // If the status isn't complete, check why. User might need to
        // complete further steps.
        console.error(JSON.stringify(signInAttempt, null, 2))
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
    }
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
          <Text style={authStyles.subHeading}>Welcome back!</Text>
          <Text style={authStyles.mainHeading}>Sign in to continue</Text>
        </View>

        {/* Social Button */}
        <View style={authStyles.socialButtonWrapper}>
          <Pressable
            style={authStyles.socialButton}
            onPress={() => signInWith('oauth_google')}
          >
            <Text style={authStyles.socialButtonText}>Continue with Google</Text>
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
            onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
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
            onChangeText={(password) => setPassword(password)}
            style={authStyles.input}
          />
        </View>

        {/* Primary Button */}
        <Pressable style={authStyles.primaryButton} onPress={onSignInPress}>
          <Text style={authStyles.primaryButtonText}>Continue</Text>
        </Pressable>

        {/* Footer Link */}
        <View style={authStyles.footerContainer}>
          <Text style={authStyles.footerText}>No account?</Text>
          <Link href="/sign-up" asChild>
            <Pressable>
              <Text style={authStyles.footerLink}>Sign up</Text>
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