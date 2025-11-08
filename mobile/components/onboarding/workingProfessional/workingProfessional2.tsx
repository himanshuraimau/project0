import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'

export default function WorkingProfessional2() {
  const router = useRouter()
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" translucent={false} backgroundColor="#F7F5FF" />

      {/* Status bar imitation */}
      <View style={styles.statusBar}> 
        <Text style={styles.time}>6:10</Text>
        <View style={styles.statusRight}>
          <Text style={styles.statusIcon}>📶</Text>
          <Text style={[styles.statusIcon, { marginLeft: 6 }]}>📡</Text>
          <Text style={[styles.statusIcon, { marginLeft: 6 }]}>🔋</Text>
        </View>
      </View>

      {/* Navigation header with back and progress */}
      <View style={styles.header}>
        <Text style={styles.back}>{'<'}</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>You're in the right place.</Text>
        <Text style={styles.subtitle}>Trusted by thousands of professionals like you</Text>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Text style={styles.check}>✔️</Text>
            <Text style={styles.featureText}>Capture meeting notes effortlessly</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.check}>✔️</Text>
            <Text style={styles.featureText}>Collect and organize notes faster</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.check}>✔️</Text>
            <Text style={styles.featureText}>Document policy discussions clearly</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.check}>✔️</Text>
            <Text style={styles.featureText}>Summarize and share reports faster</Text>
          </View>
        </View>
      </View>

      {/* Continue button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.buttonWrapper}
          activeOpacity={0.85}
          onPress={() => router.push('/(onboarding)/workingProfessional/workingProfessional3' as any)}
        >
          <LinearGradient
            colors={["#3B82F6", "#7C3AED"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueButton}
          >
            <Text style={styles.continueText}>Continue</Text>
            <Text style={styles.continueArrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Gesture bar */}
        <View style={styles.gestureBar} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F5FF', // light off-white
    paddingTop: 12,
  },
  statusBar: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  time: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  statusRight: { flexDirection: 'row', alignItems: 'center' },
  statusIcon: { fontSize: 13 },
  header: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  back: {
    fontSize: 22,
    color: '#0F172A',
    marginRight: 16,
  },
  progressContainer: { flex: 1 },
  progressTrack: {
    height: 6,
    backgroundColor: '#E6E7F0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    width: '35%',
    height: '100%',
    backgroundColor: '#7C3AED', // vibrant purple
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 28,
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 24,
  },
  features: { marginTop: 6 },
  featureItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
  check: { fontSize: 18, color: '#60A5FA', marginRight: 12, marginTop: 2 }, // light blue
  featureText: { fontSize: 16, color: '#0F172A', flex: 1 },
  footer: { paddingHorizontal: 24, paddingBottom: 18 },
  buttonWrapper: { marginBottom: 12 },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
  },
  continueText: { color: '#FFF', fontSize: 16, fontWeight: '700', marginRight: 8 },
  continueArrow: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  gestureBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginTop: 8,
    marginHorizontal: 120,
  },
})
