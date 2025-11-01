import { useRouter } from 'expo-router'
import { useEffect } from 'react'

export default function ParentIndex() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/(onboarding)/parent/parent1' as any)
  }, [router])
  return null
}
