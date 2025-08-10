import Button from '@/components/ui/button'
import { useTheme } from '@/lib/hooks/useTheme'
import { useSignUp, useSSO } from '@clerk/clerk-expo'
import { OAuthStrategy } from '@clerk/types'
import * as AuthSession from 'expo-auth-session'
import { Link, useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import * as React from 'react'
import { Text, TextInput, View } from 'react-native'

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()
  const { startSSOFlow } = useSSO()

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [pendingVerification, setPendingVerification] = React.useState(false)
  const [code, setCode] = React.useState('')

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
      // and redirect the user
      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId })
        router.replace('/')
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

  const { theme } = useTheme()

  React.useEffect(() => {
    void WebBrowser.warmUpAsync()
    return () => {
      void WebBrowser.coolDownAsync()
    }
  }, [])
  WebBrowser.maybeCompleteAuthSession()

  const signUpWith = React.useCallback(
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

  if (pendingVerification) {
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
          <View style={{ alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ color: theme.colors.text, fontSize: theme.fontSize['2xl'], fontWeight: '800' }}>
              Verify your email
            </Text>
            <Text style={{ color: theme.colors.mutedText, fontSize: theme.fontSize.sm, marginTop: 4 }}>
              Enter the code sent to your email address
            </Text>
          </View>
          <View style={{ gap: 6 }}>
            <Text style={{ color: theme.colors.mutedText, fontSize: theme.fontSize.xs }}>Verification code</Text>
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
                value={code}
                placeholder="Enter your verification code"
                placeholderTextColor={theme.colors.mutedText}
                onChangeText={(value) => setCode(value)}
                style={{ color: theme.colors.text, fontSize: theme.fontSize.sm }}
              />
            </View>
          </View>
          <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
            <Button onPress={onVerifyPress} label="Verify" size="md" />
          </View>
        </View>
      </View>
    )
  }

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
            Create your account
          </Text>
        </View>

        {/* Social row */}
        <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginTop: 10 }}>
          <View style={{ flex: 1 }}>
            <Button onPress={() => signUpWith('oauth_google')} label="Continue with Google" variant="social" size="md" />
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
              onChangeText={(value) => setEmailAddress(value)}
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
              onChangeText={(value) => setPassword(value)}
              style={{ color: theme.colors.text, fontSize: theme.fontSize.sm }}
            />
          </View>
        </View>

        <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
          <Button onPress={onSignUpPress} label="Continue" size="md" />
        </View>

        <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
          <Text style={{ color: theme.colors.mutedText }}>Already have an account?</Text>
          <Link href="/sign-in">
            <Text style={{ color: theme.colors.accent, fontWeight: '700', textDecorationLine: 'underline' }}>
              Sign in
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