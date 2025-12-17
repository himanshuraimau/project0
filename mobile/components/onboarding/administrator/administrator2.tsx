import React, { useState } from 'react'
import { SafeAreaView, View, Text, TouchableOpacity, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { ContinueButton } from '../../ui/ContinueButton'
import { ChevronLeft } from 'lucide-react-native'
import { OptionButton } from '../../ui/OptionButton'
import { BlurGradient } from '../../ui/BlurGradient'
import styles from '../onboarding-styles/administrator2'

export default function Administrator2() {
  const router = useRouter()

  const [selected, setSelected] = useState<string | null>(null)

  const OPTIONS = [
    { id: 'meetings', icon: '🎯', label: 'Streamline and organize meeting notes', iconBg: 'transparent' },
    { id: 'reports', icon: '✍️', label: 'Generate reports, AI summaries', iconBg: 'transparent' },
    { id: 'faculty', icon: '📄', label: 'Support faculty and classroom initiatives', iconBg: 'transparent' },
    { id: 'conversations', icon: '📚', label: 'Keep track of important conversations', iconBg: 'transparent' },
    { id: 'other', icon: '✏️', label: 'Something else', iconBg: 'transparent' },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <BlurGradient
        colors={['#9810FA', '#441AFF']}
        width={256}
        height={256}
        opacity={0.1}
        left={241}
        top={-111}
      />

      <BlurGradient
        colors={['#9810FA', '#441AFF']}
        width={256}
        height={256}
        opacity={0.1}
        left={-133}
        top={295.01}
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
        <Text style={styles.title}>What would you like Jellinote to help you with?</Text>

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
          onPress={() => router.push('/(onboarding)/administrator-flow/administrator3' as any)}
          disabled={!selected}
        />
      </View>
    </SafeAreaView>
  )
}

// styles imported from onboarding-styles/administrator2
