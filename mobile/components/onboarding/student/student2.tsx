import React, { useState } from 'react'
import { SafeAreaView, View, Text, TouchableOpacity, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { BlurGradient } from '../../ui/BlurGradient'
import { ContinueButton } from '../../ui/ContinueButton'
import { ChevronLeft } from 'lucide-react-native'
import styles from '../onboarding-styles/student2'

export default function Student2() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)



  const OPTIONS = [
    { id: 'senior', icon: '🎓', label: 'Senior / 4th+ year', iconBg: '#DCFCE7' },
    { id: 'junior', icon: '🎓', label: 'Junior / 3rd year', iconBg: '#FFEDD4' },
    { id: 'sophomore', icon: '🎓', label: 'Soph / 2nd year', iconBg: '#DCFCE7' },
    { id: 'freshman', icon: '🌱', label: 'Freshman / 1st year', iconBg: '#DCFCE7' },
    { id: 'graduate', icon: '🎓', label: 'Graduate school', iconBg: '#FFEDD4' },
  ]

  return (
    <SafeAreaView style={styles.container}>
      {/* Blur gradient - Purple */}
      <BlurGradient
        colors={['#9810FA', '#441AFF']}
        width={256}
        height={256}
        opacity={0.1}
        left={256}
        top={142}
      />

      <View style={styles.header}>
        <ChevronLeft size={28} color="#000000" style={{ marginRight: 12 }} />
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.content}>
        <View>
          <Text style={styles.context}>Personalizing Jellinote for you...</Text>
          <Text style={styles.title}>What year are you in?</Text>
        </View>

        <View style={styles.options}>
          {OPTIONS.map((o) => {
            const sel = selected === o.id
            return (
              <TouchableOpacity
                key={o.id}
                activeOpacity={0.85}
                onPress={() => setSelected(o.id)}
                style={[styles.option, sel && styles.optionSelected]}
              >
                <Text style={[styles.optionIcon, { backgroundColor: o.iconBg }]}>{o.icon}</Text>
                <Text style={styles.optionLabel}>{o.label}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <ContinueButton
          variant="gradient"
          onPress={() => router.push('/(onboarding)/student-flow/student3' as any)}
        />
      </View>
    </SafeAreaView>
  )
}

// styles imported from onboarding-styles/student2
