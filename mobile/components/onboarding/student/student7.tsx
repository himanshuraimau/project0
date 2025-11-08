import React, { useState } from 'react'
import { SafeAreaView, View, Text, TouchableOpacity, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import styles from '../onboarding-styles/student7'

export default function Student7() {
  const router = useRouter()
  const [gpa, setGpa] = useState<number>(3.8)

  const dec = () => setGpa((v) => Math.max(0, Math.round((v - 0.1) * 10) / 10))
  const inc = () => setGpa((v) => Math.min(4.0, Math.round((v + 0.1) * 10) / 10))

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
        <Text style={styles.context}>Personalizing Jellinote for you...</Text>
        <Text style={styles.title}>What's your current GPA?</Text>

        <View style={styles.gpaWrap}>
          <TouchableOpacity style={styles.gpaButton} onPress={dec} activeOpacity={0.8}>
            <Text style={styles.gpaButtonText}>−</Text>
          </TouchableOpacity>

          <View style={styles.gpaValueWrap}>
            <Text style={styles.gpaValue}>{gpa.toFixed(1)}</Text>
          </View>

          <TouchableOpacity style={styles.gpaButton} onPress={inc} activeOpacity={0.8}>
            <Text style={styles.gpaButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/(onboarding)/student-flow/student8' as any)}>
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

// styles imported from onboarding-styles/student7
