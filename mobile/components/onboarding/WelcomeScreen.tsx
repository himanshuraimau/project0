import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { Link } from 'expo-router'
import React from 'react'
import { Pressable, StatusBar, Text, View } from 'react-native'
import { welcomeScreenStyles as styles } from './styles'

interface FeatureTagProps {
  icon: React.ReactNode
  text: string
}

const FeatureTag: React.FC<FeatureTagProps> = ({ icon, text }) => {
  return (
    <BlurView
      intensity={20}
      tint="light"
      style={styles.featureTag}
    >
      <View style={styles.featureTagInner}>
        {icon}
        <Text style={styles.featureTagText}>{text}</Text>
      </View>
    </BlurView>
  )
}

interface GlassButtonProps {
  text: string
  icon?: React.ReactNode
}

const GlassButton: React.FC<GlassButtonProps> = ({ text, icon }) => {
  return (
    <BlurView
      intensity={20}
      tint="light"
      style={styles.glassButton}
    >
      <View style={styles.glassButtonInner}>
        <Text style={styles.glassButtonText}>{text}</Text>
        {icon}
      </View>
    </BlurView>
  )
}

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#A855F7', '#7C3AED', '#6D28D9']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradient}
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <View style={styles.ghostContainer}>
              <Text style={styles.ghostEmoji}>👻</Text>
            </View>
          </View>
        </View>

        {/* Headline Section */}
        <View style={styles.headlineSection}>
          <Text style={styles.headlineText}>Capture.</Text>
          <Text style={styles.headlineText}>Understand.</Text>
          <Text style={[styles.headlineText, styles.headlineHighlight]}>
            Remember.
          </Text>
        </View>

        {/* Feature Tags */}
        <View style={styles.featureTagsContainer}>
          <FeatureTag
            icon={
              <Ionicons
                name="chatbubble-outline"
                size={18}
                color="white"
              />
            }
            text="Meetings"
          />
          <FeatureTag
            icon={
              <Ionicons
                name="globe-outline"
                size={18}
                color="white"
              />
            }
            text="100+ languages"
          />
          <FeatureTag
            icon={
              <MaterialCommunityIcons
                name="file-document-outline"
                size={18}
                color="white"
              />
            }
            text="PDF"
          />
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          {/* Secondary CTA */}
          <GlassButton
            text="try for $0"
            icon={
              <Ionicons
                name="arrow-down"
                size={16}
                color="white"
              />
            }
          />

          {/* Primary CTA */}
          <Link href="/(auth)/sign-up" asChild>
            <Pressable style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Continue</Text>
              <Text style={styles.primaryButtonEmoji}>👉</Text>
            </Pressable>
          </Link>
        </View>

        {/* Footer Link */}
        <View style={styles.footer}>
          <Link href="/(auth)/sign-in" asChild>
            <Pressable>
              <Text style={styles.footerText}>
                Already have an account?
              </Text>
            </Pressable>
          </Link>
        </View>
      </LinearGradient>
    </View>
  )
}

