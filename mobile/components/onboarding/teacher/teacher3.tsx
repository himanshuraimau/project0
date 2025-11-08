import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import styles from '../onboarding-styles/teacher3'

export default function Teacher3() {
  const router = useRouter()

  const handleContinue = () => {
    router.push('/(onboarding)/teacher-flow/teacher4' as any)
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F5FF" />

      {/* Status Bar Replacement */}
      <View style={styles.statusBarReplacement}>
        <Text style={styles.time}>6:10</Text>
        <View style={styles.statusIcons}>
          <Text style={styles.icon}>📶</Text>
          <Text style={styles.icon}>📡</Text>
          <Text style={styles.icon}>🔋</Text>
        </View>
      </View>

      {/* Navigation Header with Back and Progress */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backArrow}>&lt;</Text>
        </TouchableOpacity>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View style={styles.progressBarFill} />
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Contextual Text */}
        <Text style={styles.contextText}>Personalizing Jellinote for you...</Text>

        {/* Main Title */}
        <Text style={styles.mainTitle}>You're in the right place.</Text>

        {/* Testimonial Card */}
        <View style={styles.testimonialCard}>
          <View style={styles.cardHeader}>
            <View style={styles.nameSection}>
              <Text style={styles.cardName}>James Welsh</Text>
              <Text style={styles.cardTitle}>University Lecturer</Text>
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
            "Jellinote saves me hours each week. I can focus on teaching, while it organizes every lecture and Q&A seamlessly. It's like having a digital teaching assistant."
          </Text>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.continueButtonWrapper}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#3B82F6', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueButton}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Text style={styles.continueArrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Gesture Bar */}
      <View style={styles.gestureBar} />
    </SafeAreaView>
  )
}

// styles imported from onboarding-styles/teacher3
