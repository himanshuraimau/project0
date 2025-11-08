import { useRouter } from 'expo-router'
import { useEffect } from 'react'

export default function PaywallIndex() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/(onboarding)/paywall/paywall1' as any)
  }, [router])
  return null
}
