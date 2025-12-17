import React, { useState } from 'react'
import { SafeAreaView, View, Text, TouchableOpacity, Platform, Dimensions } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import Svg, { Line, Polyline } from 'react-native-svg'
import { BlurGradient } from '../../ui/BlurGradient'
import { ContinueButton } from '../../ui/ContinueButton'
import { ChevronLeft } from 'lucide-react-native'
import styles from '../onboarding-styles/student9'

const { width } = Dimensions.get('window')

export default function Student9() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const currentGpa = parseFloat(params.currentGpa as string) || 3.8
  const goalGpa = parseFloat(params.goalGpa as string) || 3.8
  const [activeChart, setActiveChart] = useState<'jellinote' | 'self-study'>('jellinote')

  const chartWidth = 281.02
  const chartHeight = 192

  // Generate chart data points based on current and goal GPA
  // Y-axis represents GPA (inverted because SVG Y increases downward)
  // Scale: 0 GPA at y=192, 10 GPA at y=0
  const gpaToY = (gpa: number) => chartHeight - (gpa / 10) * chartHeight

  // Create 5 points for Jellinote (goal GPA progression - student8)
  const jellinotePoints = [
    { x: 0, y: gpaToY(currentGpa) },
    { x: 60, y: gpaToY(currentGpa + (goalGpa - currentGpa) * 0.25) },
    { x: 120, y: gpaToY(currentGpa + (goalGpa - currentGpa) * 0.5) },
    { x: 180, y: gpaToY(currentGpa + (goalGpa - currentGpa) * 0.75) },
    { x: 240, y: gpaToY(goalGpa) },
  ]

  // Create 5 points for self-study (stays at current GPA - student7)
  const selfStudyPoints = [
    { x: 0, y: gpaToY(currentGpa) },
    { x: 60, y: gpaToY(currentGpa) },
    { x: 120, y: gpaToY(currentGpa) },
    { x: 180, y: gpaToY(currentGpa) },
    { x: 240, y: gpaToY(currentGpa) },
  ]

  // Convert data points to SVG polyline points
  const jellinotePolyline = jellinotePoints
    .map(point => `${(point.x / 240) * chartWidth},${point.y}`)
    .join(' ')

  const selfStudyPolyline = selfStudyPoints
    .map(point => `${(point.x / 240) * chartWidth},${point.y}`)
    .join(' ')

  return (
    <SafeAreaView style={styles.container}>
      {/* Teal-Blue blur gradient */}
      <BlurGradient
        colors={['#14C3A2', '#4C57FF']}
        width={256}
        height={256}
        opacity={0.1}
        left={-83}
        top={537.05}
      />

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
        <Text style={styles.mainTitle}>Nice start!</Text>
        <Text style={styles.subtitle}>Consistency compounds.</Text>
        <Text style={styles.description}>
          Record and review regularly to see steady progress.
        </Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Your GPA</Text>
            <View style={styles.badges}>
              <TouchableOpacity
                onPress={() => setActiveChart('jellinote')}
                style={activeChart === 'jellinote' ? styles.badgePurple : styles.badgeGrey}
              >
                <Text style={activeChart === 'jellinote' ? styles.badgePurpleText : styles.badgeGreyText}>
                  with Jellinote
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveChart('self-study')}
                style={activeChart === 'self-study' ? styles.badgePurple : styles.badgeGrey}
              >
                <Text style={activeChart === 'self-study' ? styles.badgePurpleText : styles.badgeGreyText}>
                  self-study
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.chartContainer}>
            <Svg width={chartWidth} height={chartHeight}>
              {/* Horizontal grid lines */}
              {[0, 47.75, 95.51, 143.26, 191.02].map((y, i) => (
                <Line
                  key={i}
                  x1="0"
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke="#E5E7EB"
                  strokeWidth="0.98"
                />
              ))}

              {/* Jellinote line - purple when active, grey when inactive */}
              <Polyline
                points={jellinotePolyline}
                fill="none"
                stroke={activeChart === 'jellinote' ? '#7C3AED' : '#D1D1D6'}
                strokeWidth="4.02"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Self-study line - purple when active, grey when inactive */}
              <Polyline
                points={selfStudyPolyline}
                fill="none"
                stroke={activeChart === 'self-study' ? '#7C3AED' : '#D1D1D6'}
                strokeWidth="4.02"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <ContinueButton
          onPress={() => router.push('/(onboarding)/step4' as any)}
        />
      </View>

    </SafeAreaView>
  )
}

// styles imported from onboarding-styles/student9
