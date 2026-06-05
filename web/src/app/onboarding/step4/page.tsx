import { OnboardingStep4 } from "@/components/onboarding";
import { OnboardingAuthGate } from "@/components/onboarding/onboarding-auth-gate";

export default function Step4Page() {
  return (
    <OnboardingAuthGate>
      <OnboardingStep4 />
    </OnboardingAuthGate>
  );
}
