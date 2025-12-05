import React, { useState } from 'react'
import { SafeAreaView, View, Text, TouchableOpacity, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { BlurGradient } from '../../ui/BlurGradient'
import { ContinueButton } from '../../ui/ContinueButton'
import { ChevronLeft } from 'lucide-react-native'
import styles from '../onboarding-styles/student5'

export default function Student5() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)

  const OPTIONS = [
    { id: 'grades', icon: '🌱', label: 'Improve my grades', iconBg: '#FFE2E2' },
    { id: 'learn', icon: '📚', label: 'Learn 10x faster', iconBg: '#DCFCE7' },
    { id: 'focus', icon: '🎯', label: 'Focus better in class', iconBg: '#D1D5DC' },
    { id: 'details', icon: '✅', label: "Don't miss important details", iconBg: '#D1D5DC' },
    { id: 'other', icon: '✏️', label: 'Something else', iconBg: '#FEF3C6' },
  ]

  return (
    <SafeAreaView style={styles.container}>
      {/* Purple blur gradient */}
      <BlurGradient
        colors={['#9810FA', '#441AFF']}
        width={256}
        height={256}
        opacity={0.1}
        left={-112}
        top={450}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={28} color="#000000" style={{ marginRight: 12 }} />
        </TouchableOpacity>
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.content}>
        <Text style={styles.context}>Personalizing Jellinote for you...</Text>
        <Text style={styles.title}>What's your main goal?</Text>

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

      <View style={styles.footer}>
        <ContinueButton
          variant="white"
          onPress={() => router.push('/(onboarding)/student-flow/student6' as any)}
        />
      </View>

    </SafeAreaView>
  )
}

// styles imported from onboarding-styles/student5
