import React from 'react'
import { SafeAreaView, View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import styles from '../onboarding-styles/parent1.styles'

export default function Parent1() {
  const router = useRouter()

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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>You're in the right place.</Text>
        <Text style={styles.subtitle}>
          Join <Text style={styles.subtitleBold}>thousands of</Text> Parents using Jellinote to:
        </Text>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Text style={styles.check}>✔️</Text>
            <Text style={styles.featureText}>Boost their child's results with smart study tools</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.check}>✔️</Text>
            <Text style={styles.featureText}>Turn classes into ready-to-review notes</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.check}>✔️</Text>
            <Text style={styles.featureText}>Record and summarize calls & voice notes</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.check}>✔️</Text>
            <Text style={styles.featureText}>Stay present in meetings and get action items automatically</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/(onboarding)/parent/parent2' as any)}>
          <LinearGradient colors={["#3B82F6", "#7C3AED"]} style={styles.continueButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.continueText}>Continue</Text>
            <Text style={styles.continueArrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.gesture} />
    </SafeAreaView>
  )
}
