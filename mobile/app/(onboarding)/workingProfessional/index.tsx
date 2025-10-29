import React, { useEffect } from 'react'
import { useRouter } from 'expo-router'

export default function IndexRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to workingProfessional1
    router.replace('/(onboarding)/workingProfessional/workingProfessional1')
  }, [])

  return null
}
