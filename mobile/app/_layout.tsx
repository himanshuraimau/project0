import { ThemeProvider, useTheme } from '@/lib/hooks/useTheme'
import { ClerkProvider } from '@clerk/clerk-expo'
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import { useFonts } from 'expo-font'
import { Slot } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync()

function ThemedRoot() {
  const { theme, mode } = useTheme()
  const [fontsLoaded] = useFonts({
    'Arimo': require('../assets/fonts/Arimo.ttf'),
  })

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  if (!fontsLoaded) {
    return null
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Slot />
    </View>
  )
}

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <ThemeProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ThemedRoot />
        </GestureHandlerRootView>
      </ThemeProvider>
    </ClerkProvider>
  )
}