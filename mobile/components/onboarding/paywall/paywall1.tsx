import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useTheme } from '@/lib/hooks/useTheme'

export default function Paywall1() {
  const router = useRouter()
  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    statusBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 50 : 18,
    },
    statusLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    timeBg: {
      backgroundColor: c.destructive,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    timeText: { color: c.background, fontWeight: '500', fontSize: 14 },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    pillSmall: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : c.muted,
      borderWidth: 0.5,
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)',
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 6,
      marginBottom: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    pillSmallText: {
      fontFamily: 'Inter',
      fontStyle: 'normal',
      fontWeight: '400',
      fontSize: 16,
      lineHeight: 16,
      color: c.mutedForeground,
      textAlign: 'left',
    },
    title: { fontSize: 28, fontWeight: '500', color: c.foreground, marginBottom: 12, textAlign: 'center' },
    description: { fontSize: 16, color: c.foreground, textAlign: 'center', marginBottom: 20 },
    freeHighlight: { color: c.primary, fontWeight: '500' },
    featureRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    featurePill: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : c.muted,
      borderWidth: 0.5,
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
    },
    featureText: { color: c.foreground, fontWeight: '600' },
    bottom: { paddingHorizontal: 24, paddingBottom: 56, paddingTop: 12 },
    cta: { backgroundColor: c.primary, borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
    ctaText: { color: c.primaryForeground, fontWeight: '500', fontSize: 16 },
    homeIndicator: { height: 4, width: 140, backgroundColor: c.border, borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  })

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Offer content */}
      <View style={styles.content}>
        <View style={styles.pillSmall}>
          <Text style={styles.pillSmallText}>LIMITED TIME</Text>
        </View>

        <Text style={styles.title}>Back-to-school offer</Text>

        <Text style={styles.description}>
          Try Flinote <Text style={styles.freeHighlight}>free</Text> for 3 days.
        </Text>

        <View style={styles.featureRow}>
          <View style={styles.featurePill}><Text style={styles.featureText}>Instant notes</Text></View>
          <View style={styles.featurePill}><Text style={styles.featureText}>PDFs & links</Text></View>
          <View style={styles.featurePill}><Text style={styles.featureText}>Flashcards</Text></View>
        </View>
      </View>

      {/* CTA */}
      <View style={styles.bottom}>
        <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/(onboarding)/paywall/paywall2' as any)}>
          <View style={styles.cta}>
            <Text style={styles.ctaText}>Try for FREE</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  )
}
