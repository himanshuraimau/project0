import React, { useState } from 'react'
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'

export default function Student3() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)

  const OPTIONS = [
    { id: 'arts', icon: '🎨', label: 'Arts & Humanities' },
    { id: 'business', icon: '💼', label: 'Business & Economics' },
    { id: 'education', icon: '🎓', label: 'Education' },
    { id: 'engineering', icon: '⚙️', label: 'Engineering & Technology' },
    { id: 'health', icon: '❤️', label: 'Health & Medicine' },
    { id: 'law', icon: '⚖️', label: 'Law & Criminal Justice' },
    { id: 'sciences', icon: '🔬', label: 'Life & Physical Sciences' },
    { id: 'other', icon: '🌐', label: 'Other' },
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
        <Text style={styles.context}>Personalizing Jellinote for you...</Text>
        <Text style={styles.title}>What is your major or primary area of study?</Text>

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

      {selected && (
        <View style={styles.footer}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/(onboarding)/student-flow/student4' as any)}>
            <LinearGradient colors={["#3B82F6", "#7C3AED"]} style={styles.continueButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.continueText}>Continue</Text>
              <Text style={styles.continueArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

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
  progressTrack: { height: 8, backgroundColor: '#F3EFFF', borderRadius: 6, overflow: 'hidden' },
  progressFill: { width: '45%', height: '100%', backgroundColor: PURPLE },
  scrollContent: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 24 },
  context: { color: '#7C3AED', fontSize: 13, fontWeight: '500', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 16 },
  options: { marginTop: 6, gap: 12 },
  option: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#F0EEF8', marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.03, shadowOffset: { width: 0, height: 1 }, shadowRadius: 2, elevation: 1 },
  optionSelected: { borderColor: PURPLE, backgroundColor: '#FBF7FF' },
  optionIcon: { fontSize: 18, marginRight: 12, width: 28, textAlign: 'center' },
  optionLabel: { fontSize: 16, color: '#111827', flex: 1 },
  footer: { paddingHorizontal: 20, paddingBottom: 10 },
  continueButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12 },
  continueText: { color: '#fff', fontSize: 16, fontWeight: '600', marginRight: 6 },
  continueArrow: { color: '#fff', fontSize: 18, fontWeight: '600' },
  rightGradient: { position: 'absolute', right: -40, top: 80, width: 220, height: 420, borderRadius: 220, backgroundColor: '#F5EEFF', opacity: 0.7, transform: [{ rotate: '25deg' }] },
  gesture: { height: 6, backgroundColor: '#E9E9EF', marginHorizontal: 110, borderRadius: 3, marginTop: 10, marginBottom: Platform.OS === 'ios' ? 16 : 8 },
})
