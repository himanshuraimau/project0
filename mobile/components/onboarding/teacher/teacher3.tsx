import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { ChevronLeft } from 'lucide-react-native'
import { BlurGradient } from '../../ui/BlurGradient'
import { ContinueButton } from '../../ui/ContinueButton'
import styles from '../onboarding-styles/teacher3'

export default function Teacher3() {
  const router = useRouter()

  const handleContinue = () => {
    router.push('/(onboarding)/teacher-flow/teacher4' as any)
  }

  return (
    <SafeAreaView style={styles.container}>


      {/* Top blur gradient */}
      <BlurGradient
        colors={['#9810FA', '#441AFF']}
        width={256}
        height={256}
        opacity={0.1}
        left={239.4}
        top={-102.4}
      />

      {/* Bottom blur gradient */}
      <BlurGradient
        colors={['#14C3A2', '#4C57FF']}
        width={256}
        height={256}
        opacity={0.1}
        left={-102.4}
        top={698.4}
      />

      {/* Header with back and progress */}
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
        {/* Contextual Text */}
        <Text style={styles.contextText}>Personalizing Jellinote for you...</Text>

        {/* Main Title */}
        <Text style={styles.mainTitle}>You're in the right place.</Text>

        {/* Testimonial Card Container */}
        <View style={styles.cardContainer}>
          {/* Card blur gradient */}
          <BlurGradient
            colors={['#4C57FF', '#14C3A2']}
            width={128}
            height={128}
            opacity={0.2}
            left={254.6}
            top={-37.6}
          />

          {/* Testimonial Card */}
          <View style={styles.testimonialCard}>
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <View style={styles.nameSection}>
                  <Text style={styles.cardName}>James Welsh</Text>
                  <Text style={styles.cardTitle}>University Lecturer</Text>
                </View>
                <View style={styles.starsContainer}>
                  <Ionicons name="star" size={16} color="#FFB800" />
                  <Ionicons name="star" size={16} color="#FFB800" />
                  <Ionicons name="star" size={16} color="#FFB800" />
                  <Ionicons name="star" size={16} color="#FFB800" />
                  <Ionicons name="star" size={16} color="#FFB800" />
                </View>
              </View>

              <Text style={styles.quote}>
                "Helped my daughter so much I bought the family plan. Now we all organize notes faster!"
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <ContinueButton
          variant="gradient"
          onPress={handleContinue}
        />
      </View>
    </SafeAreaView>
  )
}
