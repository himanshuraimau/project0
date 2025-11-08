import React from 'react'
import { View, Text, TouchableOpacity, StatusBar } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import styles from '../onboarding-styles/teacher1'

export default function Teacher1() {
  const router = useRouter()
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F5FF" />

      {/* Status bar imitation */}
      <View style={styles.statusBar}>
        <Text style={styles.time}>6:10</Text>
        <View style={styles.statusRight}>
          <Text style={styles.statusIcon}>📶</Text>
          <Text style={[styles.statusIcon, { marginLeft: 6 }]}>📡</Text>
          <Text style={[styles.statusIcon, { marginLeft: 6 }]}>🔋</Text>
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.back}>{'<'}</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>You're in the right place.</Text>
        <Text style={styles.subtitle}>Trusted by educators of professionals like you</Text>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Text style={styles.check}>✔️</Text>
            <Text style={styles.featureText}>Streamline lecture prep and delivery</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.check}>✔️</Text>
            <Text style={styles.featureText}>Collect and organize notes faster</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.check}>✔️</Text>
            <Text style={styles.featureText}>Inspire students through smarter learning</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.check}>✔️</Text>
            <Text style={styles.featureText}>Turn classroom discussions into shareable notes</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          activeOpacity={0.85}
          onPress={() => router.push('/(onboarding)/teacher-flow/teacher2' as any)}
        >
          <LinearGradient colors={["#3B82F6", "#7C3AED"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.continueButton}>
            <Text style={styles.continueText}>Continue</Text>
            <Text style={styles.continueArrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.gestureBar} />
      </View>
    </View>
  )
}

// styles imported from onboarding-styles/teacher1
