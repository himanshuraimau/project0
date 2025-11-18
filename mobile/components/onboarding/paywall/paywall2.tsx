import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

export default function Paywall2() {
  const router = useRouter()

  const FEATURES = [
    'Instant notes',
    'Unlimited notes',
    'Flashcards, Quizzes',
    'AI Mindmaps',
    'Upload images, PDFs',
    'YouTube videos',
    'Chat with notes',
    'Priority support',
  ]

  return (
    <LinearGradient colors={["#FFFFFF", "#F7F5FF"]} start={{ x: 1, y: 0 }} end={{ x: 0.3, y: 1 }} style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.headerTitle}>Unlimited notes, better grades</Text>

        <View style={styles.card}>
          {/* Toggle */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleOption}><Text style={styles.toggleTextInactive}>Basic</Text></View>
            <View style={styles.toggleOptionActive}><Text style={styles.toggleTextActive}>Unlimited</Text></View>
          </View>

          {/* Feature comparison */}
          <View style={styles.featureHeaderRow}>
            <Text style={[styles.featureHeader, { flex: 1 }]}></Text>
            <Text style={[styles.featureHeader, styles.colHeader]}>Basic</Text>
            <Text style={[styles.featureHeader, styles.colHeader]}>Unlimited</Text>
          </View>

          {FEATURES.map((f) => (
            <View key={f} style={styles.featureRow}>
              <Text style={[styles.featureName, { flex: 1 }]}>{f}</Text>
              <Text style={[styles.featureVal, styles.greyCheck]}>✓</Text>
              <Text style={[styles.featureVal, styles.purpleCheck]}>✓</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <TouchableOpacity activeOpacity={0.9} onPress={() => router.replace('/(onboarding)/paywall/paywall3' as any)}>
          <LinearGradient colors={["#7C3AED", "#3B82F6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cta}>
            <Text style={styles.ctaText}>Try 3 days FREE 🔥</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  statusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 50 : 18 },
  statusLeft: { flexDirection: 'row', alignItems: 'center' },
  statusRight: { flexDirection: 'row', alignItems: 'center' },
  timeBg: { backgroundColor: '#DC2626', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  timeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  content: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16, alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 20, color: '#0F172A' },
  card: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 24, elevation: 6 },
  toggleRow: { flexDirection: 'row', backgroundColor: '#F3F4F6', padding: 4, borderRadius: 12, alignSelf: 'center', marginBottom: 12 },
  toggleOption: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8 },
  toggleOptionActive: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#7C3AED' },
  toggleTextInactive: { color: '#6B7280', fontWeight: '700' },
  toggleTextActive: { color: '#fff', fontWeight: '800' },
  featureHeaderRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', marginBottom: 8, alignItems: 'center' },
  featureHeader: { fontSize: 12, color: '#6B7280', textAlign: 'center' },
  colHeader: { width: 88, textAlign: 'center' },
  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  featureName: { fontSize: 14, color: '#111827' },
  featureVal: { width: 88, textAlign: 'center', fontSize: 16, fontWeight: '700' },
  greyCheck: { color: '#9CA3AF' },
  purpleCheck: { color: '#7C3AED' },
  bottom: { paddingHorizontal: 24, paddingBottom: 56, paddingTop: 12 },
  cta: { paddingVertical: 16, borderRadius: 28, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  homeIndicator: { height: 4, width: 140, backgroundColor: '#D1D5DB', borderRadius: 2, alignSelf: 'center', marginTop: 12 },
})
