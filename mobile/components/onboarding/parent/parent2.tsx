import React, { useState } from 'react'
import { SafeAreaView, View, Text, TouchableOpacity, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { ChevronLeft } from 'lucide-react-native'
import { ContinueButton } from '@/components/ui/ContinueButton'
import { OptionButton } from '@/components/ui/OptionButton'
import { BlurGradient } from '@/components/ui/BlurGradient'
import styles from '../onboarding-styles/parent2'

export default function Parent2() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)

  const OPTIONS = [
    { id: 'study', icon: '🎯', label: "Help my child study better", iconBg: '#FFFFFF' },
    { id: 'meetings', icon: '🎤', label: 'Be more present in meetings', iconBg: '#FFFFFF' },
    { id: 'other', icon: '✏️', label: 'Something else', iconBg: '#FFFFFF' },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <BlurGradient
        colors={['#9810FA', '#441AFF']}
        width={256}
        height={256}
        opacity={0.1}
        left={234}
        top={600}
      />

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
        <Text style={styles.title}>What brings you to Jellinote?</Text>

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
          variant="white"
          onPress={() => router.push('/(onboarding)/parent/parent3' as any)}
          style={{ borderWidth: 1, borderColor: '#BFBFBF' }}
          disabled={!selected}
        />
      </View>

    </SafeAreaView>
  )
}

// styles imported from onboarding-styles/parent2
