import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { notesApi } from '@/lib/api'
import type { Note } from '@/lib/api/types'
import { getTranslatedNote } from '@/lib/utils/translation'
import { useTheme } from '@/lib/hooks/useTheme'
import { neutral } from '@/lib/design-system'

export default function SharedNotesScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { fetchSharedNotes() }, [])

  const fetchSharedNotes = async () => {
    try {
      setLoading(true)
      setError(null)
      const allNotes = await notesApi.getNotes()
      setNotes(allNotes.filter((note) => note.isCloned === true))
    } catch (err: any) {
      setError(err.message || 'Failed to load shared notes')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchSharedNotes()
    setRefreshing(false)
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const cardBg = isDark ? neutral[900] : '#fff'
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
  const separatorColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'

  return (
    <View style={[styles.container, { backgroundColor: isDark ? neutral[950] : '#f0f0f0' }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
          >
            <Feather name="arrow-left" size={24} color={c.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: c.foreground }]}>
            {t('share.sharedWithMe')}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />
          }
        >
          {loading && !refreshing ? (
            <View style={styles.stateWrap}>
              <ActivityIndicator size="large" color={c.primary} />
              <Text style={[styles.stateText, { color: c.mutedForeground }]}>
                {t('home.loadingNotes')}
              </Text>
            </View>
          ) : error ? (
            <View style={styles.stateWrap}>
              <Feather name="alert-circle" size={44} color={c.destructive} />
              <Text style={[styles.stateTitle, { color: c.foreground }]}>Something went wrong</Text>
              <Text style={[styles.stateText, { color: c.mutedForeground }]}>{error}</Text>
              <Pressable
                style={[styles.retryBtn, { backgroundColor: c.primary }]}
                onPress={fetchSharedNotes}
              >
                <Text style={[styles.retryText, { color: c.primaryForeground }]}>
                  {t('common.retry')}
                </Text>
              </Pressable>
            </View>
          ) : notes.length === 0 ? (
            <View style={styles.stateWrap}>
              <View style={[styles.emptyIcon, { backgroundColor: isDark ? neutral[800] : 'rgba(0,0,0,0.04)' }]}>
                <Feather name="users" size={36} color={isDark ? neutral[600] : neutral[300]} />
              </View>
              <Text style={[styles.stateTitle, { color: c.foreground }]}>
                {t('share.noSharedNotes')}
              </Text>
              <Text style={[styles.stateText, { color: c.mutedForeground }]}>
                {t('share.noSharedNotesMessage')}
              </Text>
            </View>
          ) : (
            <>
              <Text style={[styles.countLabel, { color: c.mutedForeground }]}>
                {notes.length} {notes.length === 1 ? 'NOTE' : 'NOTES'}
              </Text>
              <View style={[styles.group, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                {notes.map((note, idx) => {
                  const { title } = getTranslatedNote(note)
                  return (
                    <React.Fragment key={note.id}>
                      <Pressable
                        style={({ pressed }) => [styles.noteRow, { opacity: pressed ? 0.6 : 1 }]}
                        onPress={() => router.push(`/notes/${note.id}`)}
                      >
                        <View style={[styles.noteIcon, { backgroundColor: isDark ? 'rgba(79,59,231,0.1)' : 'rgba(79,59,231,0.06)' }]}>
                          <Feather name="users" size={16} color={c.primary} />
                        </View>
                        <View style={styles.noteBody}>
                          <Text numberOfLines={2} style={[styles.noteTitle, { color: c.foreground }]}>
                            {title}
                          </Text>
                          <View style={styles.noteFooter}>
                            <Text style={[styles.noteDate, { color: c.mutedForeground }]}>
                              {formatDate(note.createdAt)}
                            </Text>
                            {note.originalAuthor && (
                              <Text style={[styles.authorText, { color: c.mutedForeground }]}>
                                {t('share.sharedBy', { name: note.originalAuthor })}
                              </Text>
                            )}
                          </View>
                        </View>
                        <Feather name="chevron-right" size={16} color={isDark ? neutral[600] : neutral[400]} />
                      </Pressable>
                      {idx < notes.length - 1 && (
                        <View style={[styles.separator, { backgroundColor: separatorColor }]} />
                      )}
                    </React.Fragment>
                  )
                })}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
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
  headerTitle: { fontSize: 17, fontWeight: '600', letterSpacing: -0.3 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },

  countLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },

  group: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 64 },
  noteIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteBody: { flex: 1 },
  noteTitle: { fontSize: 15, fontWeight: '600', lineHeight: 20, marginBottom: 3 },
  noteFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  noteDate: { fontSize: 13 },
  authorText: { fontSize: 12, fontStyle: 'italic' },

  stateWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  stateTitle: { marginTop: 16, fontSize: 20, fontWeight: '600', textAlign: 'center' },
  stateText: { marginTop: 8, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtn: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  retryText: { fontSize: 16, fontWeight: '600' },
})
