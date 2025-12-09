import { tokens } from '@/lib/constants/Colors'
import { useTheme } from '@/lib/hooks/useTheme'
import { authClient } from '@/lib/auth/auth-client'
import { useSession } from '@/lib/auth'
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
      // Don't manually navigate - let auth system handle redirect
    } catch (err) {
      console.error('Sign out error:', err)
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