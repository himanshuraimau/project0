import React, { useState, useEffect, useCallback } from 'react'
import { Feather } from '@expo/vector-icons'
import { BookOpen, Brain, Layers } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  StatusBar,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { WebView } from 'react-native-webview'
import { BlurView } from 'expo-blur'
import { marked } from 'marked'
import { notesApi } from '@/lib/api'
import type { Note } from '@/lib/api/types'
import BackButton from '@/components/ui/BackButton'
import { useAlert } from '@/lib/contexts/AlertContext'
import { useTheme } from '@/lib/hooks/useTheme'

import { ShareLinkModal } from '@/components/notes'
import FolderSelectorModal from '@/components/folders/FolderSelectorModal'

import TranslationModal from './TranslationModal'

interface NoteViewProps {
  noteId: string
}

const NOTE_LANGUAGE_KEY = 'note_language_';

export default function NoteView({ noteId }: NoteViewProps) {
  const router = useRouter()
  const { t, i18n } = useTranslation()
  const { showAlert } = useAlert()
  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [webViewHeight, setWebViewHeight] = useState(400)
  const [deleting, setDeleting] = useState(false)

  const [showTranslationModal, setShowTranslationModal] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en')

  const [shareModalVisible, setShareModalVisible] = useState(false)
  const [showFolderModal, setShowFolderModal] = useState(false)

  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(`${NOTE_LANGUAGE_KEY}${noteId}`);
        if (savedLanguage) {
          setSelectedLanguage(savedLanguage);
        }
      } catch (error) {
        console.error('Error loading saved language:', error);
      }
    };
    loadSavedLanguage();
  }, [noteId]);

  const handleLanguageChange = async (language: string) => {
    setSelectedLanguage(language);
    try {
      await AsyncStorage.setItem(`${NOTE_LANGUAGE_KEY}${noteId}`, language);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  const fetchNote = useCallback(async () => {
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
  }, [noteId])

  useEffect(() => {
    if (noteId) {
      fetchNote()
    }
  }, [noteId, i18n.language, fetchNote])

  const getDisplayContent = () => {
    if (!note) return { title: '', content: '' }

    if (selectedLanguage === 'en' || !note.translations || note.translations.length === 0) {
      return { title: note.title, content: note.content }
    }

    const translation = note.translations.find((t) => t.language === selectedLanguage)

    if (translation) {
      return { title: translation.title, content: translation.content }
    }

    return { title: note.title, content: note.content }
  }

  const { title: displayTitle, content: displayContent } = getDisplayContent()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200
    const wordCount = content.split(/\s+/).length
    const minutes = Math.ceil(wordCount / wordsPerMinute)
    return `${minutes} min read`
  }

  const convertToHTML = (content: string) => {
    try {
      if (content.includes('<p>') || content.includes('<div>') || content.includes('<h1>')) {
        return content
      }
      return marked(content, { breaks: true, gfm: true }) as string
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

  const handleChipPress = (chipId: number) => {
    if (chipId === 1) setShowTranslationModal(true)
    else if (chipId === 2) router.push(`/notes/${noteId}/transcript`)
    else if (chipId === 3) setShowFolderModal(true)
  }

  const handleStudyToolPress = (toolId: number) => {
    if (toolId === 3) router.push(`/notes/${noteId}/quiz`)
    else if (toolId === 1) router.push(`/notes/${noteId}/edit`)
    else if (toolId === 2) router.push(`/notes/${noteId}/chat`)
    else if (toolId === 4) router.push(`/notes/${noteId}/flashcards`)
    else if (toolId === 5) router.push(`/notes/${noteId}/podcasts`)
    else if (toolId === 6) router.push(`/notes/${noteId}/mindmap`)
  }

  const handleDeleteNote = () => {
    showAlert(
      t('note.deleteNote'),
      t('note.deleteConfirmation'),
      [
        { text: t('common.cancel'), style: 'cancel' },
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
              showAlert(t('common.error'), err.message || t('note.failedToDelete'))
            } finally {
              setDeleting(false)
            }
          },
        },
      ]
    )
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
    shareButton: {
      backgroundColor: isDark ? 'rgba(130,100,255,0.15)' : c.accent,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 100,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      borderWidth: 0.5,
      borderColor: isDark ? 'rgba(130,100,255,0.3)' : 'rgba(0,0,0,0.04)',
    },
    shareButtonText: {
      color: c.primary,
      fontWeight: '600',
      fontSize: 13,
      lineHeight: 20,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    titleSection: {
      paddingTop: 24,
      paddingBottom: 16,
      alignSelf: 'stretch',
    },
    noteTitle: {
      fontFamily: 'Inter',
      fontWeight: '400',
      fontSize: 24,
      lineHeight: 32,
      color: c.foreground,
      marginBottom: 12,
    },
    metadataRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metadataText: {
      fontSize: 14,
      color: c.mutedForeground,
      fontWeight: '500',
    },
    metadataDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.mutedForeground,
      marginHorizontal: 8,
    },
    glassChipsContainer: {
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 0.5,
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      marginVertical: 16,
    },
    glassOverlay: {
      flexDirection: 'row',
      gap: 9,
      padding: 12,
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
    },
    chip: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : c.muted,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 20,
      gap: 6,
    },
    chipText: {
      fontSize: 14,
      fontWeight: '600',
      color: c.foreground,
    },
    studyToolsSection: {
      paddingVertical: 0,
      marginTop: 24,
    },
    sectionTitle: {
      fontFamily: 'Inter',
      fontWeight: '500',
      fontSize: 14,
      lineHeight: 16,
      letterSpacing: 0.6,
      color: c.mutedForeground,
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
      height: 60,
      borderRadius: 16,
      padding: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
    },
    toolIconContainer: {
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    editNoteIcon: {},
    toolLabel: {
      fontFamily: 'Inter',
      fontWeight: '500',
      fontSize: 18,
      lineHeight: 28,
      color: '#FFFFFF',
    },
    overviewSection: {
      paddingVertical: 16,
    },
    overviewTitle: {
      fontSize: 20,
      fontWeight: '500',
      color: c.primary,
      marginBottom: 16,
    },
    webView: {
      backgroundColor: 'transparent',
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
      backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#FEE2E2',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(239,68,68,0.2)' : '#FECACA',
    },
    deleteButtonText: {
      color: c.destructive,
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
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
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
            <Text style={styles.errorText}>{error || t('note.failedToLoad')}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchNote}>
              <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backButtonError} onPress={() => router.back()}>
              <Text style={styles.backButtonErrorText}>{t('common.back')}</Text>
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
              <Text style={styles.emojiIcon}>🤔</Text>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => setShareModalVisible(true)}
              >
                <Text style={styles.shareButtonText}>SHARE</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Title and Metadata */}
            <View style={styles.titleSection}>
              <Text style={styles.noteTitle}>{displayTitle}</Text>
              <View style={styles.metadataRow}>
                <Text style={styles.metadataText}>{formatDate(note.createdAt)}</Text>
                <View style={styles.metadataDot} />
                <Text style={styles.metadataText}>{calculateReadTime(displayContent)}</Text>
              </View>
            </View>

            {/* Glass Action Chips */}
            <BlurView intensity={isDark ? 30 : 15} tint={isDark ? 'dark' : 'light'} style={styles.glassChipsContainer}>
              <View style={styles.glassOverlay}>
                {actionChips.map((chip) => (
                  <TouchableOpacity
                    key={chip.id}
                    style={styles.chip}
                    onPress={() => handleChipPress(chip.id)}
                  >
                    <Feather name={chip.icon as any} size={16} color={c.mutedForeground} />
                    <Text style={styles.chipText}>{chip.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </BlurView>

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
                    <View style={[styles.toolIconContainer, tool.id === 1 && styles.editNoteIcon]}>
                      {tool.iconType === 'lucide' ? (
                        tool.icon === 'BookOpen' ? (
                          <BookOpen size={24} color={tool.color} />
                        ) : tool.icon === 'brain' ? (
                          <Brain size={24} color={tool.color} />
                        ) : tool.icon === 'Layers' ? (
                          <Layers size={24} color={tool.color} />
                        ) : null
                      ) : (
                        <Feather name={tool.icon as any} size={24} color={tool.color} />
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
                          * { margin: 0; padding: 0; box-sizing: border-box; }
                          body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                            font-size: 15px;
                            line-height: 24px;
                            color: ${c.foreground};
                            padding: 0; margin: 0;
                            overflow-x: hidden;
                            background-color: transparent;
                          }
                          h1 { font-size: 24px; font-weight: 800; color: ${c.foreground}; margin-top: 20px; margin-bottom: 12px; }
                          h1:first-child { margin-top: 0; }
                          h2 { font-size: 20px; font-weight: 700; color: ${c.foreground}; margin-top: 16px; margin-bottom: 10px; }
                          h3 { font-size: 18px; font-weight: 600; color: ${c.foreground}; margin-top: 14px; margin-bottom: 8px; }
                          p { font-size: 15px; line-height: 24px; color: ${c.foreground}; margin-bottom: 12px; }
                          a { color: ${c.primary}; text-decoration: underline; }
                          strong, b { font-weight: 700; color: ${c.foreground}; }
                          em, i { font-style: italic; }
                          u { text-decoration: underline; }
                          ul, ol { margin-bottom: 12px; padding-left: 20px; }
                          li { margin-bottom: 6px; line-height: 24px; color: ${c.foreground}; }
                          code {
                            background-color: ${c.muted};
                            color: #EC4899;
                            padding: 2px 6px; border-radius: 4px;
                            font-family: monospace; font-size: 14px;
                          }
                          pre {
                            background-color: ${c.muted};
                            padding: 12px; border-radius: 8px;
                            border-left: 3px solid ${c.primary};
                            margin-bottom: 12px; overflow-x: auto;
                          }
                          pre code { background-color: transparent; padding: 0; color: ${c.foreground}; }
                          blockquote {
                            background-color: ${c.muted};
                            border-left: 4px solid ${c.primary};
                            padding-left: 12px; padding-top: 8px; padding-bottom: 8px;
                            margin-bottom: 12px;
                          }
                          table { border: 1px solid ${c.border}; border-radius: 8px; margin-bottom: 12px; width: 100%; border-collapse: collapse; }
                          th { font-weight: 700; padding: 8px; border-bottom: 2px solid ${c.border}; background-color: ${c.muted}; text-align: left; color: ${c.foreground}; }
                          td { padding: 8px; border-bottom: 1px solid ${c.border}; color: ${c.foreground}; }
                          hr { background-color: ${c.border}; height: 1px; border: none; margin: 16px 0; }
                          img { max-width: 100%; height: auto; display: block; margin: 12px 0; }
                        </style>
                      </head>
                      <body>
                        ${convertToHTML(displayContent)}
                        <script>
                          function sendHeight() {
                            const height = document.body.scrollHeight;
                            window.ReactNativeWebView.postMessage(JSON.stringify({ height }));
                          }
                          window.addEventListener('load', sendHeight);
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
                      setWebViewHeight(data.height + 20);
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
                  <ActivityIndicator size="small" color={c.destructive} />
                ) : (
                  <>
                    <Feather name="trash-2" size={20} color={c.destructive} />
                    <Text style={styles.deleteButtonText}>{t('note.deleteNote')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Bottom spacing */}
            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </View>

      {/* Translation Modal */}
      <TranslationModal
        visible={showTranslationModal}
        onClose={() => setShowTranslationModal(false)}
        noteId={noteId}
        currentLanguage={selectedLanguage}
        onLanguageSelect={(language: string) => {
          handleLanguageChange(language)
          fetchNote()
        }}
      />

      {/* Share Link Modal */}
      {note && (
        <ShareLinkModal
          visible={shareModalVisible}
          onClose={() => setShareModalVisible(false)}
          noteId={note.id}
          noteTitle={displayTitle}
        />
      )}

      {/* Folder Selector Modal */}
      <FolderSelectorModal
        visible={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        noteId={noteId}
        currentFolderId={note?.folderId}
        onFolderSelected={() => {
          fetchNote()
        }}
      />
    </>
  )
}
