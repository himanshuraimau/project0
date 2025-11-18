import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import NoteView from '@/components/notes/NoteView'

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()

  return <NoteView noteId={id || ''} />
}
