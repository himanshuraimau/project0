import React, { useState } from 'react'
import { SafeAreaView, View, Text, TouchableOpacity, Platform } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { BlurGradient } from '../../ui/BlurGradient'
import styles from '../onboarding-styles/student1'

export default function Student1() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)

  const handleOptionSelect = (id: string) => {
    setSelected(id)
    router.push('/(onboarding)/student-flow/student2' as any)
  }

  const OPTIONS = [
    { id: 'college', icon: '🏛️', label: 'College / University', iconBg: '#DCFCE7' },
    { id: 'highschool', icon: '🏫', label: 'High school', iconBg: '#DBEAFE' },
    { id: 'middleschool', icon: '📚', label: 'Middle school or earlier', iconBg: '#DCFCE7' },
    { id: 'trade', icon: '🎓', label: 'Trade or professional school', iconBg: '#FFE2E2' },
    { id: 'other', icon: '✏️', label: 'Something else', iconBg: '#FFEDD4' },
  ]

  return (
    <SafeAreaView style={styles.container}>
      {/* Top blur gradient - Purple */}
      <BlurGradient
        colors={['#9810FA', '#441AFF']}
        width={256}
        height={256}
        opacity={0.1}
        left={-97}
        top={120}
      />

      {/* Middle blur gradient - Teal-Blue */}
      <BlurGradient
        colors={['#14C3A2', '#4C57FF']}
        width={256}
        height={256}
        opacity={0.1}
        left={166}
        bottom={-50}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>{'<'}</Text>
        </TouchableOpacity>
        <View style={styles.emptySpace} />
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View>
          <Text style={styles.context}>Personalizing Jellinote for you...</Text>
          <Text style={styles.title}>Where are you in school?</Text>
        </View>

        <View style={styles.options}>
          {OPTIONS.map((o) => {
            const sel = selected === o.id
            return (
              <TouchableOpacity
                key={o.id}
                activeOpacity={0.85}
                onPress={() => handleOptionSelect(o.id)}
                style={[styles.option, sel && styles.optionSelected]}
              >
                <Text style={[styles.optionIcon, { backgroundColor: o.iconBg }]}>{o.icon}</Text>
                <Text style={styles.optionLabel}>{o.label}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      <View style={styles.gesture} />
    </SafeAreaView>
  )
}

// styles imported from onboarding-styles/student1
