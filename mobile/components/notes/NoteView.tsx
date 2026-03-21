import React, { useState, useEffect, useCallback } from 'react'
import { Feather, Ionicons } from '@expo/vector-icons'
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
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { WebView } from 'react-native-webview'
import { marked } from 'marked'
import { notesApi } from '@/lib/api'
import type { Note } from '@/lib/api/types'
import { useAlert } from '@/lib/contexts/AlertContext'
import { useTheme } from '@/lib/hooks/useTheme'
import { neutral } from '@/lib/design-system'

import { ShareLinkModal } from '@/components/notes'
import FolderSelectorModal from '@/components/folders/FolderSelectorModal'
import TranslationModal from './TranslationModal'

interface NoteViewProps {
  noteId: string
}

const NOTE_LANGUAGE_KEY = 'note_language_'

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
        const saved = await AsyncStorage.getItem(`${NOTE_LANGUAGE_KEY}${noteId}`)
        if (saved) setSelectedLanguage(saved)
      } catch (e) {}
    }
    loadSavedLanguage()
  }, [noteId])

  const handleLanguageChange = async (language: string) => {
    setSelectedLanguage(language)
    try {
      await AsyncStorage.setItem(`${NOTE_LANGUAGE_KEY}${noteId}`, language)
    } catch (e) {}
  }

  const fetchNote = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const fetched = await notesApi.getNoteById(noteId)
      setNote(fetched)
    } catch (err: any) {
      setError(err.message || 'Failed to load note')
    } finally {
      setLoading(false)
    }
  }, [noteId])

  useEffect(() => {
    if (noteId) fetchNote()
  }, [noteId, i18n.language, fetchNote])

  const getDisplayContent = () => {
    if (!note) return { title: '', content: '' }
    if (selectedLanguage === 'en' || !note.translations || note.translations.length === 0) {
      return { title: note.title, content: note.content }
    }
    const translation = note.translations.find((t) => t.language === selectedLanguage)
    if (translation) return { title: translation.title, content: translation.content }
    return { title: note.title, content: note.content }
  }

  const { title: displayTitle, content: displayContent } = getDisplayContent()

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const calculateReadTime = (content: string) => {
    const minutes = Math.ceil(content.split(/\s+/).length / 200)
    return `${minutes} min read`
  }

  const convertToHTML = (content: string) => {
    try {
      if (content.includes('<p>') || content.includes('<div>') || content.includes('<h1>')) return content
      return marked(content, { breaks: true, gfm: true }) as string
    } catch (e) {
      return content
    }
  }

  const studyTools = [
    { id: 1, icon: 'create-outline', label: t('note.editNote'), color: '#FF6900' },
    { id: 2, icon: 'chatbubble-ellipses', label: t('note.chat'), color: '#AF52DE' },
    { id: 3, icon: 'bulb', label: t('note.takeQuiz'), color: '#FF2D55' },
    { id: 4, icon: 'layers', label: t('note.flashcards'), color: '#5AC8FA' },
    { id: 5, icon: 'headset', label: t('note.podcast'), color: '#5856D6' },
    { id: 6, icon: 'git-network', label: t('note.mindMap'), color: '#007AFF' },
  ]

  const handleStudyToolPress = (toolId: number) => {
    if (toolId === 1) router.push(`/notes/${noteId}/edit`)
    else if (toolId === 2) router.push(`/notes/${noteId}/chat`)
    else if (toolId === 3) router.push(`/notes/${noteId}/quiz`)
    else if (toolId === 4) router.push(`/notes/${noteId}/flashcards`)
    else if (toolId === 5) router.push(`/notes/${noteId}/podcasts`)
    else if (toolId === 6) router.push(`/notes/${noteId}/mindmap`)
  }

  const handleDeleteNote = () => {
    showAlert(t('note.deleteNote'), t('note.deleteConfirmation'), [
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
            showAlert(t('common.error'), err.message || t('note.failedToDelete'))
          } finally {
            setDeleting(false)
          }
        },
      },
    ])
  }

  const pageBg = isDark ? neutral[950] : '#f0f0f0'
  const cardBg = isDark ? neutral[900] : '#fff'
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
  const separatorColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: pageBg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <SafeAreaView style={styles.safe}>
          <View style={styles.stateWrap}>
            <ActivityIndicator size="large" color={c.primary} />
            <Text style={[styles.stateText, { color: c.mutedForeground }]}>{t('common.loading')}</Text>
          </View>
        </SafeAreaView>
      </View>
    )
  }

  if (error || !note) {
    return (
      <View style={[styles.container, { backgroundColor: pageBg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <SafeAreaView style={styles.safe}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={12} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
              <Feather name="arrow-left" size={24} color={c.foreground} />
            </Pressable>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.stateWrap}>
            <Feather name="alert-circle" size={44} color={c.destructive} />
            <Text style={[styles.stateTitle, { color: c.foreground }]}>{error || t('note.failedToLoad')}</Text>
            <Pressable style={[styles.retryBtn, { backgroundColor: c.primary }]} onPress={fetchNote}>
              <Text style={[styles.retryText, { color: c.primaryForeground }]}>{t('common.retry')}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    )
  }

  return (
    <>
      <View style={[styles.container, { backgroundColor: pageBg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <SafeAreaView style={styles.safe} edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={12} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
              <Feather name="arrow-left" size={24} color={c.foreground} />
            </Pressable>
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => setShareModalVisible(true)}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.headerBtn,
                  { backgroundColor: isDark ? 'rgba(79,59,231,0.12)' : 'rgba(79,59,231,0.08)', opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <Feather name="share-2" size={16} color={c.primary} />
              </Pressable>
              <Pressable
                onPress={() => setShowFolderModal(true)}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.headerBtn,
                  { backgroundColor: isDark ? neutral[800] : 'rgba(0,0,0,0.05)', opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <Feather name="folder" size={16} color={c.mutedForeground} />
              </Pressable>
            </View>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Title card */}
            <View style={[styles.titleCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[styles.noteTitle, { color: c.foreground }]}>{displayTitle}</Text>
              <View style={styles.metaRow}>
                <Text style={[styles.metaText, { color: c.mutedForeground }]}>{formatDate(note.createdAt)}</Text>
                <View style={[styles.metaDot, { backgroundColor: c.mutedForeground }]} />
                <Text style={[styles.metaText, { color: c.mutedForeground }]}>{calculateReadTime(displayContent)}</Text>
              </View>

              {/* Quick actions */}
              <View style={[styles.quickRow, { borderTopColor: separatorColor }]}>
                <Pressable
                  style={({ pressed }) => [styles.quickBtn, { opacity: pressed ? 0.6 : 1 }]}
                  onPress={() => setShowTranslationModal(true)}
                >
                  <Feather name="globe" size={16} color={c.mutedForeground} />
                  <Text style={[styles.quickText, { color: c.foreground }]}>{t('note.translate')}</Text>
                </Pressable>
                <View style={[styles.quickSep, { backgroundColor: separatorColor }]} />
                <Pressable
                  style={({ pressed }) => [styles.quickBtn, { opacity: pressed ? 0.6 : 1 }]}
                  onPress={() => router.push(`/notes/${noteId}/transcript`)}
                >
                  <Feather name="file-text" size={16} color={c.mutedForeground} />
                  <Text style={[styles.quickText, { color: c.foreground }]}>{t('note.transcript')}</Text>
                </Pressable>
              </View>
            </View>

            {/* Study tools */}
            <Text style={[styles.sectionLabel, { color: c.mutedForeground }]}>STUDY TOOLS</Text>
            <View style={styles.toolsGrid}>
              {studyTools.map((tool) => (
                <Pressable
                  key={tool.id}
                  style={({ pressed }) => [
                    styles.toolCard,
                    { backgroundColor: tool.color, opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
                  ]}
                  onPress={() => handleStudyToolPress(tool.id)}
                >
                  <Ionicons name={tool.icon as any} size={22} color="#fff" />
                  <Text style={styles.toolLabel}>{tool.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Note content */}
            <Text style={[styles.sectionLabel, { color: c.mutedForeground }]}>OVERVIEW</Text>
            <View style={[styles.contentCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
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
                            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                            font-size: 16px;
                            line-height: 26px;
                            color: ${c.foreground};
                            padding: 0; margin: 0;
                            overflow-x: hidden;
                            background-color: transparent;
                            -webkit-font-smoothing: antialiased;
                            letter-spacing: -0.01em;
                          }
                          h1 { font-size: 22px; font-weight: 700; color: ${c.foreground}; margin-top: 24px; margin-bottom: 12px; letter-spacing: -0.02em; line-height: 28px; }
                          h1:first-child { margin-top: 0; }
                          h2 { font-size: 19px; font-weight: 700; color: ${c.foreground}; margin-top: 20px; margin-bottom: 10px; letter-spacing: -0.01em; line-height: 25px; }
                          h3 { font-size: 17px; font-weight: 600; color: ${c.foreground}; margin-top: 16px; margin-bottom: 8px; line-height: 23px; }
                          p { font-size: 16px; line-height: 26px; color: ${c.foreground}; margin-bottom: 14px; }
                          a { color: ${c.primary}; text-decoration: none; }
                          strong, b { font-weight: 600; color: ${c.foreground}; }
                          em, i { font-style: italic; }
                          ul, ol { margin-bottom: 14px; padding-left: 22px; }
                          li { margin-bottom: 8px; line-height: 26px; color: ${c.foreground}; }
                          code {
                            background-color: ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'};
                            color: ${c.primary};
                            padding: 2px 7px; border-radius: 5px;
                            font-family: 'SF Mono', Menlo, monospace; font-size: 14px;
                          }
                          pre {
                            background-color: ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'};
                            padding: 14px 16px; border-radius: 10px;
                            margin-bottom: 14px; overflow-x: auto;
                          }
                          pre code { background-color: transparent; padding: 0; color: ${c.foreground}; font-size: 13px; line-height: 20px; }
                          blockquote {
                            border-left: 3px solid ${c.primary};
                            padding: 10px 16px;
                            margin-bottom: 14px;
                            background-color: ${isDark ? 'rgba(79,59,231,0.06)' : 'rgba(79,59,231,0.03)'};
                            border-radius: 0 8px 8px 0;
                          }
                          blockquote p { margin-bottom: 0; color: ${c.mutedForeground}; font-style: italic; }
                          table { border-collapse: collapse; width: 100%; margin-bottom: 14px; border-radius: 8px; overflow: hidden; }
                          th { font-weight: 600; padding: 10px 12px; background-color: ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}; text-align: left; color: ${c.foreground}; font-size: 14px; }
                          td { padding: 10px 12px; border-top: 1px solid ${separatorColor}; color: ${c.foreground}; font-size: 15px; }
                          hr { background-color: ${separatorColor}; height: 1px; border: none; margin: 20px 0; }
                          img { max-width: 100%; height: auto; display: block; margin: 14px 0; border-radius: 8px; }
                        </style>
                      </head>
                      <body>
                        ${convertToHTML(displayContent)}
                        <script>
                          function sendHeight() {
                            var h = document.body.scrollHeight;
                            window.ReactNativeWebView.postMessage(JSON.stringify({ height: h }));
                          }
                          window.addEventListener('load', sendHeight);
                          setTimeout(sendHeight, 100);
                          setTimeout(sendHeight, 500);
                        </script>
                      </body>
                    </html>
                  `,
                }}
                style={[styles.webView, { height: webViewHeight }]}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                onMessage={(event) => {
                  try {
                    const data = JSON.parse(event.nativeEvent.data)
                    if (data.height) setWebViewHeight(data.height + 20)
                  } catch (e) {}
                }}
                javaScriptEnabled
                domStorageEnabled
              />
            </View>

            {/* Delete */}
            <View style={styles.deleteSection}>
              <Pressable
                style={({ pressed }) => [
                  styles.deleteBtn,
                  { backgroundColor: isDark ? 'rgba(255,59,48,0.08)' : 'rgba(255,59,48,0.06)', opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={handleDeleteNote}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FF3B30" />
                ) : (
                  <>
                    <Ionicons name="trash" size={18} color="#FF3B30" />
                    <Text style={styles.deleteText}>{t('note.deleteNote')}</Text>
                  </>
                )}
              </Pressable>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </View>

      <TranslationModal
        visible={showTranslationModal}
        onClose={() => setShowTranslationModal(false)}
        noteId={noteId}
        currentLanguage={selectedLanguage}
        onLanguageSelect={(lang: string) => {
          handleLanguageChange(lang)
          fetchNote()
        }}
      />

      {note && (
        <ShareLinkModal
          visible={shareModalVisible}
          onClose={() => setShareModalVisible(false)}
          noteId={note.id}
          noteTitle={displayTitle}
        />
      )}

      <FolderSelectorModal
        visible={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        noteId={noteId}
        currentFolderId={note?.folderId}
        onFolderSelected={() => fetchNote()}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 4 },

  titleCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 22,
    marginBottom: 24,
  },
  noteTitle: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 0 },
  metaText: { fontSize: 13, fontWeight: '500' },
  metaDot: { width: 3, height: 3, borderRadius: 2, marginHorizontal: 8 },

  quickRow: {
    flexDirection: 'row',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  quickText: { fontSize: 14, fontWeight: '600' },
  quickSep: { width: StyleSheet.hairlineWidth, height: 20, alignSelf: 'center' },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },

  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  toolCard: {
    width: '48%',
    flexGrow: 1,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  toolLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: -0.2,
  },

  contentCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
  },
  webView: { backgroundColor: 'transparent' },

  deleteSection: { alignItems: 'center', paddingVertical: 8 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  deleteText: { color: '#FF3B30', fontSize: 15, fontWeight: '600' },

  stateWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  stateTitle: { marginTop: 16, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  stateText: { marginTop: 12, fontSize: 15, textAlign: 'center' },
  retryBtn: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14 },
  retryText: { fontSize: 16, fontWeight: '600' },
})
