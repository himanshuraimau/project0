import { Link, useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import {
  Mic,
  FileText,
  MessageSquare,
  BrainCircuit,
  Headphones,
  Layers,
  Sparkles,
  BookOpen,
  PenTool,
} from "lucide-react-native";
import { useTheme } from "@/lib/hooks/useTheme";
import { neutral } from "@/lib/design-system";
import {
  Animated,
  authEntrance,
  welcomeEntrance,
  usePressScale,
} from "@/lib/ui/auth-animations";

const { width: SCREEN_W } = Dimensions.get("window");
const EDGE = 24;
const TILE_GAP = 10;
const TILES_PER_ROW = 4;
const TILE_SIZE =
  (SCREEN_W - EDGE * 2 - TILE_GAP * (TILES_PER_ROW - 1)) / TILES_PER_ROW;

/* ── Feature tiles surrounding the app icon ─────────────────────────── */
const FEATURES = [
  { icon: Mic, label: "Record" },
  { icon: FileText, label: "Notes" },
  { icon: Sparkles, label: "AI" },
  { icon: BrainCircuit, label: "Quiz" },
  { icon: PenTool, label: "Flash" },
  { icon: null, label: "" }, // center — app icon goes here
  { icon: null, label: "" }, // center — app icon spans these
  { icon: Headphones, label: "Podcast" },
  { icon: MessageSquare, label: "Chat" },
  { icon: Layers, label: "Folders" },
  { icon: BookOpen, label: "Study" },
  { icon: FileText, label: "PDF" },
] as const;

export default function WelcomeScreen() {
  const router = useRouter();
  const { theme, mode } = useTheme();
  const isDark = mode === "dark";
  const c = theme.colors;
  const t = theme.typography;
  const [ctaScale, ctaPressIn, ctaPressOut] = usePressScale();

  const onGetStarted = useCallback(
    () => router.push("/(auth)/sign-up" as any),
    [router]
  );

  // Tile styling
  const tileBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)";
  const tileBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
  const iconColor = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)";
  const labelColor = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.35)";

  // App icon shadow
  const appIconShadow = isDark
    ? {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 24,
        elevation: 12,
      }
    : {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 12,
      };

  // CTA secondary style — visible border
  const secondaryBorder = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)";

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: isDark ? neutral[950] : "#fafafa" },
      ]}
    >
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* ── Top Bar: Logo + Log in pill ──────────────────────── */}
          <Animated.View entering={authEntrance.logo} style={styles.topBar}>
            <View style={styles.topLeft}>
              <Image
                source={require("../../assets/images/main-logo.png")}
                style={styles.logoImg}
                resizeMode="contain"
              />
              <Text
                style={[
                  styles.logoText,
                  { color: c.foreground, fontWeight: t.weightBold },
                ]}
              >
                flinote
              </Text>
            </View>
            <Link href="/(auth)/sign-in" asChild>
              <Pressable
                style={({ pressed }) => [
                  styles.logInPill,
                  {
                    borderColor: secondaryBorder,
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.logInText,
                    { color: c.foreground, fontWeight: t.weightMedium },
                  ]}
                >
                  Log in
                </Text>
              </Pressable>
            </Link>
          </Animated.View>

          {/* ── Feature Grid with Floating App Icon ──────────────── */}
          <View style={styles.gridSection}>
            <View style={styles.gridWrap}>
              {/* Tile grid — 3 rows of 4 */}
              <View style={styles.grid}>
                {FEATURES.map((feat, i) => {
                  // Skip the center placeholder slots (index 5, 6)
                  if (feat.icon === null) {
                    return (
                      <View
                        key={`empty-${i}`}
                        style={{ width: TILE_SIZE, height: TILE_SIZE }}
                      />
                    );
                  }

                  const Icon = feat.icon;
                  return (
                    <Animated.View
                      key={feat.label}
                      entering={welcomeEntrance.tile(i)}
                    >
                      <View
                        style={[
                          styles.tile,
                          {
                            width: TILE_SIZE,
                            height: TILE_SIZE,
                            backgroundColor: tileBg,
                            borderColor: tileBorder,
                          },
                        ]}
                      >
                        <Icon size={22} color={iconColor} strokeWidth={1.6} />
                        <Text style={[styles.tileLabel, { color: labelColor }]}>
                          {feat.label}
                        </Text>
                      </View>
                    </Animated.View>
                  );
                })}
              </View>

              {/* Floating app icon — centered over the grid */}
              <Animated.View
                entering={welcomeEntrance.appIcon}
                style={[styles.appIconWrap, appIconShadow]}
              >
                <Image
                  source={require("../../assets/images/main-logo.png")}
                  style={styles.appIcon}
                  resizeMode="contain"
                />
              </Animated.View>
            </View>
          </View>

          {/* ── Copy Block ───────────────────────────────────────── */}
          <Animated.View
            entering={welcomeEntrance.copy}
            style={styles.copyBlock}
          >
            <Text style={[styles.welcomeLabel, { color: c.mutedForeground }]}>
              Welcome to Flinote
            </Text>
            <Text
              style={[
                styles.headline,
                { color: c.foreground, fontWeight: t.weightBold },
              ]}
            >
              Turn anything into{"\n"}instant notes.
            </Text>
            <Text style={[styles.body, { color: c.mutedForeground }]}>
              Upload anything, AI turns it into study-ready notes, flashcards and quizzes.
            </Text>
          </Animated.View>
        </ScrollView>

        {/* ── Bottom CTAs — pinned ───────────────────────────────── */}
        <Animated.View
          entering={welcomeEntrance.bottomBar}
          style={styles.bottomBar}
        >
          {/* Get Started — solid brand */}
          <Animated.View
            entering={authEntrance.button}
            style={[ctaScale, { flex: 1 }]}
          >
            <Pressable
              onPress={onGetStarted}
              onPressIn={ctaPressIn}
              onPressOut={ctaPressOut}
              style={({ pressed }) => [
                styles.btnPrimary,
                {
                  backgroundColor: c.foreground,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.btnPrimaryText,
                  { color: c.background, fontWeight: t.weightSemibold },
                ]}
              >
                Get started
              </Text>
            </Pressable>
          </Animated.View>

          {/* Sign in — outlined */}
          <Animated.View entering={authEntrance.footer} style={styles.btnSecondaryWrap}>
            <Pressable
              onPress={() => router.push('/(auth)/sign-in' as any)}
              style={({ pressed }) => [
                styles.btnSecondary,
                {
                  borderColor: secondaryBorder,
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              <Text style={[styles.btnSecondaryText, { color: c.foreground, fontWeight: t.weightSemibold }]}>
                Sign in
              </Text>
              <Feather name="arrow-right" size={17} color={c.foreground} />
            </Pressable>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

/* ── Styles ───────────────────────────────────────────────────────────── */
const APP_ICON_SIZE = TILE_SIZE * 2 + TILE_GAP;

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: EDGE,
  },

  /* Top bar */
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 4,
    marginBottom: 32,
  },
  topLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoImg: { width: 32, height: 32, borderRadius: 8 },
  logoText: { fontSize: 20, letterSpacing: -0.3 },
  logInPill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  logInText: { fontSize: 15 },

  /* Grid section */
  gridSection: { marginBottom: 36 },
  gridWrap: { position: "relative" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: TILE_GAP,
  },
  tile: {
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.1,
  },

  /* Floating app icon */
  appIconWrap: {
    position: "absolute",
    width: APP_ICON_SIZE,
    height: APP_ICON_SIZE,
    // Center it over the middle 2 tiles (row 2, cols 2-3)
    // Row 2 starts at: TILE_SIZE + TILE_GAP (one row down)
    // Col 2 starts at: TILE_SIZE + TILE_GAP (one tile in)
    top: TILE_SIZE + TILE_GAP,
    left: TILE_SIZE + TILE_GAP,
    borderRadius: 28,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  appIcon: {
    width: APP_ICON_SIZE * 0.7,
    height: APP_ICON_SIZE * 0.7,
    borderRadius: 20,
  },

  /* Copy */
  copyBlock: {
    alignItems: "center",
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  welcomeLabel: {
    fontSize: 16,
    letterSpacing: 0.1,
    marginBottom: 8,
  },
  headline: {
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
    textAlign: "center",
    marginBottom: 14,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 320,
    letterSpacing: 0.05,
  },

  /* Bottom CTAs */
  bottomBar: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: EDGE,
    paddingTop: 12,
    paddingBottom: 8,
  },
  btnPrimary: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimaryText: { fontSize: 17 },
  btnSecondaryWrap: { flex: 1 },
  btnSecondary: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  btnSecondaryText: { fontSize: 17 },
});
