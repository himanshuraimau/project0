import React, { useState } from 'react'
import { SafeAreaView, View, Text, TouchableOpacity, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { ContinueButton } from '../../ui/ContinueButton'
import { ChevronLeft } from 'lucide-react-native'
import { OptionButton } from '../../ui/OptionButton'
import styles from '../onboarding-styles/student3'

export default function Student3() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)



  const OPTIONS = [
    { id: 'arts', icon: '🎨', label: 'Arts & Humanities', iconBg: '#FFEDD4' },
    { id: 'business', icon: '💼', label: 'Business & Economics', iconBg: '#FEF3C6' },
    { id: 'education', icon: '🎓', label: 'Education', iconBg: '#FFE2E2' },
    { id: 'engineering', icon: '⚙️', label: 'Engineering & Technology', iconBg: '#D1D5DC' },
    { id: 'health', icon: '❤️', label: 'Health & Medicine', iconBg: '#FFE2E2' },
    { id: 'law', icon: '⚖️', label: 'Law & Criminal Justice', iconBg: '#D1D5DC' },
    { id: 'sciences', icon: '🧪', label: 'Life & Physical Sciences', iconBg: '#DBEAFE' },
    { id: 'other', icon: '🌍', label: 'Other', iconBg: '#BEDBFF' },
  ]

  return (
    <SafeAreaView style={styles.container}>
      {/* Teal-Blue blur gradient - Bottom */}
      {/* <BlurGradient
        colors={['#14C3A2', '#4C57FF']}
        width={256}
        height={256}
        opacity={0.1}
        left={-59}
        top={646}
      /> */}

      {/* Purple blur gradient - Top */}
      {/* <BlurGradient
        colors={['#9810FA', '#441AFF']}
        width={256}
        height={256}
        opacity={0.1}
        left={226}
        top={217}
      /> */}

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

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.content}>
        <Text style={styles.context}>Personalizing Flinote for you...</Text>
        <Text style={styles.title}>What is your major or primary area of study?</Text>

        <View style={styles.options}>
          {OPTIONS.map((o) => (
            <OptionButton
              key={o.id}
              icon={o.icon}
              label={o.label}
              iconBg={o.iconBg}
              selected={selected === o.id}
              onPress={() => setSelected(o.id)}
              style={styles.optionOverride}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <ContinueButton
          onPress={() => router.push('/(onboarding)/student-flow/student4' as any)}
          disabled={!selected}
        />
      </View>
    </SafeAreaView>
  )
}

// styles imported from onboarding-styles/student3
