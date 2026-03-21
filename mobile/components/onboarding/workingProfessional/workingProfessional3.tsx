import React, { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ContinueButton } from "../../ui/ContinueButton";
import { OnboardingOptionRow } from "../OnboardingOptionRow";
import { OnboardingScreenShell } from "../OnboardingScreenShell";

const options = [
  { id: "focus", emoji: "🎯", text: "Stay focused during meetings and calls" },
  { id: "autoNotes", emoji: "✍️", text: "Have my notes written automatically" },
  { id: "summarize", emoji: "📄", text: "Summarize documents, videos, / PDFs" },
  { id: "learn", emoji: "📚", text: "Learn and retain information faster" },
  { id: "other", emoji: "✏️", text: "Something else" },
];

export default function WorkingProfessional3() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  return (
		<OnboardingScreenShell
			
      currentStep={3}
      totalSteps={4}
      showBackButton
      subHeading="Personalizing for you"
      mainHeading="What do you want Flinote to help with?"
      footer={
        <ContinueButton
          onPress={() =>
            router.push(
              "/(onboarding)/workingProfessional/workingProfessional4" as any
            )
          }
          disabled={!selected}
        />
      }
    >
      <View style={{ gap: 10 }}>
        {options.map((o, i) => (
          <OnboardingOptionRow
            key={o.id}
            icon={<Text style={{ fontSize: 22 }}>{o.emoji}</Text>}
            label={o.text}
            isSelected={selected === o.id}
            onPress={() => setSelected(o.id)}
            index={i}
          />
        ))}
      </View>
    </OnboardingScreenShell>
  );
}
