import React from 'react'
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'

export default function Parent4() {
  const router = useRouter()
  const handleContinue = () => {
    router.push('/(onboarding)/parent/parent5' as any)
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.statusBar}>
        <Text style={styles.time}>6:10</Text>
        <View style={styles.statusIcons}>
          <Text style={styles.icon}>📶</Text>
          <Text style={styles.icon}>📡</Text>
          <Text style={styles.icon}>🔋</Text>
        </View>
      </View>

      <View style={styles.header}>
        <Text style={styles.back}>&lt;</Text>
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.context}>Personalizing Jellinote for you...</Text>
        <Text style={styles.title}>You're in the right place.</Text>

        <View style={styles.testimonialCard}>
          <View style={styles.cardHeader}>
            <View style={styles.nameSection}>
              <Text style={styles.cardName}>Jessica Cole</Text>
              <Text style={styles.cardTitle}>Mom of 4</Text>
            </View>
            <View style={styles.starsContainer}>
              <Text style={styles.star}>⭐</Text>
              <Text style={styles.star}>⭐</Text>
              <Text style={styles.star}>⭐</Text>
              <Text style={styles.star}>⭐</Text>
              <Text style={styles.star}>⭐</Text>
            </View>
          </View>

          <Text style={styles.quote}>
            "Started out for my oldest, but now everyone's hooked. It's been such a great tool for all my kids in school."
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity activeOpacity={0.85} onPress={handleContinue}>
          <LinearGradient colors={["#3B82F6", "#7C3AED"]} style={styles.continueButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.continueText}>Continue</Text>
            <Text style={styles.continueArrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.gesture} />
    </SafeAreaView>
  )
}

const PURPLE = '#7C3AED'
const BG = '#F7F5FF'
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  statusBar: {
    height: Platform.OS === 'ios' ? 44 : 28,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  time: { fontSize: 14, fontWeight: '600' },
  statusIcons: { flexDirection: 'row' },
  icon: { marginLeft: 8, fontSize: 14 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 },
  back: { fontSize: 22, marginRight: 12 },
  progressWrap: { flex: 1, paddingRight: 16 },
  progressTrack: { height: 6, backgroundColor: '#EEE8FF', borderRadius: 6, overflow: 'hidden' },
  progressFill: { width: '82%', height: '100%', backgroundColor: PURPLE },
  content: { paddingHorizontal: 20, paddingTop: 18, flex: 1 },
  context: { color: '#9B6BFF', fontSize: 13, fontWeight: '500', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 16 },
  testimonialCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  nameSection: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  cardTitle: { fontSize: 14, color: '#6B7280' },
  starsContainer: { flexDirection: 'row', gap: 4 },
  star: { fontSize: 16 },
  quote: { fontSize: 15, fontWeight: '500', color: '#374151', lineHeight: 22, fontStyle: 'italic' },
  footer: { paddingHorizontal: 16, paddingBottom: 20 },
  continueButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14 },
  continueText: { color: '#FFF', fontSize: 16, fontWeight: '700', marginRight: 8 },
  continueArrow: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  gesture: { height: 6, backgroundColor: '#E5E7EB', marginHorizontal: 120, borderRadius: 3, marginTop: 8 },
})
