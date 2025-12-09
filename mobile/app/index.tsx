import WelcomeScreen from '@/components/onboarding/WelcomeScreen'
import { Redirect } from 'expo-router'
import { useSession } from '@/lib/auth'
import { View, ActivityIndicator } from 'react-native'
import { useState, useEffect } from 'react'
import { hasCompletedOnboarding, markOnboardingCompleted } from '@/lib/storage/onboardingStorage'

export default function Index() {
  const { data: session, isPending } = useSession()
  const [onboardingChecked, setOnboardingChecked] = useState(false)

  // Check onboarding completion status when auth is loaded
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!isPending) {
        try {
          const completed = await hasCompletedOnboarding()
          
          // If user is logged in but onboarding isn't marked as complete,
          // automatically mark it as complete (handles returning users on new devices)
          if (session && !completed) {
            console.log('✅ Auto-completing onboarding for logged-in user')
            await markOnboardingCompleted()
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error)
        } finally {
          setOnboardingChecked(true)
        }
      }
    }

    checkOnboardingStatus()
  }, [isPending, session])

  // Show minimal loading state while checking auth and onboarding
  if (isPending || !onboardingChecked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    )
  }

  // If user is signed in, redirect to home (onboarding auto-completed above)
  if (session) {
    return <Redirect href="/(home)" />
  }

  // If user is not signed in, show welcome screen
  return <WelcomeScreen />
}


