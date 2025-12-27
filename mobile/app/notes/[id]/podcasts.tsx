import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import PodcastListView from '@/components/notes/podcast/PodcastListView'

export default function AllPodcastsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>()

    return <PodcastListView noteId={id} />
}
