import React, { useState, useEffect, useCallback } from 'react'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { useTheme } from '@/lib/hooks/useTheme'
import { useTranslation } from 'react-i18next'
import { useSession } from '@/lib/auth/auth-client'
import {
  StatusBar,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Dimensions,
  BackHandler,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Folder } from 'lucide-react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated'
import RecordAudio from './RecordAudio'
import UploadAudio from './UploadAudio'
import UploadTextOrPDF from './UploadTextOrPDF'
import WebLink from './WebLink'
import { notesApi } from '@/lib/api'
import type { Note } from '@/lib/api/types'
import { getTranslatedNote } from '@/lib/utils/translation'
import { useFolders } from '@/lib/hooks/useFolders'
import { ShareLinkModal } from '@/components/notes'
import FolderSelectorModal from '@/components/folders/FolderSelectorModal'
import { neutral, iconColors } from '@/lib/design-system'
import { glass, liquidGlass, glassShadow } from '@/lib/design-system/glass'
import { useSubscription } from '@/lib/contexts/SubscriptionContext'
import UpgradeModal from '@/components/ui/UpgradeModal'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

const NEW_NOTE_OPTIONS = [
  { id: 1, icon: 'mic' as const, label: 'Record audio', color: iconColors.red },
  { id: 2, icon: 'upload-cloud' as const, label: 'Upload audio', color: iconColors.blue },
  { id: 3, icon: 'file-text' as const, label: 'Upload text', color: iconColors.green },
  { id: 4, icon: 'link' as const, label: 'Web link', color: iconColors.indigo },
]

export default function NotesHome() {
  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'
  const router = useRouter()
  const { t } = useTranslation()
  const { data: session, isPending } = useSession()
  const { hasAccess } = useSubscription()
  const insets = useSafeAreaInsets()
  const [sheetVisible, setSheetVisible] = useState(false)
  const [upgradeVisible, setUpgradeVisible] = useState(false)
  const [activeOption, setActiveOption] = useState<number | null>(null)

  // -- Glass bottom sheet animation values --
  const sheetTranslateY = useSharedValue(SCREEN_HEIGHT)
  const overlayOpacity = useSharedValue(0)
  const fabScale = useSharedValue(1)

  const openSheet = useCallback(() => {
    setSheetVisible(true)
    overlayOpacity.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) })
    sheetTranslateY.value = withSpring(0, {
      damping: 28,
      stiffness: 280,
      mass: 0.9,
      overshootClamping: false,
    })
  }, [])

  const closeSheet = useCallback(() => {
    overlayOpacity.value = withTiming(0, { duration: 220, easing: Easing.in(Easing.cubic) })
    sheetTranslateY.value = withTiming(SCREEN_HEIGHT, {
      duration: 300,
      easing: Easing.bezierFn(0.4, 0, 1, 1),
    }, () => {
      runOnJS(setSheetVisible)(false)
      runOnJS(setActiveOption)(null)
    })
  }, [])

  const overlayAnimStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }))

  const sheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }))

  const fabAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }))

  // Handle Android back button when sheet is open
  useEffect(() => {
    if (!sheetVisible) return
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeSheet()
      return true
    })
    return () => sub.remove()
  }, [sheetVisible, closeSheet])
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('All')
  const [isDevelopmentMode, setIsDevelopmentMode] = useState(false)
  const { folders, fetchFolders } = useFolders()
  const [shareModalVisible, setShareModalVisible] = useState(false)
  const [selectedNoteForShare, setSelectedNoteForShare] = useState<Note | null>(null)
  const [folderModalVisible, setFolderModalVisible] = useState(false)
  const [selectedNoteForFolder, setSelectedNoteForFolder] = useState<Note | null>(null)

  useEffect(() => { fetchNotes() }, [])

  useFocusEffect(
    React.useCallback(() => {
      fetchNotes()
      fetchFolders()
    }, [])
  )

  const fetchNotes = async () => {
    try {
      setLoading(true)
      setError(null)
      setIsDevelopmentMode(false)
      const fetchedNotes = await notesApi.getNotes()
      setNotes(fetchedNotes || [])
    } catch (err: any) {
      if (err.message?.includes('Network Error') || err.code === 'ERR_NETWORK') {
        setNotes([])
        setError(null)
        setIsDevelopmentMode(true)
      } else {
        setError(err.message || 'Failed to load notes')
      }
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchNotes()
    setRefreshing(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const filteredNotes = notes.filter(note => {
    const { title, content } = getTranslatedNote(note)
    const matchesSearch = searchQuery.trim() === '' ||
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.toLowerCase().includes(searchQuery.toLowerCase())
    if (selectedFilter === 'Shared') return matchesSearch && note.isCloned === true
    return matchesSearch
  })

  const handleShareNote = (note: Note) => {
    setSelectedNoteForShare(note)
    setShareModalVisible(true)
  }

  const handleMoveToFolder = (note: Note) => {
    setSelectedNoteForFolder(note)
    setFolderModalVisible(true)
  }

  const handleNotePress = (note: Note) => {
    router.push(`/notes/${note.id}`)
  }

  const handleNewNote = () => {
    if (!hasAccess && notes.length >= 1) {
      setUpgradeVisible(true)
      return
    }
    openSheet()
  }

  const pageBg = isDark ? neutral[950] : '#f0f0f0'
  const cardBg = isDark ? neutral[900] : '#fff'
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
  const searchBg = isDark ? neutral[800] : '#fff'
  const pillBg = isDark ? neutral[800] : '#fff'
  const pillBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const pillActiveBg = isDark ? 'rgba(79,59,231,0.15)' : 'rgba(79,59,231,0.08)'

  return (
    <>
      <View style={[styles.container, { backgroundColor: pageBg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Header */}
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: c.foreground }]}>{t('home.myNotes')}</Text>
            <Pressable
              style={({ pressed }) => [
                styles.settingsBtn,
                {
                  backgroundColor: isDark ? neutral[800] : 'rgba(0,0,0,0.05)',
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
              onPress={() => router.push('/(home)/settings')}
              hitSlop={8}
            >
              <Feather name="settings" size={18} color={c.mutedForeground} />
            </Pressable>
          </View>

          {/* Search */}
          <View style={[styles.searchBar, { backgroundColor: searchBg }]}>
            <Feather name="search" size={18} color={c.mutedForeground} />
            <TextInput
              placeholder={t('home.searchPlaceholder')}
              placeholderTextColor={c.mutedForeground}
              style={[styles.searchInput, { color: c.foreground }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Feather name="x-circle" size={16} color={c.mutedForeground} />
              </Pressable>
            )}
          </View>

          {/* Filter pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScroll}
            style={styles.filtersRow}
          >
            {[
              { key: 'All', label: t('home.filters.all') },
              { key: 'Shared', label: t('home.filters.shared') },
              { key: 'Folders', label: t('home.filters.folders') },
            ].map((f) => {
              const selected = f.key === selectedFilter
              return (
                <Pressable
                  key={f.key}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: selected ? pillActiveBg : pillBg,
                      borderColor: selected ? c.primary : pillBorder,
                      borderWidth: selected ? 1.5 : 1,
                    },
                  ]}
                  onPress={() => {
                    setSelectedFilter(f.key)
                    if (f.key === 'Folders') router.push('/(home)/folders')
                  }}
                >
                  <Text
                    style={[
                      styles.filterText,
                      { color: selected ? c.primary : c.foreground },
                    ]}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>

          {/* Content */}
          <ScrollView
            style={styles.notesList}
            contentContainerStyle={styles.notesContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />
            }
          >
            {/* Folders */}
            {folders.length > 0 && (
              <View style={styles.foldersSection}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: c.foreground }]}>
                    My Folders
                  </Text>
                  <Pressable onPress={() => router.push('/(home)/folders')}>
                    <Text style={[styles.viewAll, { color: c.primary }]}>View All</Text>
                  </Pressable>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.foldersScroll}
                >
                  {folders.slice(0, 6).map((folder) => {
                    const folderColor = folder.color || '#6366f1'
                    return (
                      <Pressable
                        key={folder.id}
                        style={[styles.folderCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
                        onPress={() => router.push(`/(home)/folders/${folder.id}`)}
                      >
                        <View
                          style={[styles.folderIcon, { backgroundColor: `${folderColor}14` }]}
                        >
                          <Folder size={22} color={folderColor} />
                        </View>
                        <Text style={[styles.folderName, { color: c.foreground }]} numberOfLines={1}>
                          {folder.name}
                        </Text>
                        <Text style={[styles.folderCount, { color: c.mutedForeground }]}>
                          {folder.noteCount} {folder.noteCount === 1 ? 'note' : 'notes'}
                        </Text>
                      </Pressable>
                    )
                  })}
                </ScrollView>
              </View>
            )}

            {/* Notes list */}
            {(loading && !refreshing) || isPending ? (
              <View style={styles.stateContainer}>
                <ActivityIndicator size="large" color={c.primary} />
                <Text style={[styles.stateText, { color: c.mutedForeground }]}>
                  {isPending ? 'Checking session...' : t('home.loadingNotes')}
                </Text>
              </View>
            ) : error ? (
              <View style={styles.stateContainer}>
                <Feather name="alert-circle" size={44} color={c.destructive} />
                <Text style={[styles.stateText, { color: c.destructive }]}>{error}</Text>
                <Pressable
                  style={[styles.retryBtn, { backgroundColor: c.primary }]}
                  onPress={fetchNotes}
                >
                  <Text style={[styles.retryText, { color: c.primaryForeground }]}>{t('common.retry')}</Text>
                </Pressable>
              </View>
            ) : filteredNotes.length === 0 ? (
              <View style={styles.stateContainer}>
                <Feather name="file-text" size={52} color={isDark ? neutral[700] : neutral[300]} />
                <Text style={[styles.emptyTitle, { color: c.foreground }]}>
                  {searchQuery ? t('home.noNotesFound') : t('home.noNotesYet')}
                </Text>
                <Text style={[styles.stateText, { color: c.mutedForeground }]}>
                  {searchQuery ? t('home.tryDifferentSearch') : t('home.createFirstNote')}
                </Text>
                {isDevelopmentMode && (
                  <View style={[styles.devBanner, { backgroundColor: isDark ? 'rgba(251,191,36,0.1)' : '#FEF3C7' }]}>
                    <Feather name="info" size={16} color={isDark ? '#FCD34D' : '#92400E'} />
                    <Text style={[styles.devText, { color: isDark ? '#FCD34D' : '#92400E' }]}>
                      {t('home.backendNotConnected')}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <>
                {folders.length > 0 && (
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: c.foreground }]}>Recent Notes</Text>
                  </View>
                )}
                <View style={[styles.notesGroup, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                {filteredNotes.map((note, idx) => {
                  const { title } = getTranslatedNote(note)
                  return (
                    <React.Fragment key={note.id}>
                      <Pressable
                        style={({ pressed }) => [styles.noteRow, { opacity: pressed ? 0.6 : 1 }]}
                        onPress={() => handleNotePress(note)}
                      >
                        <View style={[styles.noteIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                          <Feather name="file-text" size={18} color={c.mutedForeground} />
                        </View>
                        <View style={styles.noteBody}>
                          <Text numberOfLines={2} style={[styles.noteTitle, { color: c.foreground }]}>
                            {title}
                          </Text>
                          <View style={styles.noteFooter}>
                            <Text style={[styles.noteDate, { color: c.mutedForeground }]}>
                              {formatDate(note.createdAt)}
                            </Text>
                            {note.isCloned && (
                              <View style={[styles.sharedBadge, { backgroundColor: isDark ? 'rgba(79,59,231,0.1)' : 'rgba(79,59,231,0.06)' }]}>
                                <Feather name="users" size={10} color={c.primary} />
                                <Text style={[styles.sharedText, { color: c.primary }]}>
                                  {t('share.sharedWithMe')}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <View style={styles.noteActions}>
                          <Pressable
                            style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]}
                            onPress={() => handleMoveToFolder(note)}
                            hitSlop={6}
                          >
                            <Feather name="folder" size={14} color={c.mutedForeground} />
                          </Pressable>
                          <Pressable
                            style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(79,59,231,0.08)' : 'rgba(79,59,231,0.06)' }]}
                            onPress={() => handleShareNote(note)}
                            hitSlop={6}
                          >
                            <Feather name="share-2" size={14} color={c.primary} />
                          </Pressable>
                        </View>
                        <Feather name="chevron-right" size={16} color={isDark ? neutral[600] : neutral[400]} />
                      </Pressable>
                      {idx < filteredNotes.length - 1 && (
                        <View style={[styles.noteSeparator, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />
                      )}
                    </React.Fragment>
                  )
                })}
              </View>
              </>
            )}

            {/* Bottom spacing for FAB */}
            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Liquid Glass FAB */}
          <AnimatedPressable
            style={[
              styles.fab,
              fabAnimStyle,
              {
                ...glassShadow.md,
                borderColor: isDark
                  ? liquidGlass.regular.dark.border
                  : liquidGlass.regular.light.border,
                borderWidth: 1,
              },
            ]}
            onPressIn={() => {
              fabScale.value = withSpring(0.93, { damping: 15, stiffness: 400 })
            }}
            onPressOut={() => {
              fabScale.value = withSpring(1, { damping: 12, stiffness: 300 })
            }}
            onPress={handleNewNote}
          >
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: isDark ? 'rgba(79,59,231,0.85)' : 'rgba(79,59,231,0.9)' },
              ]}
            />
            <Feather name="plus" size={20} color="#fff" />
            <Text style={[styles.fabText, { color: '#fff' }]}>New note</Text>
          </AnimatedPressable>
        </SafeAreaView>
      </View>

      {/* Liquid Glass Bottom Sheet */}
      {sheetVisible && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {/* Dimmed overlay — per HIG: helps legibility behind regular variant */}
          <AnimatedPressable
            style={[styles.sheetOverlay, overlayAnimStyle]}
            onPress={closeSheet}
          />

          {/* Sheet */}
          <Animated.View
            style={[
              styles.sheetContainer,
              sheetAnimStyle,
              { paddingBottom: insets.bottom || 20 },
            ]}
            pointerEvents="box-none"
          >
            <View style={styles.sheetInner} pointerEvents="box-none">
              <Pressable
                style={[
                  styles.glassSheet,
                  {
                    borderColor: isDark
                      ? liquidGlass.regular.dark.border
                      : liquidGlass.regular.light.border,
                    ...glassShadow.lg,
                  },
                ]}
                onPress={(e) => e.stopPropagation()}
              >
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      backgroundColor: isDark
                        ? 'rgba(23,24,26,0.92)'
                        : 'rgba(255,255,255,0.94)',
                    },
                  ]}
                />
                {/* Handle */}
                <View style={styles.glassHandle}>
                  <View
                    style={[
                      styles.handleBar,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255,255,255,0.22)'
                          : 'rgba(0,0,0,0.14)',
                      },
                    ]}
                  />
                </View>

                {activeOption === null ? (
                  <View style={styles.sheetContent}>
                    <Text style={[styles.sheetTitle, { color: c.foreground }]}>
                      {t('home.newNote')}
                    </Text>

                    <View style={styles.optionGrid}>
                      {NEW_NOTE_OPTIONS.map((opt) => (
                        <Pressable
                          key={opt.id}
                          style={({ pressed }) => [
                            styles.glassOptionCard,
                            {
                              backgroundColor: pressed
                                ? (isDark ? glass.heavy : 'rgba(0,0,0,0.05)')
                                : (isDark ? glass.light : 'rgba(0,0,0,0.02)'),
                              borderColor: isDark ? glass.border : 'rgba(0,0,0,0.06)',
                              transform: [{ scale: pressed ? 0.97 : 1 }],
                            },
                          ]}
                          onPress={() => setActiveOption(opt.id)}
                        >
                          <View
                            style={[
                              styles.optionIcon,
                              { backgroundColor: opt.color },
                            ]}
                          >
                            <Feather name={opt.icon} size={20} color="#fff" />
                          </View>
                          <Text style={[styles.optionLabel, { color: c.foreground }]}>
                            {opt.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ) : (
                  <View style={styles.sheetContent}>
                    {activeOption === 1 && (
                      <RecordAudio
                        inline
                        onClose={() => setActiveOption(null)}
                        onNoteGenerated={() => { fetchNotes(); closeSheet() }}
                      />
                    )}
                    {activeOption === 2 && (
                      <UploadAudio
                        inline
                        onClose={() => setActiveOption(null)}
                        onNoteGenerated={() => { fetchNotes(); closeSheet() }}
                      />
                    )}
                    {activeOption === 3 && (
                      <UploadTextOrPDF
                        inline
                        onClose={() => setActiveOption(null)}
                        onNoteCreated={() => { fetchNotes(); closeSheet() }}
                      />
                    )}
                    {activeOption === 4 && (
                      <WebLink
                        inline
                        onClose={() => setActiveOption(null)}
                        onNoteGenerated={() => { fetchNotes(); closeSheet() }}
                      />
                    )}
                  </View>
                )}
              </Pressable>
            </View>
          </Animated.View>
        </View>
      )}

      {selectedNoteForShare && (
        <ShareLinkModal
          visible={shareModalVisible}
          onClose={() => { setShareModalVisible(false); setSelectedNoteForShare(null) }}
          noteId={selectedNoteForShare.id}
          noteTitle={selectedNoteForShare.title}
        />
      )}

      {selectedNoteForFolder && (
        <FolderSelectorModal
          visible={folderModalVisible}
          onClose={() => { setFolderModalVisible(false); setSelectedNoteForFolder(null) }}
          noteId={selectedNoteForFolder.id}
          currentFolderId={selectedNoteForFolder.folderId}
          onFolderSelected={() => { fetchNotes(); fetchFolders() }}
        />
      )}

      <UpgradeModal
        visible={upgradeVisible}
        onClose={() => setUpgradeVisible(false)}
        onUpgrade={() => {
          setUpgradeVisible(false)
          router.push('/(onboarding)/paywall/paywall5')
        }}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 20 },

  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 10,
    borderCurve: 'continuous',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    paddingVertical: 0,
  },

  filtersRow: { marginBottom: 16, flexGrow: 0 },
  filtersScroll: { gap: 8 },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },

  notesList: { flex: 1 },
  notesContent: { paddingBottom: 20 },

  foldersSection: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', letterSpacing: -0.3 },
  viewAll: { fontSize: 14, fontWeight: '600' },
  foldersScroll: { paddingRight: 20 },
  folderCard: {
    width: 130,
    borderRadius: 16,
    borderCurve: 'continuous',
    padding: 14,
    marginRight: 10,
    borderWidth: 1,
  },
  folderIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  folderName: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  folderCount: { fontSize: 12, fontWeight: '500' },

  notesGroup: {
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 8,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  noteSeparator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 64,
  },
  noteIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteBody: { flex: 1 },
  noteTitle: { fontSize: 15, fontWeight: '600', lineHeight: 20, marginBottom: 3 },
  noteFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  noteDate: { fontSize: 13, fontWeight: '400' },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderCurve: 'continuous',
  },
  sharedText: { fontSize: 10, fontWeight: '600' },
  noteActions: { flexDirection: 'row', gap: 6 },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },

  stateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  stateText: { marginTop: 12, fontSize: 15, textAlign: 'center' },
  emptyTitle: { marginTop: 16, fontSize: 20, fontWeight: '600', textAlign: 'center' },
  retryBtn: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 14,
    borderCurve: 'continuous',
  },
  retryText: { fontSize: 16, fontWeight: '600' },
  devBanner: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  devText: { flex: 1, fontSize: 13, fontWeight: '600' },

  /* ── Liquid Glass FAB ────────────────────────────────────────────────── */
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 32 : 28,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 15,
    borderRadius: 22,
    borderCurve: 'continuous',
    gap: 8,
    overflow: 'hidden',
  },
  fabText: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },

  /* ── Liquid Glass Bottom Sheet ─────────────────────────────────────── */
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheetContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  sheetInner: {
    overflow: 'hidden',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderCurve: 'continuous',
  },
  glassSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  glassHandle: {
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 4,
    zIndex: 1,
  },
  handleBar: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 20,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  glassOptionCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    gap: 12,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
})
