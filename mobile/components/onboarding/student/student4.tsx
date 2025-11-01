import React from 'react'
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'

export default function Student4() {
  const router = useRouter()

  const BULLETS = [
    'Take detailed lecture notes',
    'Make AI practice exams',
    'Get detailed transcripts',
    'Chat with long PDFs & docs',
  ]

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.statusBar}>
        <Text style={styles.timeWrap}><Text style={styles.time}>4:21</Text></Text>
        <View style={styles.statusIcons}>
          <Text style={styles.icon}>📶</Text>
          <Text style={styles.icon}>🔋</Text>
        </View>
      </View>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.back}>&lt;</Text>
        </TouchableOpacity>
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.content}>
        <Text style={styles.title}>You're in good company!</Text>
        <Text style={styles.subtitle}>Thousands of students and math students use Jellinote to:</Text>

        <View style={styles.bullets}>
          {BULLETS.map((b, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={styles.checkWrap}><Text style={styles.check}>✓</Text></View>
              <Text style={styles.bulletText}>{b}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/(onboarding)/student-flow/student5' as any)}>
          <LinearGradient colors={["#7C3AED", "#3B82F6"]} style={styles.cta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.ctaText}>Continue</Text>
            <Text style={styles.ctaArrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.rightGradient} pointerEvents="none" />
      <View style={styles.gesture} />
    </SafeAreaView>
  )
}

const PURPLE = '#7C3AED'
const BG = '#FFFFFF'

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  statusBar: {
    height: Platform.OS === 'ios' ? 44 : 28,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeWrap: { backgroundColor: '#FF4D4F', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  time: { color: '#fff', fontWeight: '700', fontSize: 13 },
  statusIcons: { flexDirection: 'row' },
  icon: { marginLeft: 8, fontSize: 14 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 },
  back: { fontSize: 22, marginRight: 12 },
  progressWrap: { flex: 1, paddingRight: 16 },
  progressTrack: { height: 10, backgroundColor: '#F3EFFF', borderRadius: 6, overflow: 'hidden' },
  progressFill: { width: '65%', height: '100%', backgroundColor: PURPLE },
  scrollContent: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 24 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 10 },
  subtitle: { color: '#7C3AED', fontSize: 14, marginBottom: 14 },
  bullets: { marginTop: 8, gap: 12 },
  bulletRow: { flexDirection: 'row', alignItems: 'center' },
  checkWrap: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  check: { color: '#10B981', fontWeight: '700' },
  bulletText: { flex: 1, fontSize: 16, color: '#111827' },
  footer: { paddingHorizontal: 20, paddingBottom: 12 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700', marginRight: 8 },
  ctaArrow: { color: '#fff', fontSize: 18, fontWeight: '700' },
  rightGradient: { position: 'absolute', right: -40, top: 80, width: 220, height: 420, borderRadius: 220, backgroundColor: '#F5EEFF', opacity: 0.7, transform: [{ rotate: '25deg' }] },
  gesture: { height: 6, backgroundColor: '#E9E9EF', marginHorizontal: 110, borderRadius: 3, marginTop: 10, marginBottom: Platform.OS === 'ios' ? 16 : 8 },
})
