import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'

export default function WorkingProfessional4() {
  const router = useRouter()
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F5FF" />

      {/* Status imitation */}
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
        <Text style={styles.contextText}>Personalizing Jellinote for you...</Text>
        <Text style={styles.title}>You're in the right place.</Text>

        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View>
              <Text style={styles.cardName}>Steve Gray</Text>
              <Text style={styles.cardTitle}>Management Consultant</Text>
            </View>
            <View style={styles.stars}>
              <Text style={styles.star}>⭐️⭐️⭐️⭐️⭐️</Text>
            </View>
          </View>

          <Text style={styles.quote}>
            “Jellinote made me more productive within weeks. I can focus fully on work and still walk away with perfect notes.”
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.replace('/(drawer)/(home)' as any)}
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F5FF' },
  statusBar: { height: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 6 },
  time: { fontSize: 14, color: '#0F172A', fontWeight: '600' },
  statusRight: { flexDirection: 'row', alignItems: 'center' },
  statusIcon: { fontSize: 13 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 12 },
  back: { fontSize: 22, marginRight: 16, color: '#0F172A' },
  progressContainer: { flex: 1 },
  progressTrack: { height: 6, backgroundColor: '#E6E7F0', borderRadius: 6, overflow: 'hidden' },
  progressFill: { width: '35%', height: '100%', backgroundColor: '#7C3AED' },
  content: { paddingHorizontal: 24, paddingTop: 20 },
  contextText: { color: '#7C3AED', fontSize: 13, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: '#0F172A', marginBottom: 18 },
  card: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginTop: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  cardTitle: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  stars: { alignItems: 'flex-end' },
  star: { fontSize: 16 },
  quote: { fontSize: 15, color: '#374151', lineHeight: 22 },
  footer: { paddingHorizontal: 24, paddingBottom: 18, marginTop: 12 },
  continueButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14 },
  continueText: { color: '#FFF', fontSize: 16, fontWeight: '700', marginRight: 8 },
  continueArrow: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  gestureBar: { height: 4, backgroundColor: '#E5E7EB', borderRadius: 3, marginTop: 8, marginHorizontal: 120 },
})
