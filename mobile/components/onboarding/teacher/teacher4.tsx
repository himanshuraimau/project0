import React, { useState } from 'react'
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { BlurGradient } from '../../ui/BlurGradient'
import { ContinueButton } from '../../ui/ContinueButton'
import styles from '../onboarding-styles/teacher4'

export default function Teacher4() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)

  const handleContinue = () => {
    // finish onboarding and go to step4
    router.replace('/(onboarding)/step4' as any)
  }

  const OPTIONS = [
    { id: 'class', icon: '📗', label: 'Yes, a specific class' },
    { id: 'exam', icon: '📑', label: 'Yes, an upcoming exam' },
    { id: 'other', icon: '👀', label: 'Yes, something else' },
    { id: 'general', icon: '📝', label: 'No, just generally help me' },
  ]

  return (
    <SafeAreaView style={styles.container}>
      {/* Top blur gradient - Purple */}
      <BlurGradient
        colors={['#9810FA', '#441AFF']}
        width={256}
        height={256}
        opacity={0.1}
        left={227}
        top={-44}
      />

      {/* Bottom blur gradient - Teal-Blue */}
      <BlurGradient
        colors={['#14C3A2', '#4C57FF']}
        width={256}
        height={256}
        opacity={0.1}
        left={-16}
        top={654}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
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
      </View>

      <View style={styles.footer}>
        <ContinueButton 
          variant="white"
          onPress={handleContinue}
        />
      </View>
    </SafeAreaView>
  )
}

// styles imported from onboarding-styles/teacher4
