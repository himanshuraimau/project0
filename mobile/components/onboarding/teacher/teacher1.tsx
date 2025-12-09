import React from 'react'
import { View, Text, TouchableOpacity, StatusBar, SafeAreaView } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { ChevronLeft } from 'lucide-react-native'
import { BlurGradient } from '../../ui/BlurGradient'
import { ContinueButton } from '../../ui/ContinueButton'
import styles from '../onboarding-styles/teacher1'

export default function Teacher1() {
  const router = useRouter()
  return (
    <SafeAreaView style={styles.screen}>


      {/* Bottom left blur gradient */}
      <BlurGradient
        colors={['#14C3A2', '#4C57FF']}
        width={256}
        height={256}
        opacity={0.1}
        left={-66}
        top={650}
      />

      {/* Top right blur gradient */}
      <BlurGradient
        colors={['#9810FA', '#441AFF']}
        width={256}
        height={256}
        opacity={0.1}
        left={265}
        top={116.5}
      />

      {/* Header with back button and progress */}
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
        <Text style={styles.title}>You're in the right place.</Text>
        <Text style={styles.subtitle}>Trusted by educators of professionals like you</Text>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <View style={styles.checkContainer}>
              <Ionicons name="checkmark" size={16} color="#2C94CA" />
            </View>
            <Text style={styles.featureText}>Streamline lecture prep and delivery</Text>
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
            <Text style={styles.featureText}>Inspire students through smarter learning</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.checkContainer}>
              <Ionicons name="checkmark" size={16} color="#2C94CA" />
            </View>
            <Text style={styles.featureText}>Stay present in meetings—get action items automati</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <ContinueButton
          variant="gradient"
          onPress={() => router.push('/(onboarding)/teacher-flow/teacher2' as any)}
        />
      </View>
    </SafeAreaView>
  )
}

// styles imported from onboarding-styles/teacher1
