import Button from '@/components/ui/button'
import { useTheme } from '@/lib/hooks/useTheme'
import { useSignIn, useSSO } from '@clerk/clerk-expo'
import { OAuthStrategy } from '@clerk/types'
import * as AuthSession from 'expo-auth-session'
import { Link, useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import React, { useCallback, useEffect } from 'react'
import { Text, TextInput, View } from 'react-native'

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

  const { theme } = useTheme()

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: theme.spacing.md,
        gap: theme.spacing.md,
        justifyContent: 'center',
      }}
    >
      <View style={{ marginHorizontal: theme.spacing.md }}>
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ color: theme.colors.text, fontSize: theme.fontSize['2xl'], fontWeight: '800' }}>
            Sign in to continue
          </Text>
        </View>

        {/* Social row */}
        <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginTop: 10 }}>
          <View style={{ flex: 1 }}>
            <Button onPress={() => signInWith('oauth_google')} label="Continue with Google" variant="social" size="md" />
          </View>
        </View>

        {/* Divider */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: '#CCCCCC' }} />
          <Text style={{ color: theme.colors.mutedText, marginHorizontal: theme.spacing.sm }}>or</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: '#CCCCCC' }} />
        </View>

        {/* Email input group */}
      
        <View style={{ gap: 6 }}>
          <Text style={{ color: theme.colors.mutedText, fontSize: theme.fontSize.xs }}>Email address</Text>
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderWidth: theme.borderWidth.brutal,
              borderRadius: theme.radius.brutal,
              padding: 8,
              ...theme.shadow({ offset: 3, opacity: 0.25 }),
            }}
          >
            <TextInput
              autoCapitalize="none"
              value={emailAddress}
              placeholder="Enter email"
              placeholderTextColor={theme.colors.mutedText}
              onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
              style={{ color: theme.colors.text, fontSize: theme.fontSize.sm }}
            />
          </View>
        </View>

        {/* Password */}
        <View style={{ gap: 6, marginTop: 10 }}>
          <Text style={{ color: theme.colors.mutedText, fontSize: theme.fontSize.xs }}>Password</Text>
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderWidth: theme.borderWidth.brutal,
              borderRadius: theme.radius.brutal,
              padding: 8,
              ...theme.shadow({ offset: 3, opacity: 0.25 }),
            }}
          >
            <TextInput
              value={password}
              placeholder="Enter password"
              placeholderTextColor={theme.colors.mutedText}
              secureTextEntry={true}
              onChangeText={(password) => setPassword(password)}
              style={{ color: theme.colors.text, fontSize: theme.fontSize.sm }}
            />
          </View>
        </View>
        <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
          <Button onPress={onSignInPress} label="Continue" size="md" />
        </View>

        <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
          <Text style={{ color: theme.colors.mutedText }}>No account?</Text>
          <Link href="/sign-up">
            <Text style={{ color: theme.colors.accent, fontWeight: '700', textDecorationLine: 'underline' }}>
              Sign up
            </Text>
          </Link>
        </View>

        {/* Clerk branding */}
        <View style={{ alignItems: 'center', marginTop: 12 }}>
          <Text style={{ color: '#B0B0B0', fontSize: 12 }}>Secured by Clerk</Text>
        </View>
      </View>
    </View>
  )
}