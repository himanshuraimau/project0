import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import PodcastPlayerView from '@/components/notes/podcast/PodcastPlayerView'

export default function PodcastPlayerScreen() {
    const { id, podcastId } = useLocalSearchParams<{ id: string; podcastId?: string }>()

    return <PodcastPlayerView noteId={id} podcastId={podcastId} />
}
