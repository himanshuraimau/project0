import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Image,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import {
  maybeCompleteAuthSessionOnce,
  signInWithGoogleSingleFlight,
} from "@/lib/auth/social-google";
import { useTheme } from '@/lib/hooks/useTheme';
import { BlurView } from 'expo-blur';

maybeCompleteAuthSessionOnce();

export default function Paywall4() {
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const appScheme = (process.env.EXPO_PUBLIC_APP_SCHEME || "flinote").toLowerCase();

  const { theme, mode } = useTheme();
  const c = theme.colors;
  const isDark = mode === 'dark';

  React.useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const handleGoogleAuth = React.useCallback(async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogleSingleFlight(`${appScheme}://`);
    } catch (err: any) {
      console.error("Google OAuth error:", err);
      alert(err?.message || "Authentication failed. Please try again.");
    } finally {
      setIsGoogleLoading(false);
    }
  }, [appScheme]);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
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
      borderRadius: 28,
      backgroundColor: c.foreground,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
    },
    ghost: {
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
      fontWeight: "500",
      color: c.foreground,
      marginBottom: 6,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 14,
      color: c.mutedForeground,
      marginBottom: 40,
      textAlign: "center",
    },
    benefits: { width: "100%", gap: 16, marginBottom: 20, marginTop: 24 },
    benefitRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : c.muted,
      borderRadius: 12,
      padding: 14,
      borderWidth: 0.5,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
    },
    benefitIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    benefitText: {
      fontFamily: "Inter",
      fontWeight: "400",
      fontSize: 15,
      lineHeight: 22,
      color: c.foreground,
      flex: 1,
    },
    googleBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.card,
      borderWidth: 0.5,
      borderColor: c.border,
      borderRadius: 14,
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
    googleLogo: { width: 24, height: 24, marginRight: 12 },
    googleText: {
      fontFamily: "Inter",
      fontWeight: "400",
      fontSize: 16,
      color: c.foreground,
    },
    termsText: {
      color: c.mutedForeground,
      fontSize: 12,
      textAlign: "center",
      marginTop: 8,
    },
    linkText: { textDecorationLine: "underline" as const, color: c.foreground },
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.content}>
        <View style={styles.brandIcon}>
          <Image
            source={require("../../../assets/images/flinote-logo.png")}
            style={styles.ghost}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Your space is set.</Text>
        <Text style={styles.subtitle}>
          Create an account to save your flow.
        </Text>

        <View style={styles.benefits}>
          <View style={styles.benefitRow}>
            <View style={styles.benefitIcon}>
              <Ionicons name="checkmark" size={16} color={c.primaryForeground} />
            </View>
            <Text style={styles.benefitText}>
              Preserve your personalized settings
            </Text>
          </View>
          <View style={styles.benefitRow}>
            <View style={styles.benefitIcon}>
              <Ionicons name="checkmark" size={16} color={c.primaryForeground} />
            </View>
            <Text style={styles.benefitText}>
              Sync your notes seamlessly across devices
            </Text>
          </View>
          <View style={styles.benefitRow}>
            <View style={styles.benefitIcon}>
              <Ionicons name="checkmark" size={16} color={c.primaryForeground} />
            </View>
            <Text style={styles.benefitText}>
              Access your ideas from anywhere, anytime
            </Text>
          </View>
        </View>

        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.googleBtn}
            activeOpacity={0.9}
            onPress={handleGoogleAuth}
            disabled={isGoogleLoading}
          >
            <Image
              source={{
                uri: "https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png",
              }}
              style={styles.googleLogo}
              resizeMode="contain"
            />
            <Text style={styles.googleText}>
              {isGoogleLoading ? "Signing up..." : "Sign up with Google"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By creating an account you agree to our{" "}
            <Text
              style={styles.linkText}
              onPress={() => Linking.openURL('https://flinote.ai/privacy')}
            >
              Privacy Policy
            </Text>{" "}
            and{" "}
            <Text
              style={styles.linkText}
              onPress={() => Linking.openURL('https://flinote.ai/terms')}
            >
              Terms of Service
            </Text>.
          </Text>
        </View>
      </View>
    </View>
  );
}
