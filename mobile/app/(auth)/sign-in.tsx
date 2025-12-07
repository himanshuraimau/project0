import { useOAuth } from '@clerk/clerk-expo'
import { LinearGradient } from 'expo-linear-gradient'
import { Link, useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import React, { useCallback, useEffect } from 'react'
import { Text, View, Image, TouchableOpacity, StyleSheet, StatusBar } from 'react-native'
import { markOnboardingCompleted } from '@/lib/storage/onboardingStorage'
import * as AuthSession from 'expo-auth-session'
import { Ionicons } from '@expo/vector-icons'

WebBrowser.maybeCompleteAuthSession()

export default function Page() {
  const router = useRouter()
  const { startOAuthFlow: startGoogleFlow } = useOAuth({
    strategy: "oauth_google",
  })
  const { startOAuthFlow: startAppleFlow } = useOAuth({
    strategy: "oauth_apple",
  })

  useEffect(() => {
    void WebBrowser.warmUpAsync()
    return () => {
      void WebBrowser.coolDownAsync()
    }
  }, [])

  const onSelectAuth = useCallback(
    async (strategy: "oauth_google" | "oauth_apple") => {
      try {
        const startOAuthFlow =
          strategy === "oauth_google" ? startGoogleFlow : startAppleFlow

        const redirectUrl = __DEV__ 
          ? AuthSession.makeRedirectUri({ scheme: undefined }) // Use exp:// in dev
          : AuthSession.makeRedirectUri({ scheme: 'mobile' })   // Use mobile:// in production

        console.log('🔗 Using redirect URL:', redirectUrl)

        const { createdSessionId, setActive } = await startOAuthFlow({
          redirectUrl,
        })

        if (createdSessionId) {
          setActive!({ session: createdSessionId })
          
          // Mark onboarding as completed
          try {
            await markOnboardingCompleted()
            console.log('✅ Onboarding marked as completed')
          } catch (error) {
            console.error('Failed to mark onboarding complete:', error)
          }
          
          // Add a small delay to allow session state to sync
          setTimeout(() => {
            router.replace("/(home)" as any)
          }, 300)
        }
      } catch (err) {
        console.error("OAuth error", err)
      }
    },
    [startGoogleFlow, startAppleFlow, router]
  )

  return (
    <LinearGradient
      colors={["#FFFFFF", "#F7F5FF"]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0.3, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" />

      <View style={styles.content}>
        <View style={styles.brandIcon}>
          <Image
            source={require("../../assets/images/main-logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Welcome back!</Text>
        <Text style={styles.subtitle}>
          Sign in to continue your journey.
        </Text>

        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.googleBtn}
            activeOpacity={0.9}
            onPress={() => onSelectAuth("oauth_google")}
          >
            <Image
              source={{
                uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/512px-Google_%22G%22_Logo.svg.png",
              }}
              style={styles.googleLogo}
            />
            <Text style={styles.googleText}>Sign in with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.appleBtn}
            activeOpacity={0.9}
            onPress={() => onSelectAuth("oauth_apple")}
          >
            <Ionicons
              name="logo-apple"
              size={24}
              color="#FFFFFF"
              style={{ marginRight: 12 }}
            />
            <Text style={styles.appleText}>Sign in with Apple</Text>
          </TouchableOpacity>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>No account?</Text>
            <Link href="/(onboarding)/step1" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>Sign up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>

      <View style={styles.homeIndicator} />
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 120,
    alignItems: "center",
  },
  bottomContainer: { width: "100%", marginTop: "auto", paddingBottom: 36 },
  brandIcon: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  logoImage: {
    width: 140,
    height: 140,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 40,
    textAlign: "center",
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#D1D5DC",
    borderRadius: 999,
    height: 56,
    width: "100%",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  googleLogo: { width: 16, height: 16, marginRight: 16 },
  googleText: {
    fontFamily: "Arimo",
    fontWeight: "400",
    fontSize: 16,
    color: "#000000",
  },
  appleBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000000",
    borderRadius: 999,
    height: 56,
    width: "100%",
    justifyContent: "center",
    marginBottom: 24,
  },
  appleText: {
    fontFamily: "Arimo",
    fontWeight: "700",
    fontSize: 16,
    color: "#FFFFFF",
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8
  },
  footerText: {
    fontSize: 16,
    color: '#6B7280'
  },
  linkText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    textDecorationLine: 'underline'
  },
  homeIndicator: {
    height: 4,
    width: 140,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
  },
})