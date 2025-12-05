import React from 'react'
import { SafeAreaView, View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { ChevronLeft } from 'lucide-react-native'
import { BlurGradient } from '../../ui/BlurGradient'
import { ContinueButton } from '../../ui/ContinueButton'
import styles from '../onboarding-styles/parent1'

export default function Parent1() {
  const router = useRouter()

  return (
    <SafeAreaView style={styles.container}>
      {/* Teal-Blue blur gradient */}
      <BlurGradient
        colors={['#14C3A2', '#4C57FF']}
        width={256}
        height={256}
        opacity={0.1}
        left={-87}
        top={654.5}
      />

      <View style={styles.header}>
        <ChevronLeft size={28} color="#000000" style={{ marginRight: 12 }} />
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>You're in the right place.</Text>
        <Text style={styles.subtitle}>
          Join <Text style={styles.subtitleBold}>thousands of</Text> Parents using Jellinote to:
        </Text>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <View style={styles.check}>
              <Ionicons name="checkmark" size={16} color="#2C94CA" />
            </View>
            <Text style={styles.featureText}>Boost their child's results with smart study tools</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.check}>
              <Ionicons name="checkmark" size={16} color="#2C94CA" />
            </View>
            <Text style={styles.featureText}>Turn classes into ready-to-review notes</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.check}>
              <Ionicons name="checkmark" size={16} color="#2C94CA" />
            </View>
            <Text style={styles.featureText}>Record and summarize calls & voice notes</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.check}>
              <Ionicons name="checkmark" size={16} color="#2C94CA" />
            </View>
            <Text style={styles.featureText}>Stay present in meetings and get action items automatically</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <ContinueButton
          variant="gradient"
          onPress={() => router.push('/(onboarding)/parent/parent2' as any)}
        />
      </View>

    </SafeAreaView>
  )
}
