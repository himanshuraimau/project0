import { tokens } from '@/lib/constants/Colors'
import { useTheme } from '@/lib/hooks/useTheme'
import { useClerk, useUser } from '@clerk/clerk-expo'
import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import { Text, TouchableOpacity } from 'react-native'

export const SignOutButton = () => {
  const { signOut } = useClerk()
  const { isSignedIn } = useUser()
  const { mode } = useTheme()
  const router = useRouter()
  const styles = tokens.button(mode)

  const handleSignOut = async () => {
    try {
      await signOut()
      // Redirect to your desired page
      Linking.openURL(Linking.createURL('/'))
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
    }
  }

  const handleSignIn = () => {
    router.push('/(auth)/sign-in' as any)
  }

  if (!isSignedIn) {
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