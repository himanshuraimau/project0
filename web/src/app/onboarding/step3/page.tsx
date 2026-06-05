import { OnboardingStep3 } from "@/components/onboarding";
import { OnboardingAuthGate } from "@/components/onboarding/onboarding-auth-gate";

export default function Step3Page() {
  return (
    <OnboardingAuthGate>
      <OnboardingStep3 />
    </OnboardingAuthGate>
  );
}
