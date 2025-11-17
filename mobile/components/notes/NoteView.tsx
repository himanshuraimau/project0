import React, { useState, useEffect } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'
import { useTranslation } from 'react-i18next'
import {
  StatusBar,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { notesApi } from '@/lib/api'
import { setClerkTokenGetter } from '@/lib/api/client'
import type { Note } from '@/lib/api/types'
import { getTranslatedNote } from '@/lib/utils/translation'
import BackButton from '@/components/ui/BackButton'

interface NoteViewProps {
  noteId: string
}

export default function NoteView({ noteId }: NoteViewProps) {
  const router = useRouter()
  const { getToken } = useAuth()
  const { t, i18n } = useTranslation()
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Set up Clerk token getter on mount
  useEffect(() => {
    setClerkTokenGetter(getToken)
  }, [getToken])

  // Fetch note data on mount or when language changes
  useEffect(() => {
    if (noteId) {
      fetchNote()
    }
  }, [noteId, i18n.language])

  const fetchNote = async () => {
    try {
      setLoading(true)
      setError(null)
      const fetchedNote = await notesApi.getNoteById(noteId)
      setNote(fetchedNote)
    } catch (err: any) {
      console.error('Failed to fetch note:', err)
      setError(err.message || 'Failed to load note')
    } finally {
      setLoading(false)
    }
  }

  // Get translated content based on current language
  const getDisplayContent = () => {
    if (!note) return { title: '', content: '' }
    return getTranslatedNote(note)
  }

  const { title: displayTitle, content: displayContent } = getDisplayContent()

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  // Calculate estimated read time based on content length
  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200
    const wordCount = content.split(/\s+/).length
    const minutes = Math.ceil(wordCount / wordsPerMinute)
    return `${minutes} min read`
  }

  const actionChips = [
    { id: 1, icon: 'globe', label: t('note.translate') },
    { id: 2, icon: 'file-text', label: t('note.transcript') },
    { id: 3, icon: 'folder', label: t('note.folder') },
  ]

  const studyTools = [
    { id: 1, icon: 'book', label: t('note.editNote'), color: '#FB923C', bgColor: '#FED7AA' },
    { id: 2, icon: 'message-circle', label: t('note.chat'), color: '#A855F7', bgColor: '#E9D5FF' },
    { id: 3, icon: 'cpu', label: t('note.takeQuiz'), color: '#EC4899', bgColor: '#FBCFE8' },
    { id: 4, icon: 'square', label: t('note.flashcards'), color: '#06B6D4', bgColor: '#A5F3FC' },
    { id: 5, icon: 'headphones', label: t('note.podcast'), color: '#8B5CF6', bgColor: '#DDD6FE' },
    { id: 6, icon: 'plus', label: t('note.mindMap'), color: '#3B82F6', bgColor: '#BFDBFE' },
  ]

  // Handle action chip press
  const handleChipPress = (chipId: number) => {
    if (chipId === 2) { // Transcript chip
      router.push(`/notes/${noteId}/transcript`)
    } else if (chipId === 1) { // Translate chip
      // Handle translate action
      console.log('Translate pressed')
    } else if (chipId === 3) { // Folder chip
      // Handle folder action
      console.log('Folder pressed')
    }
  }

  // Handle study tool press
  const handleStudyToolPress = (toolId: number) => {
    if (toolId === 3) { // Take quiz
      router.push(`/notes/${noteId}/quiz`)
    } else if (toolId === 1) { // Edit note
      console.log('Edit note pressed')
    } else if (toolId === 2) { // Chat
      router.push(`/notes/${noteId}/chat`)
    } else if (toolId === 4) { // Flashcards
      router.push(`/notes/${noteId}/flashcards`)
    } else if (toolId === 5) { // Podcast
      console.log('Podcast pressed')
    } else if (toolId === 6) { // MindMap
      console.log('MindMap pressed')
    }
  }

  // Show loading state
  if (loading) {
    return (
      <LinearGradient
        colors={['#FFFFFF', '#FBF7FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    )
  }

  // Show error state
  if (error || !note) {
    return (
      <LinearGradient
        colors={['#FFFFFF', '#FBF7FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{error || t('note.failedToLoad')}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={fetchNote}
            >
              <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.backButtonError}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonErrorText}>{t('common.back')}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    )
  }

  return (
    <>
      <LinearGradient
        colors={['#FFFFFF', '#FBF7FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={styles.safeArea}>
          {/* Custom Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.timeBadge}>
                <Text style={styles.timeText}>4:26</Text>
              </View>
              <BackButton iconColor="#111827" />
            </View>

            <View style={styles.headerCenter}>
              <Text style={styles.emojiIcon}>😟</Text>
            </View>

            <View style={styles.headerRight}>
              <View style={styles.statusIcons}>
                <Feather name="wifi" size={18} color="#222" style={{ marginRight: 8 }} />
                <Feather name="battery" size={18} color="#222" />
              </View>
              <TouchableOpacity style={styles.shareButton}>
                <Text style={styles.shareButtonText}>SHARE</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Title and Metadata */}
            <View style={styles.titleSection}>
              <Text style={styles.noteTitle}>{displayTitle}</Text>
              <View style={styles.metadataRow}>
                <Text style={styles.metadataText}>{formatDate(note.createdAt)}</Text>
                <View style={styles.metadataDot} />
                <Text style={styles.metadataText}>{calculateReadTime(displayContent)}</Text>
              </View>
            </View>

            {/* Action Chips */}
            <View style={styles.chipsContainer}>
              {actionChips.map((chip) => (
                <TouchableOpacity 
                  key={chip.id} 
                  style={styles.chip}
                  onPress={() => handleChipPress(chip.id)}
                >
                  <Feather name={chip.icon as any} size={16} color="#6B7280" />
                  <Text style={styles.chipText}>{chip.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Study Tools Section */}
            <View style={styles.studyToolsSection}>
              <Text style={styles.sectionTitle}>STUDY TOOLS</Text>
              <View style={styles.studyToolsGrid}>
                {studyTools.map((tool) => (
                  <TouchableOpacity 
                    key={tool.id} 
                    style={[styles.studyToolCard, { backgroundColor: tool.bgColor }]}
                    onPress={() => handleStudyToolPress(tool.id)}
                  >
                    <View style={[styles.toolIconContainer, { backgroundColor: tool.color }]}>
                      <Feather name={tool.icon as any} size={12} color="#FFFFFF" />
                    </View>
                    <Text style={styles.toolLabel}>{tool.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Overview Section */}
            <View style={styles.overviewSection}>
              <Text style={styles.overviewTitle}>Overview</Text>
              <Text style={styles.overviewContent}>{displayContent}</Text>
            </View>

            {/* Bottom spacing */}
            <View style={{ height: 40 }} />
          </ScrollView>

          <View style={styles.homeIndicator} />
        </SafeAreaView>
      </LinearGradient>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
    alignItems: 'center',
  },
  emojiIcon: {
    fontSize: 28,
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
  shareButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleSection: {
    paddingTop: 24,
    paddingBottom: 16,
  },
  noteTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 36,
    marginBottom: 12,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  metadataDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6B7280',
    marginHorizontal: 8,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  studyToolsSection: {
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  studyToolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  studyToolCard: {
    width: '48%',
    aspectRatio: 8,
    borderRadius: 14,
    padding: 12,
    justifyContent: 'space-between',
  },
  toolIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginTop: 6,
  },
  overviewSection: {
    paddingVertical: 16,
  },
  overviewTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#7C3AED',
    marginBottom: 16,
  },
  overviewContent: {
    fontSize: 15,
    lineHeight: 24,
    color: '#374151',
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
