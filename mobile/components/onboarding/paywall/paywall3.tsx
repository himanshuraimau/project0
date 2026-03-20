import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { X } from 'lucide-react-native'
import { useTheme } from '@/lib/hooks/useTheme'

export default function Paywall3() {
  const router = useRouter()
  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'

  const [selectedPlan, setSelectedPlan] = React.useState<'yearly' | 'monthly'>('yearly')

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    statusBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 50 : 18 },
    timeBg: { backgroundColor: c.destructive, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    timeText: { color: c.background, fontWeight: '500', fontSize: 14 },
    statusRight: { flexDirection: 'row', alignItems: 'center' },
    closeButton: {
      position: 'absolute',
      top: 48.46,
      right: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(211, 209, 209, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.muted, alignItems: 'center', justifyContent: 'center' },
    closeX: { color: c.mutedForeground, fontWeight: '500' },
    content: { flex: 1, paddingHorizontal: 24, paddingTop: 200 },
    title: { fontSize: 24, fontWeight: '500', color: c.foreground, textAlign: 'center', marginBottom: 60 },
    cardPrimary: {
      borderRadius: 24,
      paddingHorizontal: 21,
      paddingTop: 21,
      paddingBottom: 10,
      marginBottom: 12,
      position: 'relative',
      borderWidth: 1.5,
      borderColor: c.primary,
      backgroundColor: isDark ? 'rgba(130,100,255,0.12)' : c.accent,
      gap: 8,
    },
    cardTag: {
      position: 'absolute',
      left: 20,
      top: -12,
      backgroundColor: c.primary,
      width: 85,
      height: 28,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTagInactive: {
      position: 'absolute',
      left: 20,
      top: -12,
      backgroundColor: c.mutedForeground,
      width: 85,
      height: 28,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTagText: { color: c.primaryForeground, fontWeight: '500', fontSize: 11, lineHeight: 16 },
    cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardRowSecondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 },
    planTitle: { fontSize: 20, fontWeight: '400', color: c.foreground, lineHeight: 30, fontFamily: 'Inter' },
    planSubtitle: { fontSize: 14, color: c.foreground, marginTop: 0, fontWeight: '400', lineHeight: 21, fontFamily: 'Inter' },
    planPrice: { fontSize: 18, fontWeight: '400', color: c.foreground, lineHeight: 27, fontFamily: 'Inter' },
    savingsText: { fontSize: 12, fontWeight: '600', color: c.success, textAlign: 'right', marginTop: 2, fontFamily: 'Inter' },
    cardSecondary: {
      backgroundColor: c.card,
      borderRadius: 24,
      padding: 20,
      marginBottom: 12,
      height: 84,
      borderWidth: 0.5,
      borderColor: c.border,
    },
    cardSecondarySelected: {
      backgroundColor: c.card,
      borderRadius: 24,
      padding: 20,
      marginBottom: 12,
      height: 84,
      borderWidth: 1.5,
      borderColor: c.primary,
    },
    paymentInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
    checkIconWrapper: { width: 20, height: 20, borderRadius: 20, borderWidth: 1.5, borderColor: c.foreground, alignItems: 'center', justifyContent: 'center' },
    paymentText: { color: c.foreground, fontWeight: '400', fontSize: 15, lineHeight: 22, fontFamily: 'Inter' },
    bottom: { paddingHorizontal: 24, paddingBottom: 56, paddingTop: 12 },
    cta: { backgroundColor: c.primary, paddingVertical: 16, borderRadius: 28, alignItems: 'center' },
    ctaText: { color: c.primaryForeground, fontWeight: '500', fontSize: 16 },
    homeIndicator: { height: 4, width: 140, backgroundColor: c.border, borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  })

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Close Button */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => router.push('/(onboarding)/paywall/paywall4' as any)}
      >
        <X size={20} color={c.mutedForeground} strokeWidth={1.7} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Back to school sale free for 3 days</Text>

        <TouchableOpacity activeOpacity={0.9} onPress={() => setSelectedPlan('yearly')}>
          <View style={styles.cardPrimary}>
            <View style={selectedPlan === 'yearly' ? styles.cardTag : styles.cardTagInactive}>
              <Text style={styles.cardTagText}>BEST DEAL</Text>
            </View>
            <View style={styles.cardRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.planTitle}>Yearly Plan</Text>
                <Text style={styles.planSubtitle}>Billed yearly as $89</Text>
              </View>
              <View>
                <Text style={styles.planPrice}>$7.42 / month</Text>
                <Text style={styles.savingsText}>Save $151/year</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.9} onPress={() => setSelectedPlan('monthly')}>
          <View style={selectedPlan === 'monthly' ? styles.cardSecondarySelected : styles.cardSecondary}>
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
            <Ionicons name="checkmark" size={14} color={c.foreground} />
          </View>
          <Text style={styles.paymentText}>No payment due now</Text>
        </View>

        <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/(onboarding)/paywall/paywall4' as any)}>
          <View style={styles.cta}>
            <Text style={styles.ctaText}>Try 3 days FREE 🔥</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  )
}
