import React from 'react'
import { SafeAreaView, View, Text, TouchableOpacity, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { ContinueButton } from '../../ui/ContinueButton'
import styles from '../onboarding-styles/administrator3'

export default function Administrator3() {
  const router = useRouter()
  const handleContinue = () => {
    router.replace('/(onboarding)/step4' as any)
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.statusBar}>
        <Text style={styles.time}>6:10</Text>
        <View style={styles.statusIcons}>
          <Text style={styles.icon}>📶</Text>
          <Text style={styles.icon}>📡</Text>
          <Text style={styles.icon}>🔋</Text>
        </View>
      </View>

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
        <Text style={styles.title}>You're in the right place.</Text>

        <View style={styles.testimonialCard}>
          <View style={styles.cardHeader}>
            <View style={styles.nameSection}>
              <Text style={styles.cardName}>Josh berk</Text>
              <Text style={styles.cardTitle}>head of school</Text>
            </View>
            <View style={styles.starsContainer}>
              <Text style={styles.star}>⭐</Text>
              <Text style={styles.star}>⭐</Text>
              <Text style={styles.star}>⭐</Text>
              <Text style={styles.star}>⭐</Text>
              <Text style={styles.star}>⭐</Text>
            </View>
          </View>

          <Text style={styles.quote}>
            “Jellinote keeps my all notes organized. I walk away with clean summaries, follow-ups, and no missed details. Even from the busiest days”
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <ContinueButton 
          variant="gradient"
          onPress={handleContinue}
        />
      </View>

      <View style={styles.gesture} />
    </SafeAreaView>
  )
}

// styles imported from onboarding-styles/administrator3
