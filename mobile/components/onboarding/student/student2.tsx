import React, { useState } from 'react'
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'

export default function Student2() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)

  const OPTIONS = [
    { id: 'senior', icon: '🎓', label: 'Senior / 4th+ year' },
    { id: 'junior', icon: '🎓', label: 'Junior / 3rd year' },
    { id: 'sophomore', icon: '🎓', label: 'Soph / 2nd year' },
    { id: 'freshman', icon: '🌱', label: 'Freshman / 1st year' },
    { id: 'graduate', icon: '🎓', label: 'Graduate school' },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.statusBar}>
        <Text style={styles.time}>1:11</Text>
        <View style={styles.statusIcons}>
          <Text style={styles.icon}>📶</Text>
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

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.content}>
        <Text style={styles.context}>Personalizing Jellinote for you...</Text>
        <Text style={styles.title}>What year are you in?</Text>

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
          <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/(onboarding)/student-flow/student3' as any)}>
            <LinearGradient colors={["#3B82F6", "#7C3AED"]} style={styles.continueButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.continueText}>Continue</Text>
              <Text style={styles.continueArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.gesture} />
    </SafeAreaView>
  )
}

const PURPLE = '#7C3AED'
const BG = '#F8F8FA'

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
  progressFill: { width: '35%', height: '100%', backgroundColor: PURPLE },
  scrollContent: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20 },
  context: { color: PURPLE, fontSize: 13, fontWeight: '500', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  options: { marginTop: 6, gap: 12 },
  option: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E6E6F0', marginBottom: 12 },
  optionSelected: { borderColor: PURPLE, backgroundColor: '#FBF7FF' },
  optionIcon: { fontSize: 18, marginRight: 12 },
  optionLabel: { fontSize: 16, color: '#111827', flex: 1 },
  footer: { paddingHorizontal: 20, paddingBottom: 10 },
  continueButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12 },
  continueText: { color: '#fff', fontSize: 16, fontWeight: '600', marginRight: 6 },
  continueArrow: { color: '#fff', fontSize: 18, fontWeight: '600' },
  gesture: { height: 6, backgroundColor: '#E9E9EF', marginHorizontal: 110, borderRadius: 3, marginTop: 10, marginBottom: Platform.OS === 'ios' ? 16 : 8 },
})
