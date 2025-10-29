import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'

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
  content: { paddingHorizontal: 24, paddingTop: 20, flex: 1 },
  title: { fontSize: 28, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#374151', marginBottom: 18 },
  features: { marginTop: 6 },
  featureItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
  check: { fontSize: 18, color: '#60A5FA', marginRight: 12, marginTop: 2 },
  featureText: { fontSize: 16, color: '#0F172A', flex: 1 },
  footer: { paddingHorizontal: 24, paddingBottom: 18 },
  continueButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14 },
  continueText: { color: '#FFF', fontSize: 16, fontWeight: '700', marginRight: 8 },
  continueArrow: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  gestureBar: { height: 4, backgroundColor: '#E5E7EB', borderRadius: 3, marginTop: 8, marginHorizontal: 120 },
})
