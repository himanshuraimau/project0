import { ThemeProvider, useTheme } from '@/lib/hooks/useTheme'
import { ClerkProvider } from '@clerk/clerk-expo'
import { tokenCache } from '@/lib/auth/cache'
import { AuthTokenProvider } from '@/components/auth/AuthTokenProvider'
import { SubscriptionProvider } from '@/lib/contexts/SubscriptionContext'
import { useFonts } from 'expo-font'
import { Slot } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { View, ActivityIndicator, Text } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { initI18n } from '@/lib/i18n/i18n'
import * as NavigationBar from 'expo-navigation-bar'
import { Platform } from 'react-native'

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync()

function ThemedRoot() {
  const { theme, mode } = useTheme()
  const [fontsLoaded] = useFonts({
    'Arimo': require('../assets/fonts/Arimo.ttf'),
  })
  const [i18nInitialized, setI18nInitialized] = useState(false)

  useEffect(() => {
    // Initialize i18n
    initI18n()
      .then(() => {
        console.log('✅ i18n initialized')
        setI18nInitialized(true)
      })
      .catch((error) => {
        console.error('❌ Failed to initialize i18n:', error)
        setI18nInitialized(true) // Continue anyway
      })
  }, [])

  useEffect(() => {
    // Configure navigation bar for Android
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(theme.colors.background)
      NavigationBar.setButtonStyleAsync(mode === 'dark' ? 'light' : 'dark')
    }
  }, [theme.colors.background, mode])

  useEffect(() => {
    if (fontsLoaded && i18nInitialized) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, i18nInitialized])

  if (!fontsLoaded || !i18nInitialized) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, color: theme.colors.text }}>Loading...</Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar
        style={mode === 'dark' ? 'light' : 'dark'}
        translucent={true}
        backgroundColor="transparent"
      />
      <Slot />
    </View>
  )
}

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <AuthTokenProvider>
        <SubscriptionProvider>
          <ThemeProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <ThemedRoot />
            </GestureHandlerRootView>
          </ThemeProvider>
        </SubscriptionProvider>
      </AuthTokenProvider>
    </ClerkProvider>
  )
}