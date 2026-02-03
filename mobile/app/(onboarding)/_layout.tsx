import { Stack, Redirect } from 'expo-router'
import { useSession } from '@/lib/auth'
import { View, ActivityIndicator } from 'react-native'
import { OnboardingProvider } from '@/lib/contexts/OnboardingContext'

export default function OnboardingLayout() {
  const { data: session, isPending } = useSession()

  // Show loading while checking auth
  if (isPending) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    )
  }

  // Redirect to sign-in if not authenticated (onboarding requires auth)
  if (!session) {
    return <Redirect href="/(auth)/sign-in" />
  }

  return (
    <OnboardingProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="step1" />
        <Stack.Screen name="step2" />
        <Stack.Screen name="step3" />
        <Stack.Screen name="step4" />
        <Stack.Screen name="step5" />
        <Stack.Screen name="paywall" />
        <Stack.Screen name="workingProfessional" />
      </Stack>
    </OnboardingProvider>
  )
}

