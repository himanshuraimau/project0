import React from 'react'
import { SafeAreaView, View, Text, TouchableOpacity, Platform, Dimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Line, Polyline } from 'react-native-svg'
import styles from '../onboarding-styles/student9'

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
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.replace('/(onboarding)/step4' as any)}>
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

// styles imported from onboarding-styles/student9
