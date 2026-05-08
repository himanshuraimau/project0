import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Star, TrendingUp, ArrowDown } from "lucide-react-native";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import * as ExpoLinking from "expo-linking";
import { useTheme } from "@/lib/hooks/useTheme";
import { brand, neutral } from "@/lib/design-system";
import {
  Animated,
  welcomeEntrance,
  authEntrance,
  usePressScale,
} from "@/lib/ui/auth-animations";
import {
  maybeCompleteAuthSessionOnce,
  signInWithGoogleSingleFlight,
} from "@/lib/auth/social-google";
import { signInWithAppleSingleFlight } from "@/lib/auth/social-apple";

maybeCompleteAuthSessionOnce();
const APP_SCHEME = (
  process.env.EXPO_PUBLIC_APP_SCHEME || "flinote"
).toLowerCase();
const IS_EXPO_GO = Constants.appOwnership === "expo";
const MOBILE_AUTH_CALLBACK_URL = IS_EXPO_GO
  ? ExpoLinking.createURL("/sign-in")
  : ExpoLinking.createURL("/sign-in", { scheme: APP_SCHEME });

const TERMS_URL = "https://flinote.ai/terms";
const PRIVACY_URL = "https://flinote.ai/privacy";

const { width: SCREEN_W } = Dimensions.get("window");
const GOOGLE_LOGO = require("../../assets/icons/googlePng.webp");

function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError && err.message === "Network request failed")
    return true;
  const m =
    err &&
    typeof err === "object" &&
    "message" in err &&
    (err as Error).message;
  return typeof m === "string" && m.includes("Network request failed");
}

export default function WelcomeScreen() {
  const { theme, mode } = useTheme();
  const isDark = mode === "dark";
  const c = theme.colors;
  const t = theme.typography;
  const [ctaScale, ctaPressIn, ctaPressOut] = usePressScale();
  const [loading, setLoading] = useState(false);
  const [isApple, setIsApple] = useState(false);

  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const handleGoogleAuth = useCallback(async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogleSingleFlight(
        MOBILE_AUTH_CALLBACK_URL
      );
      if (result.skipped) return;
      const response = result.response;
      if (response.data && !response.error) {
        // Navigation handled by auth layout
      } else {
        Alert.alert(
          "Sign in failed",
          response.error?.message ?? "Something went wrong. Try again."
        );
      }
    } catch (err) {
      if (isNetworkError(err)) {
        Alert.alert(
          "Connection problem",
          "Could not reach the server. Check your internet connection and try again."
        );
      } else {
        Alert.alert(
          "Something went wrong",
          (err as Error)?.message ?? "Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAppleAuth = useCallback(async () => {
    setLoading(true);
    setIsApple(true);
    try {
      const result = await signInWithAppleSingleFlight(
        MOBILE_AUTH_CALLBACK_URL
      );
      if (result.skipped) return;
      const response = result.response;
      if (response.data && !response.error) {
        // Navigation handled by auth layout
      } else {
        Alert.alert(
          "Sign in failed",
          response.error?.message ?? "Something went wrong. Try again."
        );
      }
    } catch (err) {
      if (isNetworkError(err)) {
        Alert.alert(
          "Connection problem",
          "Could not reach the server. Check your internet connection and try again."
        );
      } else {
        Alert.alert(
          "Something went wrong",
          (err as Error)?.message ?? "Please try again."
        );
      }
    } finally {
      setLoading(false);
      setIsApple(false);
    }
  }, []);

  const badgeBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
  const badgeBorder = isDark
    ? "rgba(255,255,255,0.08)"
    : "rgba(0,0,0,0.06)";
  const starColor = "#FBBF24";
  const subtleText = isDark ? neutral[400] : neutral[500];

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        {/* ── Hero Section ─────────────────────────────────────── */}
        <View style={styles.heroSection}>
          {/* Icon cluster with overlapping badges */}
          <Animated.View
            entering={welcomeEntrance.appIcon}
            style={styles.iconCluster}
          >
            {/* Rating badge — overlaps left side of icon */}
            <View
              style={[
                styles.badge,
                styles.ratingBadge,
                { backgroundColor: badgeBg, borderColor: badgeBorder },
              ]}
            >
              <Text
                style={[
                  styles.ratingNumber,
                  { color: c.foreground, fontWeight: t.weightBold },
                ]}
              >
                4.9
              </Text>
              <View style={styles.starsRow}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star
                    key={i}
                    size={10}
                    color={starColor}
                    fill={starColor}
                    strokeWidth={0}
                  />
                ))}
              </View>
            </View>

            {/* App Icon — dominant center element */}
            <View
              style={[
                styles.appIconContainer,
                isDark
                  ? {
                      shadowColor: brand[400],
                      shadowOffset: { width: 0, height: 16 },
                      shadowOpacity: 0.25,
                      shadowRadius: 40,
                      elevation: 20,
                    }
                  : {
                      shadowColor: brand[600],
                      shadowOffset: { width: 0, height: 16 },
                      shadowOpacity: 0.15,
                      shadowRadius: 40,
                      elevation: 20,
                    },
              ]}
            >
              <Image
                source={require("../../assets/images/main-logo.png")}
                style={styles.appIcon}
                resizeMode="contain"
              />
            </View>

            {/* Product badge — overlaps right side of icon */}
            <View
              style={[
                styles.badge,
                styles.productBadge,
                { backgroundColor: badgeBg, borderColor: badgeBorder },
              ]}
            >
              <TrendingUp size={16} color={c.primary} strokeWidth={2} />
              <Text
                style={[
                  styles.productLabel,
                  { color: c.primary, fontWeight: t.weightSemibold },
                ]}
              >
                {"#1 Study\nApp"}
              </Text>
            </View>
          </Animated.View>

          {/* Headline */}
          <Animated.View
            entering={welcomeEntrance.copy}
            style={styles.copyBlock}
          >
            <Text
              style={[
                styles.headline,
                { color: c.foreground, fontWeight: t.weightBold },
              ]}
            >
              {"Instant notes for\naudio & video"}
            </Text>

            <Text style={[styles.body, { color: subtleText }]}>
              {"Upload anything \u2014 AI turns it into\nstudy-ready notes, flashcards & quizzes."}
            </Text>
          </Animated.View>

          {/* Free to try indicator */}
          <Animated.View
            entering={authEntrance.sub}
            style={styles.freeRow}
          >
            <Text
              style={[
                styles.freeText,
                { color: c.primary, fontWeight: t.weightSemibold },
              ]}
            >
              free to try
            </Text>
            <ArrowDown
              size={15}
              color={c.primary}
              strokeWidth={2.5}
              style={{ marginTop: 1 }}
            />
          </Animated.View>
        </View>

        {/* ── Bottom CTA Section ───────────────────────────────── */}
        <Animated.View
          entering={welcomeEntrance.bottomBar}
          style={styles.bottomSection}
        >
          {/* Continue with Google */}
          <Animated.View style={[ctaScale, styles.ctaWrap]}>
            <Pressable
              onPress={handleGoogleAuth}
              onPressIn={ctaPressIn}
              onPressOut={ctaPressOut}
              disabled={loading}
              style={({ pressed }) => [
                styles.googleBtn,
                {
                  backgroundColor: isDark
                    ? neutral[800]
                    : neutral[950],
                  opacity: loading ? 0.7 : pressed ? 0.85 : 1,
                },
              ]}
            >
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color={isDark ? c.foreground : neutral[0]}
                />
              ) : (
                <>
                  <View style={styles.googleLogoWrap}>
                    <Image source={GOOGLE_LOGO} style={styles.googleLogo} />
                  </View>
                  <Text
                    style={[
                      styles.googleBtnText,
                      {
                        color: isDark ? neutral[50] : neutral[0],
                        fontWeight: t.weightSemibold,
                      },
                    ]}
                  >
                    Continue with Google
                  </Text>
                </>
              )}
            </Pressable>
          </Animated.View>

          {/* Continue with Apple */}
          <Animated.View style={[ctaScale, styles.ctaWrap]}>
            <Pressable
              onPress={handleAppleAuth}
              onPressIn={ctaPressIn}
              onPressOut={ctaPressOut}
              disabled={loading}
              style={({ pressed }) => [
                styles.googleBtn,
                {
                  backgroundColor: isDark
                    ? neutral[800]
                    : neutral[950],
                  opacity: loading ? 0.7 : pressed ? 0.85 : 1,
                },
              ]}
            >
              {loading && isApple ? (
                <ActivityIndicator
                  size="small"
                  color={isDark ? c.foreground : neutral[0]}
                />
              ) : (
                <>
                  <Text style={styles.appleLogo}>
                    
                  </Text>
                  <Text
                    style={[
                      styles.googleBtnText,
                      {
                        color: isDark ? neutral[50] : neutral[0],
                        fontWeight: t.weightSemibold,
                      },
                    ]}
                  >
                    Continue with Apple
                  </Text>
                </>
              )}
            </Pressable>
          </Animated.View>

          {/* Continue with Apple */}
          <Animated.View style={[ctaScale, styles.ctaWrap]}>
            <Pressable
              onPress={handleAppleAuth}
              onPressIn={ctaPressIn}
              onPressOut={ctaPressOut}
              disabled={loading}
              style={({ pressed }) => [
                styles.googleBtn,
                {
                  backgroundColor: isDark
                    ? neutral[800]
                    : neutral[950],
                  opacity: loading ? 0.7 : pressed ? 0.85 : 1,
                },
              ]}
            >
              {loading && isApple ? (
                <ActivityIndicator
                  size="small"
                  color={isDark ? c.foreground : neutral[0]}
                />
              ) : (
                <>
                  <Text style={styles.appleLogo}>
                    
                  </Text>
                  <Text
                    style={[
                      styles.googleBtnText,
                      {
                        color: isDark ? neutral[50] : neutral[0],
                        fontWeight: t.weightSemibold,
                      },
                    ]}
                  >
                    Continue with Apple
                  </Text>
                </>
              )}
            </Pressable>
          </Animated.View>

          {/* Legal footer */}
          <Animated.View entering={authEntrance.footer}>
            <Text style={[styles.legalText, { color: subtleText }]}>
              {"By continuing, you agree to Flinote\u2019s "}
              <Text
                style={[styles.legalLink, { color: c.primary }]}
                onPress={() => Linking.openURL(TERMS_URL)}
              >
                Terms of Service
              </Text>
              {" and "}
              <Text
                style={[styles.legalLink, { color: c.primary }]}
                onPress={() => Linking.openURL(PRIVACY_URL)}
              >
                Privacy Policy
              </Text>
            </Text>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const ICON_SIZE = 120;
const BADGE_W = 88;
const BADGE_H = 64;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },

  /* Hero */
  heroSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 12,
  },

  /* Icon cluster — badges overlap the app icon */
  iconCluster: {
    width: SCREEN_W * 0.72,
    height: ICON_SIZE + 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  badge: {
    position: "absolute",
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    width: BADGE_W,
    height: BADGE_H,
    zIndex: 1,
  },
  ratingBadge: {
    left: 0,
    top: 4,
    gap: 4,
  },
  ratingNumber: {
    fontSize: 20,
    letterSpacing: -0.5,
  },
  starsRow: {
    flexDirection: "row",
    gap: 1.5,
  },
  productBadge: {
    right: 0,
    top: 4,
    gap: 3,
  },
  productLabel: {
    fontSize: 10,
    lineHeight: 13,
    textAlign: "center",
    letterSpacing: 0.1,
  },

  /* App Icon — dominant center */
  appIconContainer: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: 30,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  appIcon: {
    width: ICON_SIZE * 0.72,
    height: ICON_SIZE * 0.72,
    borderRadius: 20,
  },

  /* Copy */
  copyBlock: {
    alignItems: "center",
    paddingHorizontal: 8,
  },
  headline: {
    fontSize: 34,
    lineHeight: 41,
    letterSpacing: -0.7,
    textAlign: "center",
    marginBottom: 14,
  },
  body: {
    fontSize: 15.5,
    lineHeight: 22,
    textAlign: "center",
    letterSpacing: 0.05,
  },

  /* Free indicator */
  freeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 24,
  },
  freeText: {
    fontSize: 16,
    letterSpacing: -0.1,
  },

  /* Bottom Section */
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "android" ? 16 : 8,
  },
  ctaWrap: {
    marginBottom: 16,
  },
  googleBtn: {
    height: 58,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  googleLogoWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  googleLogo: {
    width: 16,
    height: 16,
  },
  appleLogo: {
    fontSize: 24,
    lineHeight: 24,
  },
  googleBtnText: {
    fontSize: 17,
    letterSpacing: -0.2,
  },

  /* Legal */
  legalText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    letterSpacing: 0.1,
  },
  legalLink: {
    fontWeight: "500",
  },
});
