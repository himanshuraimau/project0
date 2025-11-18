import React, { useState, useEffect } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'
import {
  StatusBar,
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { notesApi } from '@/lib/api'
import { setClerkTokenGetter } from '@/lib/api/client'
import type { Note } from '@/lib/api/types'
import BackButton from '@/components/ui/BackButton'

interface TranscriptViewProps {
  noteId: string
}

export default function TranscriptView({ noteId }: TranscriptViewProps) {
  const router = useRouter()
  const { getToken } = useAuth()
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Set up Clerk token getter on mount
  useEffect(() => {
    setClerkTokenGetter(getToken)
  }, [getToken])

  // Fetch note data on mount
  useEffect(() => {
    if (noteId) {
      fetchNote()
    }
  }, [noteId])

  const fetchNote = async () => {
    try {
      setLoading(true)
      setError(null)
      const fetchedNote = await notesApi.getNoteById(noteId)
      setNote(fetchedNote)
    } catch (err: any) {
      console.error('Failed to fetch note:', err)
      setError(err.message || 'Failed to load transcript')
    } finally {
      setLoading(false)
    }
  }

  // Highlight search matches in transcript
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text
    // For now, return plain text. Can be enhanced with actual highlighting
    return text
  }

  // Show loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Loading transcript...</Text>
          </View>
        </SafeAreaView>
      </View>
    )
  }

  // Show error state
  if (error || !note) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{error || 'Transcript not found'}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={fetchNote}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.backButtonError}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonErrorText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    )
  }

  return (
    <>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={styles.safeArea}>
          {/* Custom Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <BackButton iconColor="#111827" />
            </View>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Transcript</Text>
            </View>

            <View style={styles.headerRight}>
              <View style={styles.actionIcons}>
                <TouchableOpacity style={styles.iconButton}>
                  <Feather name="copy" size={20} color="#374151" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                  <Feather name="download" size={20} color="#374151" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                  <Feather name="share-2" size={20} color="#374151" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Feather name="search" size={18} color="#9CA3AF" style={{ marginLeft: 12 }} />
            <TextInput
              placeholder="Search in transcript..."
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => setSearchQuery('')}
                style={{ paddingRight: 12 }}
              >
                <Feather name="x" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Transcript For Section */}
            <View style={styles.transcriptForSection}>
              <Text style={styles.transcriptForLabel}>Transcript for:</Text>
              <Text style={styles.transcriptTitle}>{note.title}</Text>
            </View>

            {/* Transcript Content */}
            <View style={styles.transcriptContent}>
              <Text style={styles.contentText}>
                {highlightText(note.content, searchQuery)}
              </Text>
            </View>

            {/* Bottom spacing */}
            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timeBadge: {
    backgroundColor: '#F87171',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
  },
  timeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'flex-start',
    paddingLeft: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    height: 44,
    marginHorizontal: 20,
    marginVertical: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: '#111827',
    fontSize: 15,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  transcriptForSection: {
    marginBottom: 40,
  },
  transcriptForLabel: {
    width: 136,
    height: 24,
    left: 0,
    top: -1.74,
    fontFamily: 'Arimo',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 24,
    color: '#9810FA',
  },
  transcriptTitle: {
    width: 338,
    height: 48,
    marginTop: 10,
    marginBottom: 20,
    fontFamily: 'Arimo',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 17,
    lineHeight: 24,
    color: '#364153',
  },
  transcriptMetadata: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },
  transcriptContent: {
    marginBottom: 24,
  },
  contentText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },
  homeIndicator: {
    height: 6,
    backgroundColor: '#E6E6F0',
    borderRadius: 999,
    marginTop: 12,
    marginBottom: 6,
    alignSelf: 'center',
    width: 120,
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  errorText: {
    marginTop: 16,
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#7C3AED',
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButtonError: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonErrorText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
})
