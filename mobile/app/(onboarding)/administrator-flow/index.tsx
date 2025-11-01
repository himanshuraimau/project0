import { useRouter } from 'expo-router'
import { useEffect } from 'react'

export default function AdministratorIndex() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/(onboarding)/administrator-flow/administrator1' as any)
  }, [router])
  return null
}
