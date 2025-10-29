import React, { useEffect } from 'react'
import { useRouter } from 'expo-router'

export default function IndexRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to teacher1
    router.replace('/(onboarding)/teacher-flow/teacher1' as any)
  }, [])

  return null
}
