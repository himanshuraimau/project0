import React from 'react'
import { SafeAreaView, View, Text, TouchableOpacity, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { ContinueButton } from '../../ui/ContinueButton'
import styles from '../onboarding-styles/administrator1'

export default function Administrator1() {
  const router = useRouter()
  const handleContinue = () => {
    router.push('/(onboarding)/administrator-flow/administrator2' as any)
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.statusBar}>
        <Text style={styles.time}>6:10</Text>
        <View style={styles.statusIcons}>
          <Text style={styles.icon}>📶</Text>
          <Text style={styles.icon}>📡</Text>
          <Text style={styles.icon}>🔋</Text>
        </View>
      </View>

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
            <Text style={styles.check}>✓</Text>
            <Text style={styles.featureText}>Capture and summarize staff meetings instantly</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.check}>✓</Text>
            <Text style={styles.featureText}>Collect and organize notes faster</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.check}>✓</Text>
            <Text style={styles.featureText}>Inspire students through smarter learning</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.check}>✓</Text>
            <Text style={styles.featureText}>Support teachers with resources built by AI</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <ContinueButton 
          variant="gradient"
          onPress={handleContinue}
        />
      </View>

      <View style={styles.gesture} />
    </SafeAreaView>
  )
}

// styles imported from onboarding-styles/administrator1
