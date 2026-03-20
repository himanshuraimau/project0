import React, { useState, useEffect } from 'react'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import {
  StatusBar,
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BlurView } from 'expo-blur'
import { notesApi } from '@/lib/api'
import type { Note } from '@/lib/api/types'
import BackButton from '@/components/ui/BackButton'
import { useAlert } from '@/lib/contexts/AlertContext'
import { useTheme } from '@/lib/hooks/useTheme'

interface TranscriptViewProps {
  noteId: string
}

export default function TranscriptView({ noteId }: TranscriptViewProps) {
  const router = useRouter()
  const { showAlert } = useAlert()
  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

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

  // Get the transcript content (original content, not AI-generated notes)
  const getTranscriptContent = () => {
    if (note?.transcript?.content) {
      return note.transcript.content
    }
    if (note?.transcript?.cleanContent) {
      return note.transcript.cleanContent
    }
    // Fallback to note content if transcript is not available
    return note?.content || ''
  }

  const transcriptContent = getTranscriptContent()

  // Action Handlers
  const handleCopy = async () => {
    if (!transcriptContent) return
    await Clipboard.setStringAsync(transcriptContent)
    showAlert('Copied', 'Transcript copied to clipboard')
  }

  const handleDownload = async () => {
    if (!transcriptContent) return
    try {
      const fileName = `${note?.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_transcript.txt`
      const fileUri = (FileSystem.documentDirectory || '') + fileName
      await FileSystem.writeAsStringAsync(fileUri, transcriptContent)

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri)
      } else {
        showAlert('Error', 'Sharing is not available on this device')
      }
    } catch (error) {
      console.error('Download error:', error)
      showAlert('Error', 'Failed to download transcript')
    }
  }

  const handleShare = async () => {
    if (!transcriptContent) return
    try {
      await Share.share({
        message: transcriptContent,
        title: note?.title || 'Transcript',
      })
    } catch (error) {
      console.error('Share error:', error)
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
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
      borderBottomWidth: 0.5,
      borderBottomColor: c.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    headerCenter: {
      flex: 1,
      alignItems: 'flex-start',
      paddingLeft: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '500',
      color: c.foreground,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      justifyContent: 'flex-end',
    },
    actionIcons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : c.muted,
      justifyContent: 'center',
      alignItems: 'center',
    },
    searchBlur: {
      marginHorizontal: 20,
      marginVertical: 16,
      marginBottom: 24,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 0.5,
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    searchInner: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 44,
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
    },
    searchInput: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 12,
      color: c.foreground,
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
      fontFamily: 'Inter',
      fontWeight: '500',
      fontSize: 20,
      lineHeight: 24,
      color: c.primary,
    },
    transcriptTitle: {
      marginTop: 10,
      marginBottom: 20,
      fontFamily: 'Inter',
      fontWeight: '400',
      fontSize: 17,
      lineHeight: 24,
      color: c.foreground,
    },
    transcriptContent: {
      marginBottom: 24,
    },
    contentText: {
      fontSize: 15,
      color: c.foreground,
      lineHeight: 24,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    loadingText: {
      marginTop: 12,
      color: c.mutedForeground,
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
      color: c.destructive,
      fontSize: 16,
      textAlign: 'center',
      fontWeight: '600',
    },
    retryButton: {
      marginTop: 20,
      paddingVertical: 12,
      paddingHorizontal: 24,
      backgroundColor: c.primary,
      borderRadius: 12,
    },
    retryButtonText: {
      color: c.primaryForeground,
      fontSize: 16,
      fontWeight: '600',
    },
    backButtonError: {
      marginTop: 12,
      paddingVertical: 12,
      paddingHorizontal: 24,
    },
    backButtonErrorText: {
      color: c.mutedForeground,
      fontSize: 16,
      fontWeight: '600',
    },
  })

  // Show loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={c.primary} />
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
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={48} color={c.destructive} />
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
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <SafeAreaView style={styles.safeArea}>
          {/* Custom Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <BackButton iconColor={c.foreground} />
            </View>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Transcript</Text>
            </View>

            <View style={styles.headerRight}>
              <View style={styles.actionIcons}>
                <TouchableOpacity style={styles.iconButton} onPress={handleCopy}>
                  <Feather name="copy" size={18} color={c.foreground} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} onPress={handleDownload}>
                  <Feather name="download" size={18} color={c.foreground} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
                  <Feather name="share-2" size={18} color={c.foreground} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Glass Search Bar */}
          <BlurView intensity={isDark ? 20 : 10} tint={isDark ? 'dark' : 'light'} style={styles.searchBlur}>
            <View style={styles.searchInner}>
              <Feather name="search" size={18} color={c.mutedForeground} style={{ marginLeft: 12 }} />
              <TextInput
                placeholder="Search in transcript..."
                placeholderTextColor={c.mutedForeground}
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={{ paddingRight: 12 }}
                >
                  <Feather name="x" size={18} color={c.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>
          </BlurView>

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
                {highlightText(transcriptContent, searchQuery)}
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
