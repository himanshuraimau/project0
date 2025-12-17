import React from 'react'
import { SafeAreaView, View, Text, TouchableOpacity, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { ContinueButton } from '../../ui/ContinueButton'
import { ChevronLeft } from 'lucide-react-native'
import { TestimonialCard } from '../../ui/TestimonialCard'
import { BlurGradient } from '../../ui/BlurGradient'
import styles from '../onboarding-styles/administrator3'

export default function Administrator3() {
  const router = useRouter()
  const handleContinue = () => {
    router.push('/(onboarding)/step4' as any)
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Gaussian Blur 1 */}
      <BlurGradient
        colors={['#9810FA', '#441AFF']}
        width={256}
        height={256}
        left={239.4}
        top={-102.4}
        opacity={0.1}
      />
      {/* Gaussian Blur 2 */}
      <BlurGradient
        colors={['#14C3A2', '#4C57FF']}
        width={256}
        height={256}
        left={-102.4}
        top={698.4}
        opacity={0.1}
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
        <Text style={styles.title}>You're in the right place.</Text>

        <TestimonialCard
          name="Josh berk"
          title="head of school"
          quote="Jellinote keeps my all notes organized. I walk away with clean summaries, follow-ups, and no missed details. Even from the busiest days"
          stars={5}
        />
      </View>

      <View style={styles.footer}>
        <ContinueButton
          onPress={handleContinue}
        />
      </View>
    </SafeAreaView>
  )
}

// styles imported from onboarding-styles/administrator3
