import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import FlashcardView from '@/components/notes/FlashcardView'

export default function FlashcardsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  
  return <FlashcardView noteId={id || ''} />
}
