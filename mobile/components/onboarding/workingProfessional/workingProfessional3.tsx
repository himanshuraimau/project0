import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { BlurGradient } from '../../ui/BlurGradient'
import { ContinueButton } from '../../ui/ContinueButton'
import { ChevronLeft } from 'lucide-react-native'

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

      {/* Gaussian Blur 1 - Purple */}
      <BlurGradient
        colors={['#9810FA', '#441AFF']}
        width={286}
        height={256}
        opacity={0.1}
        right={-64}
        top={110}
      />

      {/* Gaussian Blur 2 - Blue-Green */}
      <BlurGradient
        colors={['#14C3A2', '#4C57FF']}
        width={256}
        height={256}
        opacity={0.1}
        left={-97}
        top={440}
      />

      {/* Header */}
      <View style={styles.header}>
        <ChevronLeft size={28} color="#000000" style={{ marginRight: 12 }} />
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
        <ContinueButton
          variant="white"
          onPress={() => router.push('/(onboarding)/workingProfessional/workingProfessional4' as any)}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F5FF' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 12 },
  back: { fontSize: 22, marginRight: 16, color: '#0F172A' },
  progressContainer: { flex: 1 },
  progressTrack: { height: 6, backgroundColor: '#E6E7F0', borderRadius: 6, overflow: 'hidden' },
  progressFill: { width: '25%', height: '100%', backgroundColor: '#7C3AED' },
  content: { paddingHorizontal: 24, paddingTop: 20 },
  contextText: {
    color: '#7C3AED',
    fontSize: 15,
    fontFamily: 'Arimo',
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 8,
  },
  question: { fontSize: 22, fontWeight: '700', color: '#0F172A', marginBottom: 18 },
  options: { marginTop: 6 },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 0,
    paddingVertical: 0,
    gap: 12,
    width: 310,
    height: 61.6,
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderWidth: 0.8,
    borderRadius: 14,
    marginBottom: 12,
  },
  optionIcon: {
    fontSize: 20,
    fontFamily: 'Arimo',
    fontWeight: '400',
    lineHeight: 28,
    color: '#0A0A0A',
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Arimo',
    fontWeight: '400',
    lineHeight: 24,
    color: '#101828',
    flex: 1,
  },
  optionSelected: { borderColor: '#7C3AED', backgroundColor: '#FEF8FF' },
  footer: { paddingHorizontal: 24, paddingBottom: 18 },
  continueButton: {
    width: 310,
    height: 55.98,
    backgroundColor: '#FFFFFF',
    borderRadius: 49067700,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.2,
    elevation: 3,
  },
  continueText: {
    color: '#000000',
    fontSize: 20,
    fontFamily: 'Arimo',
    fontWeight: '700',
    lineHeight: 24,
    marginRight: 4,
  },
  continueArrow: {
    color: '#000000',
    fontSize: 20,
    fontFamily: 'Arimo',
    fontWeight: '700',
    lineHeight: 24,
  },
})
