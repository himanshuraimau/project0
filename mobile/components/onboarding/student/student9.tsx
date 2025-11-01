import React from 'react'
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Line, Polyline } from 'react-native-svg'

const { width } = Dimensions.get('window')

export default function Student9() {
  const router = useRouter()

  // Chart data points for upward trend
  const chartPoints = [
    { x: 0, y: 80 },
    { x: 60, y: 70 },
    { x: 120, y: 55 },
    { x: 180, y: 40 },
    { x: 240, y: 20 },
  ]

  const chartWidth = width - 80
  const chartHeight = 120

  // Convert data points to SVG polyline points
  const polylinePoints = chartPoints
    .map(point => `${(point.x / 240) * chartWidth},${point.y}`)
    .join(' ')

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.statusBar}>
        <Text style={styles.timeWrap}><Text style={styles.time}>4:22</Text></Text>
        <View style={styles.statusIcons}>
          <Text style={styles.icon}>📶</Text>
          <Text style={styles.icon}>🔋</Text>
        </View>
      </View>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.back}>&lt;</Text>
        </TouchableOpacity>
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.mainTitle}>Nice start!</Text>
        <Text style={styles.subtitle}>Consistency compounds.</Text>
        <Text style={styles.description}>
          Record and review regularly to see steady progress.
        </Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Your GPA</Text>
            <View style={styles.badges}>
              <View style={styles.badgePurple}>
                <Text style={styles.badgePurpleText}>with Jellinote</Text>
              </View>
              <View style={styles.badgeGrey}>
                <Text style={styles.badgeGreyText}>self-study</Text>
              </View>
            </View>
          </View>

          <View style={styles.chartContainer}>
            <Svg width={chartWidth} height={chartHeight}>
              {/* Horizontal grid lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <Line
                  key={i}
                  x1="0"
                  y1={i * 30}
                  x2={chartWidth}
                  y2={i * 30}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                />
              ))}
              
              {/* Purple upward-sloping line */}
              <Polyline
                points={polylinePoints}
                fill="none"
                stroke="#7C3AED"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.replace('/(drawer)/(home)' as any)}>
          <LinearGradient colors={["#7C3AED", "#3B82F6"]} style={styles.cta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.ctaText}>Continue</Text>
            <Text style={styles.ctaArrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.leftGradient} pointerEvents="none" />
      <View style={styles.homeIndicator} />
    </SafeAreaView>
  )
}

const PURPLE = '#7C3AED'
const BG = '#FFFFFF'

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  statusBar: {
    height: Platform.OS === 'ios' ? 44 : 28,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeWrap: { backgroundColor: '#FF4D4F', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  time: { color: '#fff', fontWeight: '700', fontSize: 13 },
  statusIcons: { flexDirection: 'row' },
  icon: { marginLeft: 8, fontSize: 14 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 },
  back: { fontSize: 22, marginRight: 12 },
  progressWrap: { flex: 1, paddingRight: 16 },
  progressTrack: { height: 10, backgroundColor: '#F3EFFF', borderRadius: 6, overflow: 'hidden' },
  progressFill: { width: '100%', height: '100%', backgroundColor: PURPLE },
  content: { paddingHorizontal: 20, paddingTop: 24, flex: 1, alignItems: 'center' },
  mainTitle: { fontSize: 32, fontWeight: '800', color: '#7C3AED', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 18, fontWeight: '600', color: '#9333EA', marginBottom: 12, textAlign: 'center' },
  description: { fontSize: 14, color: '#6B7280', marginBottom: 32, textAlign: 'center', paddingHorizontal: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  badges: { flexDirection: 'row', gap: 8 },
  badgePurple: { backgroundColor: '#7C3AED', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgePurpleText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  badgeGrey: { backgroundColor: '#E5E7EB', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeGreyText: { color: '#6B7280', fontSize: 11, fontWeight: '600' },
  chartContainer: { marginTop: 8 },
  footer: { paddingHorizontal: 20, paddingBottom: 18 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700', marginRight: 8 },
  ctaArrow: { color: '#fff', fontSize: 18, fontWeight: '700' },
  leftGradient: { position: 'absolute', left: -40, top: 80, width: 220, height: 420, borderRadius: 220, backgroundColor: '#F5EEFF', opacity: 0.7, transform: [{ rotate: '-25deg' }] },
  homeIndicator: { height: 6, backgroundColor: '#E9E9EF', marginHorizontal: 110, borderRadius: 3, marginTop: 10, marginBottom: Platform.OS === 'ios' ? 24 : 8 },
})
