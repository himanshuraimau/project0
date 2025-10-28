import WelcomeScreen from '@/components/onboarding/WelcomeScreen'
import { useUser } from '@clerk/clerk-expo'
import { Redirect } from 'expo-router'

export default function Index() {
  const { isSignedIn, isLoaded } = useUser()

  // Wait for auth to load
  if (!isLoaded) {
    return null
  }

  // If user is signed in, redirect to home
  if (isSignedIn) {
    return <Redirect href="/(drawer)/(home)" />
  }

  // Show welcome screen for first-time users
  return <WelcomeScreen />
}


