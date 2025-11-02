import React, { useState } from 'react'
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
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
      <View style={styles.statusBar}>
        <Text style={styles.time}>4:22</Text>
        <View style={styles.statusIcons}>
          <Text style={styles.icon}>📶</Text>
          <Text style={styles.icon}>📡</Text>
          <Text style={styles.icon}>🔋</Text>
        </View>
      </View>

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
        <TouchableOpacity style={styles.continueWrap} activeOpacity={0.85} onPress={handleContinue}>
          <View style={styles.continueButton}>
            <Text style={styles.continueText}>Continue →</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.gesture} />
    </SafeAreaView>
  )
}

// styles imported from onboarding-styles/teacher4
