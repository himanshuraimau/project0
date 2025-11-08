import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { workingProfessionalStyles as styles } from "../onboarding-styles/working-professional-styles";
import { useRouter } from "expo-router";

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

  return (
    <LinearGradient
      colors={["#F7F5FF", "#F9FAFB"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
          </View>
        </View>

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
              onPress={() => setSelectedOption(f.id)}
            >
              <Text style={styles.fieldEmoji}>{f.emoji}</Text>
              <Text style={styles.fieldLabel}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedOption && (
          <View style={styles.continueButtonContainer}>
            <TouchableOpacity
              style={styles.continueButton}
              activeOpacity={0.85}
              onPress={() => {
                try {
                  // Navigate to the second working professional onboarding screen
                  router.push('/(onboarding)/workingProfessional/workingProfessional2')
                } catch (e) {
                  // fallback: do nothing
                }
              }}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      <View style={styles.gestureBar} />
    </LinearGradient>
  )
}
