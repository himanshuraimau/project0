import React, { useState } from 'react'
import { SafeAreaView, View, Text, TouchableOpacity, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurGradient } from '../../ui/BlurGradient'
import styles from '../onboarding-styles/student3'

export default function Student3() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)

  const OPTIONS = [
    { id: 'arts', icon: '🎨', label: 'Arts & Humanities', iconBg: '#FFEDD4' },
    { id: 'business', icon: '💼', label: 'Business & Economics', iconBg: '#FEF3C6' },
    { id: 'education', icon: '🎓', label: 'Education', iconBg: '#FFE2E2' },
    { id: 'engineering', icon: '⚙️', label: 'Engineering & Technology', iconBg: '#D1D5DC' },
    { id: 'health', icon: '❤️', label: 'Health & Medicine', iconBg: '#FFE2E2' },
    { id: 'law', icon: '⚖️', label: 'Law & Criminal Justice', iconBg: '#D1D5DC' },
    { id: 'sciences', icon: '🧪', label: 'Life & Physical Sciences', iconBg: '#DBEAFE' },
    { id: 'other', icon: '🌍', label: 'Other', iconBg: '#BEDBFF' },
  ]

  return (
    <SafeAreaView style={styles.container}>
      {/* Teal-Blue blur gradient - Bottom */}
      <BlurGradient
        colors={['#14C3A2', '#4C57FF']}
        width={256}
        height={256}
        opacity={0.1}
        left={-59}
        top={646}
      />

      {/* Purple blur gradient - Top */}
      <BlurGradient
        colors={['#9810FA', '#441AFF']}
        width={256}
        height={256}
        opacity={0.1}
        left={226}
        top={217}
      />

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
                <Text style={[styles.optionIcon, { backgroundColor: o.iconBg }]}>{o.icon}</Text>
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

      <View style={styles.gesture} />
    </SafeAreaView>
  )
}

// styles imported from onboarding-styles/student3
