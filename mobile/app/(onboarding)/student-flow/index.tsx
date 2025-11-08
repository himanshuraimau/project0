import { useRouter } from 'expo-router'
import { useEffect } from 'react'

export default function StudentIndex() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/(onboarding)/student-flow/student1' as any)
  }, [router])
  return null
}
