import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, SafeAreaView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { BlurGradient } from '../../ui/BlurGradient'
import { ChevronLeft } from 'lucide-react-native'
import { ContinueButton } from '../../ui/ContinueButton'

export default function WorkingProfessional4() {
  const router = useRouter()
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F5FF" />

      {/* Gaussian Blur 1 - Blue-Teal */}
      <BlurGradient
        colors={['#4C57FF', '#14C3A2']}
        width={128}
        height={128}
        opacity={0.2}
        right={-37}
        top={83}
      />

      {/* Gaussian Blur 2 - Purple */}
      <BlurGradient
        colors={['#9810FA', '#441AFF']}
        width={256}
        height={256}
        opacity={0.1}
        right={-86}
        top={-102}
      />

      {/* Header */}
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
        <Text style={styles.contextText}>Personalizing Jellinote for you...</Text>
        <Text style={styles.title}>You're in the right place.</Text>

        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <View style={styles.cardTop}>
                <View style={styles.userInfo}>
                  <Text style={styles.cardName}>Steve Gray</Text>
                  <Text style={styles.cardTitle}>Management Consultant</Text>
                </View>
                <View style={styles.stars}>
                  <Ionicons name="star" size={16} color="#FFB800" />
                  <Ionicons name="star" size={16} color="#FFB800" />
                  <Ionicons name="star" size={16} color="#FFB800" />
                  <Ionicons name="star" size={16} color="#FFB800" />
                  <Ionicons name="star" size={16} color="#FFB800" />
                </View>
              </View>

              <Text style={styles.quote}>
                "Jellinote made me more productive within weeks. I can focus fully on work and still walk away with perfect notes."
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <ContinueButton
          variant="gradient"
          onPress={() => router.push('/(onboarding)/step4' as any)}
        />

        <View style={styles.gestureBar} />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F5FF' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 60 },
  back: { fontSize: 22, marginRight: 16, color: '#0F172A' },
  progressWrap: { flex: 1, paddingRight: 16 },
  progressTrack: { height: 6, backgroundColor: '#EEE8FF', borderRadius: 6, overflow: 'hidden' },
  progressFill: { width: '100%', height: '100%', backgroundColor: '#7C3AED' },
  content: { paddingHorizontal: 28, paddingTop: 20, width: '100%' },
  contextText: {
    color: '#7C3AED',
    fontSize: 15,
    fontFamily: 'Arimo',
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 8,
  },
  title: { fontSize: 28, fontWeight: '700', color: '#0F172A', marginBottom: 18 },
  cardContainer: {
    gap: 16,
    width: '100%',
    height: 207.6,
  },
  card: {
    width: '100%',
    height: 195,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.8,
    borderColor: '#EBEDF2',
    borderRadius: 24,
    shadowColor: '#4C57FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  cardContent: {
    padding: 24.8,
    gap: 16,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    height: 46,
    paddingRight: 24,
  },
  userInfo: {
    gap: 2,
    width: 170,
    height: 46,
  },
  cardName: {
    fontSize: 18,
    fontFamily: 'Arimo',
    fontWeight: '700',
    lineHeight: 24,
    color: '#0B0C10',
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: 'Arimo',
    fontWeight: '400',
    lineHeight: 20,
    color: '#5A6171',
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    width: 80,
    height: 16,
    marginRight: 20,
  },
  quote: {
    fontSize: 16,
    fontFamily: 'Arimo',
    fontWeight: '400',
    lineHeight: 24,
    color: '#0B0C10',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    paddingBottom: 20,
  },
  gestureBar: { height: 4, backgroundColor: '#E5E7EB', borderRadius: 3, marginTop: 8, marginHorizontal: 120 },
})
