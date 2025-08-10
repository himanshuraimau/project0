import { SignOutButton } from '@/components/auth/SignOutButton'
import Button from '@/components/ui/button'
import { useTheme } from '@/lib/hooks/useTheme'
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-expo'
import { Link } from 'expo-router'
import { Text, View } from 'react-native'

export default function Page() {
  const { user } = useUser()
  const { theme } = useTheme()

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: theme.spacing.xl,
        gap: theme.spacing.lg,
      }}
    >
      <SignedIn>
        <Text
          style={{
            color: theme.colors.text,
            fontSize: theme.fontSize.lg,
            fontWeight: '800',
          }}
        >
          Hello {user?.emailAddresses[0].emailAddress}
        </Text>
        <View style={{ height: theme.spacing.sm }} />
        <SignOutButton />
      </SignedIn>
      <SignedOut>
        <Link href="/(auth)/sign-in">
          <Button label="Sign in" />
        </Link>
        <Link href="/(auth)/sign-up">
          <Button label="Sign up" variant="accent" />
        </Link>
      </SignedOut>
    </View>
  )
}