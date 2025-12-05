import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { X } from 'lucide-react-native'

export default function Paywall3() {
  const router = useRouter()

  const [selectedPlan, setSelectedPlan] = React.useState<'yearly' | 'monthly'>('yearly')

  return (
    <LinearGradient colors={["#FFFFFF", "#F7F5FF"]} start={{ x: 1, y: 0 }} end={{ x: 0.3, y: 1 }} style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Close Button */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => router.push('/(onboarding)/paywall/paywall4' as any)}
      >
        <X size={20} color="#4A5565" strokeWidth={1.7} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Back to school sale free for 3 days</Text>

        <TouchableOpacity activeOpacity={0.9} onPress={() => setSelectedPlan('yearly')}>
          <LinearGradient
            colors={selectedPlan === 'yearly' ? ['#D8B4FE', '#E9D5FF'] : ['#FFFFFF', '#FFFFFF']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[
              styles.cardPrimary,
              selectedPlan !== 'yearly' && { borderColor: '#E5E7EB' }
            ]}
          >
            <View style={[
              styles.cardTag,
              selectedPlan !== 'yearly' && { backgroundColor: '#9CA3AF' }
            ]}>
              <Text style={styles.cardTagText}>BEST DEAL</Text>
            </View>
            <View style={styles.cardRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.planTitle}>Yearly Plan</Text>
                <Text style={styles.planSubtitle}>Billed yearly as $199.99</Text>
              </View>
              <View>
                <Text style={styles.planPrice}>$16.67 / month</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.9} onPress={() => setSelectedPlan('monthly')}>
          <View style={[
            styles.cardSecondary,
            selectedPlan === 'monthly' && { borderColor: '#7C3AED' }
          ]}>
            <View style={styles.cardRowSecondary}>
              <View style={{ flex: 1 }}>
                <Text style={styles.planTitle}>Monthly Plan</Text>
              </View>
              <View>
                <Text style={styles.planPrice}>$19.99 / month</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.bottom}>
        <View style={styles.paymentInfo}>
          <View style={styles.checkIconWrapper}>
            <Ionicons name="checkmark" size={14} color="#000000" />
          </View>
          <Text style={styles.paymentText}>No payment due now</Text>
        </View>

        <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/(onboarding)/paywall/paywall4' as any)}>
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
  statusBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 50 : 18 },
  timeBg: { backgroundColor: '#DC2626', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  timeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  statusRight: { flexDirection: 'row', alignItems: 'center' },
  closeButton: {
    position: 'absolute',
    top: 48.46,
    right: 20, // Using right instead of left: 329 for responsiveness
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(211, 209, 209, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  closeX: { color: '#6B7280', fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 200 },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginBottom: 60 },
  cardPrimary: { borderRadius: 24, paddingHorizontal: 21, paddingTop: 21, paddingBottom: 10, marginBottom: 12, position: 'relative', borderWidth: 1.5, borderColor: '#7C3AED', gap: 8 },
  cardTag: { position: 'absolute', left: 20, top: -12, backgroundColor: '#6366F1', width: 85, height: 28, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  cardTagText: { color: '#fff', fontWeight: '700', fontSize: 11, lineHeight: 16 },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardRowSecondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, gap: 80 },
  planTitle: { fontSize: 20, fontWeight: '400', color: '#000000', lineHeight: 30, fontFamily: 'Arimo' },
  planSubtitle: { fontSize: 14, color: '#000000', marginTop: 0, fontWeight: '400', lineHeight: 21, fontFamily: 'Arimo' },
  planPrice: { fontSize: 18, fontWeight: '400', color: '#000000', lineHeight: 27, fontFamily: 'Arimo' },
  cardSecondary: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, marginBottom: 12, height: 84, borderWidth: 1.5, borderColor: '#E5E7EB' },
  paymentInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
  checkIconWrapper: { width: 20, height: 20, borderRadius: 20, borderWidth: 1.5, borderColor: '#000000', alignItems: 'center', justifyContent: 'center' },
  paymentText: { color: '#000000', fontWeight: '400', fontSize: 15, lineHeight: 22, fontFamily: 'Arimo' },
  bottom: { paddingHorizontal: 24, paddingBottom: 56, paddingTop: 12 },
  cta: { paddingVertical: 16, borderRadius: 28, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  homeIndicator: { height: 4, width: 140, backgroundColor: '#D1D5DB', borderRadius: 2, alignSelf: 'center', marginTop: 12 },
})
