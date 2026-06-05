import { OnboardingStep5 } from "@/components/onboarding";
import { OnboardingAuthGate } from "@/components/onboarding/onboarding-auth-gate";

export default function Step5Page() {
  return (
    <OnboardingAuthGate>
      <OnboardingStep5 />
    </OnboardingAuthGate>
  );
}
