import { Stack, Redirect } from 'expo-router'
import { useSession } from '@/lib/auth'
import { View, ActivityIndicator } from 'react-native'
import { useState, useEffect } from 'react'
import { checkOnboardingStatus } from '@/lib/api/onboarding'

export default function Layout() {
  const { data: session, isPending } = useSession()
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null)
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true)

  // Check onboarding status from backend when user is authenticated
  useEffect(() => {
    const checkOnboarding = async () => {
      if (!session) {
        setIsCheckingOnboarding(false)
        return
      }

      try {
        console.log('🔍 Checking onboarding status from backend...')
        const response = await checkOnboardingStatus()
        const completed = response.onboarding?.isCompleted ?? false
        console.log('📋 Onboarding status:', completed ? 'Completed' : 'Not completed')
        setOnboardingCompleted(completed)
      } catch (error) {
        console.error('❌ Error checking onboarding:', error)
        // On error, assume not completed to show onboarding
        setOnboardingCompleted(false)
      } finally {
        setIsCheckingOnboarding(false)
      }
    }

    checkOnboarding()
  }, [session])

  // Show loading while checking auth or onboarding
  if (isPending || isCheckingOnboarding) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    )
  }

  // Redirect to auth if not authenticated
  if (!session) {
    return <Redirect href="/(auth)/sign-in" />
  }

  // Redirect to onboarding if not completed
  if (onboardingCompleted === false) {
    console.log('➡️  Redirecting to onboarding...')
    return <Redirect href="/(onboarding)/step1" />
  }

  // User is authenticated and completed onboarding

