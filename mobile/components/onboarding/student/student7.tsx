import React, { useState, useRef } from 'react'
import { SafeAreaView, View, Text, TouchableOpacity, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { BlurGradient } from '../../ui/BlurGradient'
import { ContinueButton } from '../../ui/ContinueButton'
import { ChevronLeft } from 'lucide-react-native'
import styles from '../onboarding-styles/student7'

export default function Student7() {
  const router = useRouter()
  const [gpa, setGpa] = useState<number>(3.8)
  const intervalRef = useRef<any>(null)

  const dec = () => setGpa((v) => {
    const newVal = Math.max(0, v - 0.1)
    return parseFloat(newVal.toFixed(1))
  })
  const inc = () => setGpa((v) => {
    const newVal = Math.min(10.0, v + 0.1)
    return parseFloat(newVal.toFixed(1))
  })

  const startDecrement = () => {
    dec()
    intervalRef.current = setInterval(() => {
      dec()
    }, 100)
  }

  const startIncrement = () => {
    inc()
    intervalRef.current = setInterval(() => {
      inc()
    }, 100)
  }

  const stopCounter = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Purple blur gradient */}
      <BlurGradient
        colors={['#9810FA', '#441AFF']}
        width={256}
        height={256}
        opacity={0.1}
        left={217}
        top={18.56}
      />

      {/* Teal-Blue blur gradient */}
      <BlurGradient
        colors={['#14C3A2', '#4C57FF']}
        width={256}
        height={256}
        opacity={0.1}
        left={-90}
        top={497.56}
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
        <Text style={styles.context}>Personalizing Flinote for you...</Text>
        <Text style={styles.title}>What's your current GPA?</Text>
        <Text style={styles.subtitle}>Not sure? A close estimate is fine. You can skip.</Text>

        <View style={styles.gpaWrap}>
          <TouchableOpacity
            style={styles.gpaButton}
            onPressIn={startDecrement}
            onPressOut={stopCounter}
            activeOpacity={0.8}
          >
            <Text style={styles.gpaButtonText}>−</Text>
          </TouchableOpacity>

          <View style={styles.gpaValueWrap}>
            <Text style={styles.gpaValue}>{gpa.toFixed(1)}</Text>
          </View>

          <TouchableOpacity
            style={styles.gpaButton}
            onPressIn={startIncrement}
            onPressOut={stopCounter}
            activeOpacity={0.8}
          >
            <Text style={styles.gpaButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <ContinueButton
          onPress={() => router.push(`/(onboarding)/student-flow/student8?currentGpa=${gpa}` as any)}
        />
      </View>
    </SafeAreaView>
  )
}

// styles imported from onboarding-styles/student7
