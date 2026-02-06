import { authClient } from '@/lib/auth/auth-client'
import { LinearGradient } from 'expo-linear-gradient'
import { Link } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import React, { useCallback, useEffect } from 'react'
import { Text, View, Image, TouchableOpacity, StyleSheet, StatusBar, Linking } from 'react-native'

WebBrowser.maybeCompleteAuthSession()

export default function SignUpScreen() {

  useEffect(() => {
    void WebBrowser.warmUpAsync()
    return () => {
      void WebBrowser.coolDownAsync()
    }
  }, [])

  const handleGoogleSignUp = useCallback(async () => {
    try {
      console.log('🔐 Starting Google OAuth sign-up with Better Auth...')
      
      // The Expo plugin handles everything automatically
      const response = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/(home)",
      })

      console.log('📱 OAuth response:', response)

      // If successful, navigation will happen automatically via the auth layout
      if (response.data && !response.error) {
        console.log('✅ OAuth completed successfully')
        // The home layout will check onboarding status and redirect accordingly
      } else {
        console.error('❌ OAuth failed:', response.error)
      }
    } catch (err) {
      console.error("Google OAuth error", err)
    }
  }, [])

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
            source={require("../../assets/images/flinote-logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Join Flinote!</Text>
        <Text style={styles.subtitle}>
          Create your account to get started.
        </Text>

        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.googleBtn}
            activeOpacity={0.9}
            onPress={handleGoogleSignUp}
          >
            <Image
              source={{
                uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/512px-Google_%22G%22_Logo.svg.png",
              }}
              style={styles.googleLogo}
            />
            <Text style={styles.googleText}>Sign up with Google</Text>
          </TouchableOpacity>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Link href="/(auth)/sign-in" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>Sign in</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <Text style={styles.termsText}>
            By signing up, you agree to our{" "}
            <Text 
              style={styles.termsLink}
              onPress={() => Linking.openURL('https://flinote.ai/terms')}
            >
              Terms of Service
            </Text>{" "}
            and{" "}
            <Text 
              style={styles.termsLink}
              onPress={() => Linking.openURL('https://flinote.ai/privacy')}
            >
              Privacy Policy
            </Text>
          </Text>
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
  termsText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 24,
  },
  termsLink: {
    textDecorationLine: 'underline',
    color: '#4B5563',
    fontWeight: '500',
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