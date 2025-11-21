import React, { useState } from 'react'
import { SafeAreaView, View, Text, TouchableOpacity, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { ContinueButton } from '@/components/ui/ContinueButton'
import { OptionButton } from '@/components/ui/OptionButton'
import { BlurGradient } from '@/components/ui/BlurGradient'
import styles from '../onboarding-styles/parent3'

export default function Parent3() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)

  const OPTIONS = [
    { id: 'child', icon: '✅', label: 'My child', iconBg: '#FFFFFF' },
    { id: 'both', icon: '✏️', label: 'Both of us', iconBg: '#FFFFFF' },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <BlurGradient
        colors={['#9810FA', '#441AFF']}
        width={256}
        height={256}
        opacity={0.1}
        left={267}
        top={275.5}
      />

      <View style={styles.header}>
        <Text style={styles.back}>&lt;</Text>
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.context}>Personalizing Jellinote for you...</Text>
        <Text style={styles.title}>Who is Jellinote for?</Text>

        <View style={styles.options}>
          {OPTIONS.map((o) => (
            <OptionButton
              key={o.id}
              icon={o.icon}
              label={o.label}
              iconBg={o.iconBg}
              selected={selected === o.id}
              onPress={() => setSelected(o.id)}
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <ContinueButton variant="white" onPress={() => router.push('/(onboarding)/parent/parent4' as any)} />
      </View>

    </SafeAreaView>
  )
}

// styles imported from onboarding-styles/parent3
