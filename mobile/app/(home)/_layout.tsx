import { Stack, Redirect } from 'expo-router'
import { useSession } from '@/lib/auth'
import { View, ActivityIndicator } from 'react-native'

export default function Layout() {
  const { data: session, isPending } = useSession()

  // Show loading while checking auth
  if (isPending) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    )
  }

  // Redirect to landing page if not authenticated
  if (!session) {
    return <Redirect href="/" />
  }

  return <Stack screenOptions={{ headerShown: false }} />
}


