import React, { useState } from 'react'
import { SafeAreaView, View, Text, TouchableOpacity, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { ChevronLeft } from 'lucide-react-native'
import { ContinueButton } from '@/components/ui/ContinueButton'
import { OptionButton } from '@/components/ui/OptionButton'
import { BlurGradient } from '@/components/ui/BlurGradient'
import styles from '../onboarding-styles/parent5'

export default function Parent5() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)

  const OPTIONS = [
    { id: 'class', icon: '📗', label: 'Yes, a specific class', iconBg: '#DCFCE7' },
    { id: 'exam', icon: '📓', label: 'Yes, an upcoming exam', iconBg: '#FFE2E2' },
    { id: 'other', icon: '👀', label: 'Yes, something else', iconBg: '#F3F4F6' },
    { id: 'general', icon: '📝', label: 'No, just generally help me', iconBg: '#FCE7F3' },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <BlurGradient
        colors={['#9810FA', '#441AFF']}
        width={256}
        height={256}
        opacity={0.1}
        left={239}
        top={-102}
      />

      <BlurGradient
        colors={['#14C3A2', '#4C57FF']}
        width={256}
        height={256}
        opacity={0.1}
        left={-104}
        top={681}
      />

      <View style={styles.header}>
        <ChevronLeft size={28} color="#000000" style={{ marginRight: 12 }} />
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
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <ContinueButton variant="white" onPress={() => router.push('/(onboarding)/step4' as any)} />
      </View>

    </SafeAreaView>
  )
}

// styles imported from onboarding-styles/parent5
