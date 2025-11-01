import React, { useState } from 'react'
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'

export default function Student8() {
  const router = useRouter()
  const [gpa, setGpa] = useState<number>(3.8)

  const dec = () => setGpa((v) => Math.max(0, Math.round((v - 0.1) * 10) / 10))
  const inc = () => setGpa((v) => Math.min(4.0, Math.round((v + 0.1) * 10) / 10))

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.statusBar}>
        <Text style={styles.timeWrap}><Text style={styles.time}>4:22</Text></Text>
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

      <View style={styles.content}>
        <Text style={styles.context}>Personalizing Jellinote for you...</Text>
        <Text style={styles.title}>What is your goal GPA?</Text>

        <View style={styles.gpaWrap}>
          <TouchableOpacity style={styles.gpaButton} onPress={dec} activeOpacity={0.8}>
            <Text style={styles.gpaButtonText}>−</Text>
          </TouchableOpacity>

          <View style={styles.gpaValueWrap}>
            <Text style={styles.gpaValue}>{gpa.toFixed(1)}</Text>
          </View>

          <TouchableOpacity style={styles.gpaButton} onPress={inc} activeOpacity={0.8}>
            <Text style={styles.gpaButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/(onboarding)/student-flow/student9' as any)}>
          <LinearGradient colors={["#7C3AED", "#3B82F6"]} style={styles.cta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.ctaText}>Continue</Text>
            <Text style={styles.ctaArrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.leftGradient} pointerEvents="none" />
      <View style={styles.homeIndicator} />
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
  progressFill: { width: '100%', height: '100%', backgroundColor: PURPLE },
  content: { paddingHorizontal: 20, paddingTop: 18, flex: 1, alignItems: 'center' },
  context: { color: '#7C3AED', fontSize: 13, fontWeight: '500', marginBottom: 8, alignSelf: 'flex-start' },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 6, alignSelf: 'flex-start' },
  gpaWrap: { flexDirection: 'row', alignItems: 'center', marginTop: 24, justifyContent: 'center' },
  gpaButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginHorizontal: 12 },
  gpaButtonText: { fontSize: 32, color: '#111827', fontWeight: '700' },
  gpaValueWrap: { minWidth: 120, alignItems: 'center', justifyContent: 'center' },
  gpaValue: { fontSize: 48, color: PURPLE, fontWeight: '800' },
  footer: { paddingHorizontal: 20, paddingBottom: 18 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700', marginRight: 8 },
  ctaArrow: { color: '#fff', fontSize: 18, fontWeight: '700' },
  leftGradient: { position: 'absolute', left: -40, top: 80, width: 220, height: 420, borderRadius: 220, backgroundColor: '#F5EEFF', opacity: 0.7, transform: [{ rotate: '-25deg' }] },
  homeIndicator: { height: 6, backgroundColor: '#E9E9EF', marginHorizontal: 110, borderRadius: 3, marginTop: 10, marginBottom: Platform.OS === 'ios' ? 24 : 8 },
})
