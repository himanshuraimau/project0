import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { BlurGradient } from '../../ui/BlurGradient'
import { ChevronLeft } from 'lucide-react-native'
import { ContinueButton } from '../../ui/ContinueButton'

export default function WorkingProfessional2() {
  const router = useRouter()
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" translucent={false} backgroundColor="#F7F5FF" />

      {/* Gaussian Blur */}
      <BlurGradient
        colors={['#9810FA', '#441AFF']}
        width={286}
        height={256}
        opacity={0.1}
        right={-30}
        top={-40}
      />


      {/* Navigation header with back and progress */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={28} color="#000000" style={{ marginRight: 12 }} />
        </TouchableOpacity>
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
            <View style={styles.checkContainer}>
              <Ionicons name="checkmark" size={16} color="#2C94CA" />
            </View>
            <Text style={styles.featureText}>Capture meeting notes effortlessly</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.checkContainer}>
              <Ionicons name="checkmark" size={16} color="#2C94CA" />
            </View>
            <Text style={styles.featureText}>Collect and organize notes faster</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.checkContainer}>
              <Ionicons name="checkmark" size={16} color="#2C94CA" />
            </View>
            <Text style={styles.featureText}>Document policy discussions clearly</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.checkContainer}>
              <Ionicons name="checkmark" size={16} color="#2C94CA" />
            </View>
            <Text style={styles.featureText}>Summarize and share reports faster</Text>
          </View>
        </View>
      </View>

      {/* Continue button */}
      <View style={styles.footer}>
        <ContinueButton
          variant="gradient"
          onPress={() => router.push('/(onboarding)/workingProfessional/workingProfessional3' as any)}
        />
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
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
  checkContainer: {
    width: 24,
    height: 24,
    backgroundColor: '#E5F4F8',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  featureText: { fontSize: 16, color: '#0F172A', flex: 1 },
  footer: { paddingHorizontal: 25, paddingBottom: 20 },

  gestureBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginTop: 8,
    marginHorizontal: 120,
  },
})
