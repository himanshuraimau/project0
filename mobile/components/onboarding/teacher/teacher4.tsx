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
import { ChevronLeft } from 'lucide-react-native'
import { OptionButton } from '../../ui/OptionButton'
import styles from '../onboarding-styles/teacher4'

export default function Teacher4() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)

  const handleContinue = () => {
    // finish onboarding and go to step4
    router.push('/(onboarding)/step4' as any)
  }

  const OPTIONS = [
    { id: 'class', icon: '📗', label: 'Yes, a specific class', iconBg: '#DCFCE7' },
    { id: 'exam', icon: '📑', label: 'Yes, an upcoming exam', iconBg: '#FFE2E2' },
    { id: 'other', icon: '👀', label: 'Yes, something else', iconBg: '#F3F4F6' },
    { id: 'general', icon: '📝', label: 'No, just generally help me', iconBg: '#FCE7F3' },
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

      {/* Header with back button and progress */}
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

      <View style={styles.content}>
        <Text style={styles.context}>Personalizing Jellinote for you...</Text>
        <Text style={styles.title}>Do you want us to focus on a class or an exam?</Text>

        <View style={styles.options}>
          {OPTIONS.map((o) => (
            <OptionButton
              key={o.id}
              icon={o.icon}
              label={o.label}
              iconBg={o.iconBg}
              selected={selected === o.id}
              onPress={() => setSelected(o.id)}
              style={styles.optionOverride}
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <ContinueButton
          onPress={handleContinue}
          disabled={!selected}
        />
      </View>
    </SafeAreaView>
  )
}

// styles imported from onboarding-styles/teacher4
