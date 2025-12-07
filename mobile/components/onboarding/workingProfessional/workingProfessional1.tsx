import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurGradient } from "../../ui/BlurGradient";
import { workingProfessionalStyles as styles } from "../onboarding-styles/working-professional-styles";
import { useRouter } from "expo-router";
import { ChevronLeft } from 'lucide-react-native'

const fields = [
  { id: "business", emoji: "💼", label: "Business / Tech" },
  { id: "creative", emoji: "🎨", label: "Creative & Media" },
  { id: "education", emoji: "🎓", label: "Education" },
  { id: "finance", emoji: "💲", label: "Finance" },
  { id: "healthcare", emoji: "💖", label: "Healthcare" },
  { id: "legal", emoji: "⚖️", label: "Legal" },
  { id: "manager", emoji: "👥", label: "Manager / Executive" },
  { id: "public", emoji: "📦", label: "Public Service" },
  { id: "sales", emoji: "📈", label: "Sales / Marketing" },
  { id: "other", emoji: "⏩", label: "Something else" },
];

export default function WorkingProfessional() {
  const router = useRouter()
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  const handleFieldSelect = (fieldId: string) => {
    setSelectedOption(fieldId)
    // Navigate immediately when a field is clicked
    setTimeout(() => {
      try {
        // Navigate to the second working professional onboarding screen
        router.push('/(onboarding)/workingProfessional/workingProfessional2')
      } catch (e) {
        // fallback: do nothing
      }
    }, 300)
  }

  return (
    <LinearGradient
      colors={["#F7F5FF", "#F9FAFB"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" />

      {/* Top Right Purple Blur Gradient */}
      <BlurGradient
        colors={['#9810FA', '#441AFF']}
        width={286}
        height={256}
        right={-80}
        top={-136}
        opacity={0.1}
      />

      {/* Bottom Left Purple Blur Gradient */}
      <BlurGradient
        colors={['#9810FA', '#441AFF']}
        width={286}
        height={256}
        left={-90}
        top={508}
        opacity={0.1}
      />

      <SafeAreaView style={{ flex: 1 }}>
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

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >

          <View style={styles.headerContainer}>
            <Text style={styles.subHeading}>Personalizing Jellinote for you...</Text>
            <Text style={styles.mainHeading}>What field do you work in?</Text>
          </View>

          <View style={styles.list}>
            {fields.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[
                  styles.fieldButton,
                  selectedOption === f.id ? styles.fieldButtonSelected : null,
                ]}
                activeOpacity={0.8}
                onPress={() => handleFieldSelect(f.id)}
              >
                <Text style={styles.fieldEmoji}>{f.emoji}</Text>
                <Text style={styles.fieldLabel}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        <View style={styles.gestureBar} />
      </SafeAreaView>
    </LinearGradient>
  )
}
