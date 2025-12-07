import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView, SafeAreaView } from 'react-native'
import { useRouter } from 'expo-router'
import { BlurGradient } from '../../ui/BlurGradient'
import { ContinueButton } from '../../ui/ContinueButton'
import { ChevronLeft } from 'lucide-react-native'
import { OptionButton } from '../../ui/OptionButton'

export default function WorkinProfessional3() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)

  const handleContinue = () => {
    // go to workingProfessional4
    router.push('/(onboarding)/workingProfessional/workingProfessional4' as any)
  }

  const options = [
    { id: 'focus', icon: '🎯', text: 'Stay focused during meetings and calls', iconBg: '#FFFFFF' },
    { id: 'autoNotes', icon: '✍️', text: 'Have my notes written automatically', iconBg: '#FFFFFF' },
    { id: 'summarize', icon: '📄', text: 'Summarize documents, videos, / PDFs', iconBg: '#FFFFFF' },
    { id: 'learn', icon: '📚', text: 'Learn and retain information faster', iconBg: '#FFFFFF' },
    { id: 'other', icon: '✏️', text: 'Something else', iconBg: '#FFFFFF' },
  ]

  return (
    <SafeAreaView style={styles.screen}>
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
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={28} color="#000000" style={{ marginRight: 12 }} />
        </TouchableOpacity>
        <View style={styles.progressWrap}>
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
            <OptionButton
              key={o.id}
              icon={o.icon}
              label={o.text}
              iconBg={o.iconBg}
              selected={selected === o.id}
              onPress={() => setSelected(o.id)}
              style={styles.optionOverride}
            />
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={styles.footer}>
        <ContinueButton
          variant="white"
          onPress={handleContinue}
          style={{ borderWidth: 1, borderColor: '#BFBFBF' }}
          disabled={!selected}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F5FF' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 60 },
  back: { fontSize: 22, marginRight: 16, color: '#0F172A' },
  progressWrap: { flex: 1, paddingRight: 16 },
  progressTrack: { height: 6, backgroundColor: '#EEE8FF', borderRadius: 6, overflow: 'hidden' },
  progressFill: { width: '75%', height: '100%', backgroundColor: '#7C3AED' },
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
  options: { marginTop: 6, gap: 12 },
  optionOverride: { height: 70 },
  footer: { paddingHorizontal: 25, paddingBottom: 20 },
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
