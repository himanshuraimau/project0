import React from 'react'
import { SafeAreaView, View, Text, TouchableOpacity, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { BlurGradient } from '../../ui/BlurGradient'
import { ContinueButton } from '../../ui/ContinueButton'
import { ChevronLeft } from 'lucide-react-native'
import styles from '../onboarding-styles/student4'

export default function Student4() {
  const router = useRouter()

  const BULLETS = [
    'Take detailed lecture notes',
    'Make AI practice exams',
    'Get detailed transcripts',
    'Chat with long PDFs & docs',
  ]

  return (
    <SafeAreaView style={styles.container}>
      {/* Purple blur gradient */}
      <BlurGradient
        colors={['#9810FA', '#441AFF']}
        width={256}
        height={256}
        opacity={0.1}
        left={197}
        top={369.08}
      />

      {/* Teal-Blue blur gradient */}
      <BlurGradient
        colors={['#14C3A2', '#4C57FF']}
        width={256}
        height={256}
        opacity={0.1}
        left={69}
        top={654.08}
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

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.content}>
        <Text style={styles.title}>You're in good company!</Text>
        <Text style={styles.subtitle}>Thousands of students and math students use Jellinote to:</Text>

        <View style={styles.bullets}>
          {BULLETS.map((b, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={styles.checkWrap}><Text style={styles.check}>✓</Text></View>
              <Text style={styles.bulletText}>{b}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <ContinueButton
          onPress={() => router.push('/(onboarding)/student-flow/student5' as any)}
        />
      </View>

    </SafeAreaView>
  )
}

// styles imported from onboarding-styles/student4
