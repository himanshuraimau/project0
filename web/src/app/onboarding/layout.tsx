import { OnboardingProvider } from "@/contexts/onboarding-context";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { ReactNode } from "react";

export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <OnboardingProvider>
      <OnboardingShell>{children}</OnboardingShell>
    </OnboardingProvider>
  );
}
