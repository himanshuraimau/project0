import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import QuizView from '@/components/notes/QuizView'

export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()

  return <QuizView noteId={id || ''} />
}
