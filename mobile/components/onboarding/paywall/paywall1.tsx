import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

export default function Paywall1() {
  const router = useRouter()

  return (
    <LinearGradient colors={["#FFFFFF", "#F7F5FF"]} start={{ x: 1, y: 0 }} end={{ x: 0.3, y: 1 }} style={styles.container}>
      <StatusBar barStyle="dark-content" />

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
          <LinearGradient colors={["#7C3AED", "#3B82F6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cta}>
            <Text style={styles.ctaText}>Try for FREE</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  pillSmall: {
    backgroundColor: '#D1D5DC',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillSmallText: {
    fontFamily: 'Arimo',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 16,
    color: '#4A5565',
    textAlign: 'left',
  },
  title: { fontSize: 28, fontWeight: '800', color: '#0F172A', marginBottom: 12, textAlign: 'center' },
  description: { fontSize: 16, color: '#374151', textAlign: 'center', marginBottom: 20 },
  freeHighlight: { color: '#7C3AED', fontWeight: '800' },
  featureRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  featurePill: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  featureText: { color: '#374151', fontWeight: '600' },
  bottom: { paddingHorizontal: 24, paddingBottom: 56, paddingTop: 12 },
  cta: { paddingVertical: 16, borderRadius: 28, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  homeIndicator: { height: 4, width: 140, backgroundColor: '#D1D5DB', borderRadius: 2, alignSelf: 'center', marginTop: 12 },
})
