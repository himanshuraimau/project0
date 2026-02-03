import WelcomeScreen from '@/components/onboarding/WelcomeScreen'
import { Redirect } from 'expo-router'
import { useSession } from '@/lib/auth'
import { View, ActivityIndicator } from 'react-native'

export default function Index() {
  const { data: session, isPending } = useSession()

  // Show minimal loading state while checking auth
  if (isPending) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    )
  }

  // If user is signed in, redirect to home (home layout will check onboarding)
  // If user is not signed in, show welcome screen
  return <WelcomeScreen />
}


