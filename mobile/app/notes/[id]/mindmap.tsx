import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import MindmapView from '@/components/notes/MindmapView'

export default function MindmapScreen() {
    const { id } = useLocalSearchParams<{ id: string }>()

    return <MindmapView noteId={id} />
}
