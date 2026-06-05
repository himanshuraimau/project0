import { OnboardingStep1 } from "@/components/onboarding";
import { OnboardingAuthGate } from "@/components/onboarding/onboarding-auth-gate";

export default function Step1Page() {
  return (
    <OnboardingAuthGate>
      <OnboardingStep1 />
    </OnboardingAuthGate>
  );
}
