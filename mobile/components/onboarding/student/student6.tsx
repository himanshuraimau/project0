import React, { useState } from 'react'
import { SafeAreaView, View, Text, TouchableOpacity, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { BlurGradient } from '../../ui/BlurGradient'
import { ContinueButton } from '../../ui/ContinueButton'
import { ChevronLeft } from 'lucide-react-native'
import { OptionButton } from '../../ui/OptionButton'
import styles from '../onboarding-styles/student6'

export default function Student6() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)

  const OPTIONS = [
    { id: 'class', icon: '📗', label: 'Yes, a specific class', iconBg: '#DCFCE7' },
    { id: 'exam', icon: '📓', label: 'Yes, an upcoming exam', iconBg: '#FFE2E2' },
    { id: 'else', icon: '👀', label: 'Yes, something else', iconBg: '#F3F4F6' },
    { id: 'general', icon: '📝', label: 'No, just generally help me', iconBg: '#FCE7F3' },
  ]

  return (
    <SafeAreaView style={styles.container}>
      {/* Purple blur gradient */}
      <BlurGradient
        colors={['#9810FA', '#441AFF']}
        width={256}
        height={256}
        opacity={0.1}
        left={-18}
        top={665}
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
      </ScrollView>

      <View style={styles.footer}>
        <ContinueButton
          variant="white"
          onPress={() => router.push('/(onboarding)/student-flow/student7' as any)}
        />
      </View>
    </SafeAreaView>
  )
}

// styles imported from onboarding-styles/student6
