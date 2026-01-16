import React from 'react'
import { SafeAreaView, View, Text, TouchableOpacity, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { ChevronLeft } from 'lucide-react-native'
import { ContinueButton } from '../../ui/ContinueButton'
import { TestimonialCard } from '../../ui/TestimonialCard'
import { BlurGradient } from '../../ui/BlurGradient'
import styles from '../onboarding-styles/parent4'

export default function Parent4() {
  const router = useRouter()
  const handleContinue = () => {
    router.push('/(onboarding)/parent/parent5' as any)
  }

  return (
    <SafeAreaView style={styles.container}>
      <BlurGradient
        colors={['#14C3A2', '#4C57FF']}
        width={256}
        height={256}
        opacity={0.1}
        left={-102.4}
        top={698.4}
      />

      <BlurGradient
        colors={['#9810FA', '#441AFF']}
        width={256}
        height={256}
        opacity={0.1}
        left={239.4}
        top={-102.4}
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
        <Text style={styles.context}>Personalizing Flinote for you...</Text>
        <Text style={styles.title}>You're in the right place.</Text>

        <TestimonialCard
          name="Jessica Cole"
          title="Mom of 4"
          quote="Started out for my oldest, but now everyone's hooked. It's been such a great tool for all my kids in school."
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

// styles imported from onboarding-styles/parent4
