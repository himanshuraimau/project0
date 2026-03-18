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
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import {
  maybeCompleteAuthSessionOnce,
  signInWithGoogleSingleFlight,
} from "@/lib/auth/social-google";

maybeCompleteAuthSessionOnce();

export default function Paywall4() {
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const appScheme = (process.env.EXPO_PUBLIC_APP_SCHEME || "flinote").toLowerCase();

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
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.benefitText}>
              Preserve your personalized settings
            </Text>
          </View>
          <View style={styles.benefitRow}>
            <View style={styles.benefitIcon}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.benefitText}>
              Sync your notes seamlessly across devices
            </Text>
          </View>
          <View style={styles.benefitRow}>
            <View style={styles.benefitIcon}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 18,
  },
  timeBg: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timeText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  statusRight: { flexDirection: "row", alignItems: "center" },
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
  benefits: { width: "100%", gap: 16, marginBottom: 20, marginTop: 24 },
  benefitRow: { flexDirection: "row", alignItems: "center" },
  benefitIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  benefitText: {
    fontFamily: "Arimo",
    fontWeight: "400",
    fontSize: 15,
    lineHeight: 22,
    color: "#000000",
    flex: 1,
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
  googleLogo: { width: 24, height: 24, marginRight: 12 },
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
    marginBottom: 12,
  },
  appleText: {
    fontFamily: "Arimo",
    fontWeight: "700",
    fontSize: 16,
    color: "#FFFFFF",
  },
  continueBtn: {
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  continueText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  termsText: {
    color: "#6B7280",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
  linkText: { textDecorationLine: "underline", color: "#4B5563" },
  homeIndicator: {
    height: 4,
    width: 140,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
  },
});
