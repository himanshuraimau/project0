import { tokens } from '@/lib/constants/Colors'
import { useTheme } from '@/lib/hooks/useTheme'
import { authClient } from '@/lib/auth/auth-client'
import { useSession } from '@/lib/auth'
import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import { Text, TouchableOpacity } from 'react-native'

export const SignOutButton = () => {
  const { data: session } = useSession()
  const { mode } = useTheme()
  const router = useRouter()
  const styles = tokens.button(mode)

  const handleSignOut = async () => {
    try {
      await authClient.signOut()
      // Redirect to your desired page
      Linking.openURL(Linking.createURL('/'))
    } catch (err) {
      console.error(JSON.stringify(err, null, 2))
    }
  }

  const handleSignIn = () => {
    router.push('/(auth)/sign-in' as any)
  }

  if (!session) {
    return (
      <TouchableOpacity onPress={handleSignIn} style={styles.container} activeOpacity={0.9}>
        <Text style={styles.text}>Sign in</Text>
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity onPress={handleSignOut} style={styles.container} activeOpacity={0.9}>
      <Text style={styles.text}>Sign out</Text>
    </TouchableOpacity>
  )
}