import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import TranscriptView from '@/components/notes/TranscriptView'

export default function TranscriptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()

  return <TranscriptView noteId={id || ''} />
}
