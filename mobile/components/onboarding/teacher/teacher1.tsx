import React from 'react'
import { View, Text, TouchableOpacity, StatusBar } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { BlurGradient } from '../../ui/BlurGradient'
import styles from '../onboarding-styles/teacher1'

export default function Teacher1() {
  const router = useRouter()
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" translucent={false} backgroundColor="#F9FAFB" />

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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#0A0A0A" />
        </TouchableOpacity>
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
        <TouchableOpacity 
          activeOpacity={0.85}
          onPress={() => router.push('/(onboarding)/teacher-flow/teacher2' as any)}
        >
          <LinearGradient 
            colors={['#4C57FF', '#9810FA']} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 1 }} 
            style={styles.continueButton}
          >
            <Text style={styles.continueText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  )
}

// styles imported from onboarding-styles/teacher1
