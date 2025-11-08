import { useRouter } from 'expo-router'
import { useEffect } from 'react'

export default function IndexRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/(onboarding)/teacher-flow/teacher1' as any)
  }, [])
  return null
}
