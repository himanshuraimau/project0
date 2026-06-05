import { OnboardingStep2 } from "@/components/onboarding";
import { OnboardingAuthGate } from "@/components/onboarding/onboarding-auth-gate";

export default function Step2Page() {
  return (
    <OnboardingAuthGate>
      <OnboardingStep2 />
    </OnboardingAuthGate>
  );
}
