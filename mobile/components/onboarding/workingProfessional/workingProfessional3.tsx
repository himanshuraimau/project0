import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'

export default function WorkinProfessional3() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)

  const options = [
    { id: 'focus', icon: '🎯', text: 'Stay focused during meetings and calls' },
    { id: 'autoNotes', icon: '✍️', text: 'Have my notes written automatically' },
    { id: 'summarize', icon: '📄', text: 'Summarize documents, videos, / PDFs' },
    { id: 'learn', icon: '📚', text: 'Learn and retain information faster' },
    { id: 'other', icon: '✏️', text: 'Something else' },
  ]

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F5FF" />

      {/* Status imitation */}
      <View style={styles.statusBar}>
        <Text style={styles.time}>6:07</Text>
        <View style={styles.statusRight}>
          <Text style={styles.statusIcon}>📶</Text>
          <Text style={[styles.statusIcon, { marginLeft: 6 }]}>📡</Text>
          <Text style={[styles.statusIcon, { marginLeft: 6 }]}>🔋</Text>
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.back}>{'<'}</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.contextText}>Personalizing Jellinote for you...</Text>
        <Text style={styles.question}>What do you want Jellinote to help with?</Text>

        <View style={styles.options}>
          {options.map((o) => (
            <TouchableOpacity
              key={o.id}
              style={[styles.optionButton, selected === o.id && styles.optionSelected]}
              activeOpacity={0.8}
              onPress={() => setSelected(o.id)}
            >
              <Text style={styles.optionIcon}>{o.icon}</Text>
              <Text style={styles.optionText}>{o.text}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueButton}
          activeOpacity={0.85}
          onPress={() => router.push('/(onboarding)/workingProfessional/workingProfessional4' as any)}
        >
          <Text style={styles.continueText}>Continue</Text>
          <Text style={styles.continueArrow}>→</Text>
        </TouchableOpacity>
        <View style={styles.gestureBar} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F5FF' },
  statusBar: { height: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 6 },
  time: { fontSize: 14, color: '#0F172A', fontWeight: '600' },
  statusRight: { flexDirection: 'row', alignItems: 'center' },
  statusIcon: { fontSize: 13 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 12 },
  back: { fontSize: 22, marginRight: 16, color: '#0F172A' },
  progressContainer: { flex: 1 },
  progressTrack: { height: 6, backgroundColor: '#E6E7F0', borderRadius: 6, overflow: 'hidden' },
  progressFill: { width: '25%', height: '100%', backgroundColor: '#7C3AED' },
  content: { paddingHorizontal: 24, paddingTop: 20 },
  contextText: { color: '#7C3AED', fontSize: 13, marginBottom: 8 },
  question: { fontSize: 22, fontWeight: '700', color: '#0F172A', marginBottom: 18 },
  options: { marginTop: 6 },
  optionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderColor: '#E6E7EE', borderWidth: 1, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, marginBottom: 12 },
  optionIcon: { fontSize: 20, marginRight: 12 },
  optionText: { fontSize: 15, color: '#0F172A', flex: 1 },
  optionSelected: { borderColor: '#7C3AED', backgroundColor: '#FEF8FF' },
  footer: { paddingHorizontal: 24, paddingBottom: 18 },
  continueButton: { backgroundColor: '#FFF', borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  continueText: { color: '#0F172A', fontSize: 16, fontWeight: '700', marginRight: 8 },
  continueArrow: { color: '#0F172A', fontSize: 18, fontWeight: '700' },
  gestureBar: { height: 4, backgroundColor: '#E5E7EB', borderRadius: 3, marginTop: 8, marginHorizontal: 120 },
})
