import React, { useState } from 'react'
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'

export default function Student6() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)

  const OPTIONS = [
    { id: 'class', icon: '📗', label: 'Yes, a specific class' },
    { id: 'exam', icon: '📄', label: 'Yes, an upcoming exam' },
    { id: 'else', icon: '👀', label: 'Yes, something else' },
    { id: 'general', icon: '📝', label: 'No, just generally help me' },
  ]

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

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.content}>
        <Text style={styles.context}>Personalizing Jellinote for you...</Text>
        <Text style={styles.title}>Do you want us to focus on a class or an exam?</Text>

        <View style={styles.options}>
          {OPTIONS.map((o) => {
            const sel = selected === o.id
            return (
              <TouchableOpacity
                key={o.id}
                activeOpacity={0.85}
                onPress={() => setSelected(o.id)}
                style={[styles.option, sel && styles.optionSelected]}
              >
                <Text style={styles.optionIcon}>{o.icon}</Text>
                <Text style={styles.optionLabel}>{o.label}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/(onboarding)/student-flow/student7' as any)}>
          <View style={styles.cta}>
            <Text style={styles.ctaText}>Continue</Text>
            <Text style={styles.ctaArrow}>→</Text>
          </View>
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
  progressFill: { width: '92%', height: '100%', backgroundColor: PURPLE },
  scrollContent: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 24 },
  context: { color: '#7C3AED', fontSize: 13, fontWeight: '500', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 16 },
  options: { marginTop: 6, gap: 12 },
  option: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#F0EEF8', marginBottom: 12 },
  optionSelected: { borderColor: PURPLE, backgroundColor: '#FBF7FF' },
  optionIcon: { fontSize: 18, marginRight: 12, width: 28, textAlign: 'center' },
  optionLabel: { fontSize: 16, color: '#111827', flex: 1 },
  footer: { paddingHorizontal: 20, paddingBottom: 14 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E6E6F0' },
  ctaText: { color: '#111827', fontSize: 16, fontWeight: '700', marginRight: 8 },
  ctaArrow: { color: '#111827', fontSize: 18, fontWeight: '700' },
  leftGradient: { position: 'absolute', left: -40, top: 80, width: 220, height: 420, borderRadius: 220, backgroundColor: '#F5EEFF', opacity: 0.7, transform: [{ rotate: '-25deg' }] },
  homeIndicator: { height: 6, backgroundColor: '#E9E9EF', marginHorizontal: 110, borderRadius: 3, marginTop: 10, marginBottom: Platform.OS === 'ios' ? 24 : 8 },
})
