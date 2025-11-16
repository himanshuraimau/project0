import WelcomeScreen from '@/components/onboarding/WelcomeScreen'
import { Redirect } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'
import { View, ActivityIndicator } from 'react-native'

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth()

  // Show minimal loading state while checking auth
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    )
  }

  // If user is logged in, redirect to home immediately
  if (isSignedIn) {
    return <Redirect href="/(drawer)/(home)" />
  }

  // Otherwise show welcome screen
  return <WelcomeScreen />
}


