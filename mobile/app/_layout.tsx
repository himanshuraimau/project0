import { ThemeProvider, useTheme } from '@/lib/hooks/useTheme'
import { ClerkProvider } from '@clerk/clerk-expo'
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import { Slot } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

function ThemedRoot() {
  const { theme, mode } = useTheme()
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Slot />
    </View>
  )
}

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ThemeProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ThemedRoot />
        </GestureHandlerRootView>
      </ThemeProvider>
    </ClerkProvider>
  )
}