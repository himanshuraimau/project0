import React from 'react'
import { SafeAreaView, View, Text, TouchableOpacity, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { ContinueButton } from '../../ui/ContinueButton'
import { BlurGradient } from '../../ui/BlurGradient'
import styles from '../onboarding-styles/administrator1'

export default function Administrator1() {
  const router = useRouter()
  const handleContinue = () => {
    router.push('/(onboarding)/administrator-flow/administrator2' as any)
  }

  return (
    <SafeAreaView style={styles.container}>
      <BlurGradient
        colors={['#9810FA', '#441AFF']}
        width={256}
        height={256}
        opacity={0.1}
        left={265}
        top={200}
      />
      
      <BlurGradient
        colors={['#9810FA', '#441AFF']}
        width={256}
        height={256}
        opacity={0.1}
        left={-26}
        top={600}
      />

      <View style={styles.header}>
        <Text style={styles.back}>&lt;</Text>
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>You're in the right place.</Text>
        <Text style={styles.subtitle}>Trusted by thousands of school leaders of professionals like you</Text>

        <View style={styles.features}>
          <View style={styles.featureRow}>
            <View style={styles.checkContainer}>
              <Ionicons name="checkmark" size={16} color="#2C94CA" />
            </View>
            <Text style={styles.featureText}>Capture and summarize staff meetings instantly</Text>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.checkContainer}>
              <Ionicons name="checkmark" size={16} color="#2C94CA" />
            </View>
            <Text style={styles.featureText}>Collect and organize notes faster</Text>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.checkContainer}>
              <Ionicons name="checkmark" size={16} color="#2C94CA" />
            </View>
            <Text style={styles.featureText}>Inspire students through smarter learning</Text>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.checkContainer}>
              <Ionicons name="checkmark" size={16} color="#2C94CA" />
            </View>
            <Text style={styles.featureText}>Stay present in meetings—get action items automatically</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <ContinueButton 
          variant="gradient"
          onPress={handleContinue}
        />
      </View>
    </SafeAreaView>
  )
}

// styles imported from onboarding-styles/administrator1
