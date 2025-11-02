import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

export default function Paywall3() {
  const router = useRouter()

  return (
    <LinearGradient colors={["#FFFFFF", "#F7F5FF"]} start={{ x: 1, y: 0 }} end={{ x: 0.3, y: 1 }} style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Status */}
      <View style={styles.statusBar}>
        <View style={styles.timeBg}><Text style={styles.timeText}>4:23</Text></View>
        <View style={styles.statusRight}>
          <Ionicons name="wifi" size={16} color="#000" style={{ marginRight: 8 }} />
          <Ionicons name="battery-full" size={18} color="#000" />
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeX}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Back to school sale free for 3 days</Text>

        <View style={styles.cardPrimary}>
          <View style={styles.cardTag}><Text style={styles.cardTagText}>BEST DEAL</Text></View>
          <View style={styles.cardRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.planTitle}>Back to school plan</Text>
              <Text style={styles.planSubtitle}>Billed yearly as $72</Text>
            </View>
            <View>
              <Text style={styles.planPrice}>$6 / month</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardSecondary}>
          <View style={styles.cardRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.planTitle}>Monthly Plan</Text>
            </View>
            <View>
              <Text style={styles.planPrice}>$11 / month</Text>
            </View>
          </View>
        </View>

        <View style={styles.paymentInfo}>
          <Ionicons name="checkbox-outline" size={18} color="#10B981" style={{ marginRight: 8 }} />
          <Text style={styles.paymentText}>No payment due now</Text>
        </View>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity activeOpacity={0.9} onPress={() => router.replace('/(onboarding)/paywall/paywall4' as any)}>
          <LinearGradient colors={["#7C3AED", "#3B82F6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cta}>
            <Text style={styles.ctaText}>Try 3 days FREE 🔥</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.homeIndicator} />
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  statusBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 50 : 18 },
  timeBg: { backgroundColor: '#DC2626', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  timeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  statusRight: { flexDirection: 'row', alignItems: 'center' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  closeX: { color: '#6B7280', fontWeight: '700' },
  content: { paddingHorizontal: 24, paddingTop: 40 },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginBottom: 20 },
  cardPrimary: { backgroundColor: '#F5F3FF', borderRadius: 14, padding: 16, marginBottom: 12, position: 'relative' },
  cardTag: { position: 'absolute', left: 12, top: 12, backgroundColor: '#7C3AED', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  cardTagText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  planTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  planSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  planPrice: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  cardSecondary: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 12 },
  paymentInfo: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, marginTop: 8 },
  paymentText: { color: '#6B7280', fontWeight: '600' },
  bottom: { paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 20 : 16, paddingTop: 12 },
  cta: { paddingVertical: 16, borderRadius: 28, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  homeIndicator: { height: 4, width: 140, backgroundColor: '#D1D5DB', borderRadius: 2, alignSelf: 'center', marginTop: 12 },
})
