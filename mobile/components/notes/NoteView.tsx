import React, { useState, useEffect } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { Feather } from '@expo/vector-icons'
import { BookOpen, Brain, Layers } from 'lucide-react-native'
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
  ActivityIndicator,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { WebView } from 'react-native-webview'
import { marked } from 'marked'
import { notesApi } from '@/lib/api'
import { setClerkTokenGetter } from '@/lib/api/client'
import type { Note } from '@/lib/api/types'
import { getTranslatedNote } from '@/lib/utils/translation'
import BackButton from '@/components/ui/BackButton'
import { useAlert } from '@/lib/contexts/AlertContext'

interface NoteViewProps {
  noteId: string
}

export default function NoteView({ noteId }: NoteViewProps) {
  const router = useRouter()
  const { getToken } = useAuth()
  const { t, i18n } = useTranslation()
  const { showAlert } = useAlert()
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [webViewHeight, setWebViewHeight] = useState(400)
  const [deleting, setDeleting] = useState(false)

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

  // Convert Markdown to HTML
  const convertToHTML = (content: string) => {
    try {
      // Check if content is already HTML (contains HTML tags)
      if (content.includes('<p>') || content.includes('<div>') || content.includes('<h1>')) {
        return content
      }
      // Convert Markdown to HTML
      return marked(content, {
        breaks: true,
        gfm: true
      }) as string
    } catch (error) {
      console.error('Error converting markdown to HTML:', error)
      return content
    }
  }

  const actionChips = [
    { id: 1, icon: 'globe', label: t('note.translate') },
    { id: 2, icon: 'file-text', label: t('note.transcript') },
    { id: 3, icon: 'folder', label: t('note.folder') },
  ]

  const studyTools = [
    { id: 1, icon: 'BookOpen', iconType: 'lucide', label: t('note.editNote'), color: '#FFFFFF', bgColor: '#FF6900' },
    { id: 2, icon: 'message-square', iconType: 'feather', label: t('note.chat'), color: '#FFFFFF', bgColor: '#AD46FF' },
    { id: 3, icon: 'brain', iconType: 'lucide', label: t('note.takeQuiz'), color: '#FFFFFF', bgColor: '#F6339A' },
    { id: 4, icon: 'Layers', iconType: 'lucide', label: t('note.flashcards'), color: '#FFFFFF', bgColor: '#00D3F3' },
    { id: 5, icon: 'headphones', iconType: 'feather', label: t('note.podcast'), color: '#FFFFFF', bgColor: '#615FFF' },
    { id: 6, icon: 'plus', iconType: 'feather', label: t('note.mindMap'), color: '#FFFFFF', bgColor: '#2B7FFF' },
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
      router.push(`/notes/${noteId}/edit`)
    } else if (toolId === 2) { // Chat
      router.push(`/notes/${noteId}/chat`)
    } else if (toolId === 4) { // Flashcards
      router.push(`/notes/${noteId}/flashcards`)
    } else if (toolId === 5) { // Podcast
      console.log('Podcast pressed')
    } else if (toolId === 6) { // MindMap
      router.push(`/notes/${noteId}/mindmap`)
    }
  }

  // Handle delete note
  const handleDeleteNote = () => {
    showAlert(
      t('note.deleteNote'),
      t('note.deleteConfirmation'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true)
              await notesApi.deleteNote(noteId)
              router.back()
            } catch (err: any) {
              console.error('Failed to delete note:', err)
              showAlert(
                t('common.error'),
                err.message || t('note.failedToDelete')
              )
            } finally {
              setDeleting(false)
            }
          },
        },
      ]
    )
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
              <BackButton iconColor="#111827" />
            </View>

            <View style={styles.headerCenter}>
              <Text style={styles.emojiIcon}>🤔</Text>
            </View>

            <View style={styles.headerRight}>
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
                    style={[
                      styles.studyToolCard,
                      { backgroundColor: tool.bgColor }
                    ]}
                    onPress={() => handleStudyToolPress(tool.id)}
                  >
                    <View style={[
                      styles.toolIconContainer,
                      tool.id === 1 && styles.editNoteIcon
                    ]}>
                      {tool.iconType === 'lucide' ? (
                        tool.icon === 'BookOpen' ? (
                          <BookOpen
                            size={24}
                            color={tool.color}
                          />
                        ) : tool.icon === 'brain' ? (
                          <Brain
                            size={24}
                            color={tool.color}
                          />
                        ) : tool.icon === 'Layers' ? (
                          <Layers
                            size={24}
                            color={tool.color}
                          />
                        ) : null
                      ) : (
                        <Feather
                          name={tool.icon as any}
                          size={24}
                          color={tool.color}
                        />
                      )}
                    </View>
                    <Text style={styles.toolLabel}>{tool.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Overview Section */}
            <View style={styles.overviewSection}>
              <Text style={styles.overviewTitle}>Overview</Text>
              <WebView
                originWhitelist={['*']}
                source={{
                  html: `
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                        <style>
                          * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                          }
                          body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                            font-size: 15px;
                            line-height: 24px;
                            color: #374151;
                            padding: 0;
                            margin: 0;
                            overflow-x: hidden;
                          }
                          h1 {
                            font-size: 24px;
                            font-weight: 800;
                            color: #111827;
                            margin-top: 20px;
                            margin-bottom: 12px;
                          }
                          h1:first-child {
                            margin-top: 0;
                          }
                          h2 {
                            font-size: 20px;
                            font-weight: 700;
                            color: #111827;
                            margin-top: 16px;
                            margin-bottom: 10px;
                          }
                          h3 {
                            font-size: 18px;
                            font-weight: 600;
                            color: #111827;
                            margin-top: 14px;
                            margin-bottom: 8px;
                          }
                          p {
                            font-size: 15px;
                            line-height: 24px;
                            color: #374151;
                            margin-bottom: 12px;
                          }
                          a {
                            color: #7C3AED;
                            text-decoration: underline;
                          }
                          strong, b {
                            font-weight: 700;
                            color: #111827;
                          }
                          em, i {
                            font-style: italic;
                          }
                          u {
                            text-decoration: underline;
                          }
                          ul, ol {
                            margin-bottom: 12px;
                            padding-left: 20px;
                          }
                          li {
                            margin-bottom: 6px;
                            line-height: 24px;
                          }
                          code {
                            background-color: #F3F4F6;
                            color: #EC4899;
                            padding: 2px 6px;
                            border-radius: 4px;
                            font-family: monospace;
                            font-size: 14px;
                          }
                          pre {
                            background-color: #F9FAFB;
                            padding: 12px;
                            border-radius: 8px;
                            border-left: 3px solid #7C3AED;
                            margin-bottom: 12px;
                            overflow-x: auto;
                          }
                          pre code {
                            background-color: transparent;
                            padding: 0;
                            color: #374151;
                          }
                          blockquote {
                            background-color: #F3F4F6;
                            border-left: 4px solid #7C3AED;
                            padding-left: 12px;
                            padding-top: 8px;
                            padding-bottom: 8px;
                            margin-bottom: 12px;
                          }
                          table {
                            border: 1px solid #E5E7EB;
                            border-radius: 8px;
                            margin-bottom: 12px;
                            width: 100%;
                            border-collapse: collapse;
                          }
                          th {
                            font-weight: 700;
                            padding: 8px;
                            border-bottom: 2px solid #E5E7EB;
                            background-color: #F9FAFB;
                            text-align: left;
                          }
                          td {
                            padding: 8px;
                            border-bottom: 1px solid #F3F4F6;
                          }
                          hr {
                            background-color: #E5E7EB;
                            height: 1px;
                            border: none;
                            margin: 16px 0;
                          }
                          img {
                            max-width: 100%;
                            height: auto;
                            display: block;
                            margin: 12px 0;
                          }
                        </style>
                      </head>
                      <body>
                        ${convertToHTML(displayContent)}
                        <script>
                          // Send height to React Native
                          function sendHeight() {
                            const height = document.body.scrollHeight;
                            window.ReactNativeWebView.postMessage(JSON.stringify({ height }));
                          }
                          
                          // Send height when content loads
                          window.addEventListener('load', sendHeight);
                          
                          // Send height after a short delay to ensure all content is rendered
                          setTimeout(sendHeight, 100);
                          setTimeout(sendHeight, 500);
                        </script>
                      </body>
                    </html>
                  `
                }}
                style={[styles.webView, { height: webViewHeight }]}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                onMessage={(event) => {
                  try {
                    const data = JSON.parse(event.nativeEvent.data);
                    if (data.height) {
                      setWebViewHeight(data.height + 20); // Add some padding
                    }
                  } catch (e) {
                    console.log('Error parsing WebView message:', e);
                  }
                }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
              />
            </View>

            {/* Delete Note Button */}
            <View style={styles.deleteSection}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeleteNote}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <>
                    <Feather name="trash-2" size={20} color="#EF4444" />
                    <Text style={styles.deleteButtonText}>{t('note.deleteNote')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Bottom spacing */}
            <View style={{ height: 40 }} />
          </ScrollView>
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
    fontSize: 24,
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
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 26843500,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  shareButtonText: {
    color: '#9810FA',
    fontWeight: '400',
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Arimo',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleSection: {
    paddingTop: 24,
    paddingBottom: 16,
    flex: 0,
    alignSelf: 'stretch',
    flexGrow: 0,
  },
  noteTitle: {
    fontFamily: 'Arimo',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 24,
    lineHeight: 32,
    color: '#0A0A0A',
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
    gap: 9,
    paddingVertical: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
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
    paddingVertical: 0,
    marginTop: 24,
  },
  sectionTitle: {
    fontFamily: 'Arimo',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 16,
    letterSpacing: 0.6,
    color: '#99A1AF',
    marginBottom: 16,
  },
  studyToolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  studyToolCard: {
    width: '49%',
    height: 59.99,
    borderRadius: 16,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11.99,
    marginBottom: 12,
  },

  editNoteCard: {
    backgroundColor: '#FF6900',
  },
  toolIconContainer: {
    width: 23.99,
    height: 23.99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editNoteIcon: {
  },
  toolLabel: {
    fontFamily: 'Arimo',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 28,
    color: '#FFFFFF',
  },
  editNoteLabel: {
    fontFamily: 'Arimo',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 28,
    color: '#FFFFFF',
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
  webView: {
    backgroundColor: 'transparent',
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
  deleteSection: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
})


