import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { Link, useRouter } from 'expo-router'
import MaskedView from '@react-native-masked-view/masked-view'
import React from 'react'
import { Pressable, StatusBar, Text, View, Image } from 'react-native'
import { welcomeScreenStyles as styles } from './onboarding-styles/welcome-screen-styles'

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
    <View style={styles.glassButton}>
      <LinearGradient
        colors={['rgba(255, 223, 32, 0.2)', 'rgba(253, 165, 213, 0.2)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.glassButtonInner}
      >
        <Text style={styles.glassButtonText}>{text}</Text>
        <Text style={[styles.glassButtonText, { fontSize: 16, lineHeight: 24 }]}>
          {icon ? '↓' : null}
        </Text>
      </LinearGradient>
    </View>
  )
}

export default function WelcomeScreen() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#7F22FE', '#9810FA', '#432DD7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Image 
            source={require('../../assets/images/main-logo.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Headline Section */}
        <View style={styles.headlineSection}>
          <Text style={styles.headlineText}>Capture.</Text>
          <Text style={styles.headlineText}>Understand.</Text>
          <MaskedView
            maskElement={
              <Text style={styles.headlineHighlight}>
                Remember.
              </Text>
            }
          >
            <LinearGradient
              colors={['#FFF085', '#FCCEE8', '#A2F4FD']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
            >
              <Text style={[styles.headlineHighlight, { opacity: 0 }]}>
                Remember.
              </Text>
            </LinearGradient>
          </MaskedView>
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
          <Pressable 
            style={styles.primaryButton}
            onPress={() => router.push('/(onboarding)/step1' as any)}
          >
            <LinearGradient
              colors={['#000000', '#0F0517', '#080808']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.primaryButtonGradient, { position: 'absolute', width: '100%', height: '100%' }]}
            />
            <LinearGradient
              colors={['rgba(0, 0, 0, 0)', 'rgba(255, 255, 255, 0.2)', 'rgba(0, 0, 0, 0)']}
              start={{ x: 0.2, y: 0.5 }}
              end={{ x: 1, y: 0.5 }} 
              style={[styles.primaryButtonOverlay, { position: 'absolute', width: '100%', height: '100%' }]}
            />
            <Text style={styles.primaryButtonText}>Continue 👉</Text>    
          </Pressable>
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

