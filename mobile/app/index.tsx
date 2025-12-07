import WelcomeScreen from '@/components/onboarding/WelcomeScreen'
import { Redirect } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'
import { View, ActivityIndicator } from 'react-native'
import { useState, useEffect } from 'react'
import { hasCompletedOnboarding } from '@/lib/storage/onboardingStorage'

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth()
  const [onboardingChecked, setOnboardingChecked] = useState(false)
  const [hasCompletedOnboardingState, setHasCompletedOnboardingState] = useState(false)

  // Check onboarding completion status when auth is loaded
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (isLoaded) {
        try {
          const completed = await hasCompletedOnboarding()
          setHasCompletedOnboardingState(completed)
        } catch (error) {
          console.error('Error checking onboarding status:', error)
          // Default to false on error
          setHasCompletedOnboardingState(false)
        } finally {
          setOnboardingChecked(true)
        }
      }
    }

    checkOnboardingStatus()
  }, [isLoaded])

  // Show minimal loading state while checking auth and onboarding
  if (!isLoaded || !onboardingChecked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    )
  }

  // If user is signed in AND has completed onboarding, redirect to home
  if (isSignedIn && hasCompletedOnboardingState) {
    return <Redirect href="/(home)" />
  }

  // If user is signed in but hasn't completed onboarding, show welcome screen
  // If user is not signed in, show welcome screen
  return <WelcomeScreen />
}


