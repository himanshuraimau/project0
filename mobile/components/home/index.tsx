import React, { useState, useEffect } from 'react'
import { BlurView } from 'expo-blur'
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
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { Folder } from 'lucide-react-native';
import RecordAudio from './RecordAudio';
import UploadAudio from './UploadAudio';
import UploadTextOrPDF from './UploadTextOrPDF';
import WebLink from './WebLink';
import { notesApi } from '@/lib/api';
import type { Note } from '@/lib/api/types';
import { getTranslatedNote } from '@/lib/utils/translation';
import { useFolders } from '@/lib/hooks/useFolders';
import { ShareLinkModal } from '@/components/notes';
import FolderSelectorModal from '@/components/folders/FolderSelectorModal';

export default function NotesHome() {
  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'
  const router = useRouter()
  const { t } = useTranslation()
  const { data: session, isPending } = useSession()
  const [modalVisible, setModalVisible] = useState(false)
  const [activeOption, setActiveOption] = useState<number | null>(null)
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

  const newNoteOptions = [
    { id: 1, icon: 'mic', label: t('home.newNoteOptions.recordAudio') },
    { id: 2, icon: 'upload-cloud', label: t('home.newNoteOptions.uploadAudio') },
    { id: 3, icon: 'file-text', label: t('home.newNoteOptions.uploadText') },
    { id: 4, icon: 'link', label: t('home.newNoteOptions.webLink') },
  ]

  // Fetch notes on mount
  useEffect(() => {
    fetchNotes()
  }, [])

  // Refresh notes and folders when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchNotes();
      fetchFolders();
    }, [])
  );

  const fetchNotes = async () => {
    try {
      setLoading(true)
      setError(null)
      setIsDevelopmentMode(false)
      const fetchedNotes = await notesApi.getNotes()
      setNotes(fetchedNotes || []) // Handle null/undefined response
    } catch (err: any) {
      console.error('Failed to fetch notes:', err)

      // Check if it's a network error (backend not running)
      if (err.message?.includes('Network Error') || err.code === 'ERR_NETWORK') {
        console.log('⚠️ Backend not connected - Using empty state for development')
        setNotes([]) // Set empty notes instead of error
        setError(null) // Clear error to show empty state
        setIsDevelopmentMode(true) // Flag for showing dev message
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

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Filter notes based on search query and selected filter
  const filteredNotes = notes.filter(note => {
    // Get translated content for search
    const { title, content } = getTranslatedNote(note);
    const matchesSearch = searchQuery.trim() === '' ||
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.toLowerCase().includes(searchQuery.toLowerCase())

    // Filter logic for different tabs
    if (selectedFilter === 'Shared') {
      // Only show notes that were shared with the user (cloned notes)
      return matchesSearch && note.isCloned === true;
    }
    // 'All' filter - show all notes (excluding archived when field is added)
    // TODO: Add && !note.isArchived when backend adds the field
    return matchesSearch;
  })

  const handleShareNote = (note: Note) => {
    setSelectedNoteForShare(note);
    setShareModalVisible(true);
  }

  const handleMoveToFolder = (note: Note) => {
    setSelectedNoteForFolder(note);
    setFolderModalVisible(true);
  }

  const handleNotePress = (note: Note) => {
    // Navigate to note detail screen
    router.push(`/notes/${note.id}`)
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    safeArea: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 10,
    },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    timeBadge: {
      backgroundColor: c.destructive,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    timeText: {
      color: c.background,
      fontWeight: '500',
      fontSize: 14,
    },
    statusIcons: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    title: {
      fontSize: 34,
      fontWeight: '500',
      color: c.foreground,
    },
    settingsButton: {
      padding: 6,
    },
    searchBlur: {
      borderRadius: 14,
      marginBottom: 12,
      overflow: 'hidden',
      borderWidth: 0.8,
      borderColor: c.border,
    },
    searchInner: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 44,
      paddingLeft: 40,
      paddingRight: 12,
      paddingVertical: 4,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: 14,
      height: 44,
      marginBottom: 12,
      borderWidth: 0.8,
      borderColor: c.border,
      paddingLeft: 40,
      paddingRight: 12,
      paddingVertical: 4,
    },
    searchInput: {
      flex: 1,
      fontFamily: 'Inter',
      fontWeight: '400',
      fontSize: 14,
      lineHeight: 16,
      color: c.foreground,
      paddingHorizontal: 0,
      paddingVertical: 0,
    },
    filtersWrapper: {
      height: 54,
      marginBottom: 12,
    },
    filtersScroll: {
      alignItems: 'center',
      paddingRight: 12,
    },
    filterPill: {
      paddingHorizontal: 16.8,
      paddingVertical: 9.6,
      height: 39.2,
      borderRadius: 26843500,
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : c.card,
      borderWidth: 0.8,
      borderColor: c.border,
      marginRight: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterPillSelected: {
      backgroundColor: isDark ? 'rgba(130,100,255,0.12)' : c.card,
      borderWidth: 1.6,
      borderColor: c.primary,
    },
    filterText: {
      fontFamily: 'Inter',
      fontWeight: '400',
      fontSize: 14,
      lineHeight: 20,
      color: c.foreground,
    },
    filterTextSelected: {
      color: c.primary,
    },
    notesList: {
      flex: 1,
      marginTop: 6,
    },
    noteCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: 14,
      padding: 14,
      marginTop: 2,
      marginBottom: 10,
      marginHorizontal: 1,
      borderWidth: 0.5,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
      shadowColor: c.foreground,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    noteLeftIcon: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: c.muted,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    noteBody: {
      flex: 1,
    },
    noteTitle: {
      color: c.foreground,
      fontWeight: '500',
      fontSize: 16,
      marginBottom: 6,
    },
    noteDate: {
      color: c.mutedForeground,
      fontSize: 13,
    },
    noteCardContainer: {
      marginTop: 2,
      marginBottom: 10,
      marginHorizontal: 1,
    },
    noteFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    sharedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: c.accent,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    sharedBadgeText: {
      color: c.primary,
      fontSize: 10,
      fontWeight: '600',
    },
    noteActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    actionButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: c.muted,
    },
    shareButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: c.muted,
    },
    fabContainer: {
      position: 'absolute',
      alignSelf: 'center',
      bottom: 60,
      borderRadius: 999,
      backgroundColor: c.primary,
    },
    fab: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderRadius: 33,
      gap: 8,
    },
    fabPlus: {
      color: c.background,
      fontSize: 24,
      lineHeight: 26,
      fontWeight: '500',
    },
    fabText: {
      color: c.background,
      fontSize: 16,
      fontWeight: '600',
    },
    homeIndicator: {
      height: 6,
      backgroundColor: c.border,
      borderRadius: 999,
      marginTop: 12,
      marginBottom: 6,
      alignSelf: 'center',
      width: 120,
      opacity: 0.7,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    modalSafeArea: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      overflow: 'hidden',
    },
    modalContainer: {
      paddingTop: 24,
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    glassOverlay: {
      paddingTop: 24,
      paddingHorizontal: 20,
      paddingBottom: 20,
      backgroundColor: isDark ? 'rgba(23,24,26,0.85)' : 'rgba(255,255,255,0.85)',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: '500',
      color: c.foreground,
    },
    closeButton: {
      padding: 4,
    },
    optionsList: {
      gap: 16,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: c.muted,
      borderRadius: 12,
    },
    optionIconContainer: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingRight: 0.0228271,
      width: 39.99,
      height: 39.99,
      backgroundColor: c.border,
      borderRadius: 14,
      marginRight: 16,
    },
    optionText: {
      fontSize: 16,
      fontWeight: '600',
      color: c.foreground,
    },
    backButton: {
      paddingVertical: 12,
      paddingHorizontal: 4,
      alignSelf: 'flex-start',
      marginTop: 16,
    },
    backText: {
      color: c.primary,
      fontSize: 16,
      fontWeight: '600',
    },
    modalHomeIndicator: {
      height: 6,
      backgroundColor: c.border,
      borderRadius: 999,
      marginTop: 24,
      marginBottom: 8,
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
      color: c.background,
      fontSize: 16,
      fontWeight: '600',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 80,
      paddingHorizontal: 40,
    },
    emptyTitle: {
      marginTop: 20,
      color: c.foreground,
      fontSize: 20,
      fontWeight: '500',
      textAlign: 'center',
    },
    emptySubtitle: {
      marginTop: 8,
      color: c.mutedForeground,
      fontSize: 15,
      textAlign: 'center',
    },
    devModeContainer: {
      marginTop: 24,
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: isDark ? 'rgba(251,191,36,0.12)' : '#FEF3C7',
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(251,191,36,0.3)' : '#FCD34D',
    },
    devModeText: {
      marginLeft: 10,
      flex: 1,
      color: isDark ? '#FCD34D' : '#92400E',
      fontSize: 13,
      fontWeight: '600',
    },
    foldersSection: {
      marginBottom: 24,
    },
    foldersSectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    foldersSectionTitle: {
      fontSize: 18,
      fontWeight: '500',
      color: c.foreground,
    },
    viewAllText: {
      fontSize: 14,
      fontWeight: '600',
      color: c.primary,
    },
    foldersScroll: {
      paddingRight: 20,
      paddingLeft: 4
    },
    folderItem: {
      width: 140,
      backgroundColor: c.card,
      borderRadius: 14,
      padding: 14,
      marginRight: 12,
      marginVertical: 1,
      borderWidth: 0.5,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
      shadowColor: c.foreground,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    folderItemIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    folderItemName: {
      fontSize: 15,
      fontWeight: '500',
      color: c.foreground,
      marginBottom: 4,
    },
    folderItemCount: {
      fontSize: 12,
      color: c.mutedForeground,
      fontWeight: '500',
    },
  })

  return (
    <>
      <View style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{t('home.myNotes')}</Text>
            <TouchableOpacity
              style={styles.settingsButton}
              accessibilityLabel="Settings"
              onPress={() => router.push('/(home)/settings')}
            >
              <Feather name="settings" size={22} color={c.foreground} />
            </TouchableOpacity>
          </View>

          <BlurView intensity={isDark ? 20 : 10} tint={isDark ? 'dark' : 'light'} style={styles.searchBlur}>
            <View style={styles.searchInner}>
              <Feather name="search" size={20} color={c.mutedForeground} style={{ position: 'absolute', left: 12, top: 12 }} />
              <TextInput
                placeholder={t('home.searchPlaceholder')}
                placeholderTextColor={c.mutedForeground}
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                >
                  <Feather name="x" size={18} color={c.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>
          </BlurView>

          <View style={styles.filtersWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
              {[
                { key: 'All', label: t('home.filters.all') },
                { key: 'Shared', label: t('home.filters.shared') },
                { key: 'Folders', label: t('home.filters.folders') },
              ].map((f) => {
                const selected = f.key === selectedFilter
                return (
                  <Pressable
                    key={f.key}
                    style={[styles.filterPill, selected && styles.filterPillSelected]}
                    onPress={() => {
                      setSelectedFilter(f.key)
                      if (f.key === 'Folders') {
                        router.push('/(home)/folders')
                      }
                    }}
                  >
                    <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{f.label}</Text>
                  </Pressable>
                )
              })}
            </ScrollView>
          </View>

          {/* Folders Section */}
          {folders.length > 0 && (
            <View style={styles.foldersSection}>
              <View style={styles.foldersSectionHeader}>
                <Text style={styles.foldersSectionTitle}>My Folders</Text>
                <TouchableOpacity onPress={() => router.push('/(home)/folders')}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.foldersScroll}
              >
                {folders.slice(0, 6).map((folder) => {
                  const folderColor = folder.color || '#6366f1';
                  return (
                    <Pressable
                      key={folder.id}
                      style={styles.folderItem}
                      onPress={() => router.push(`/(home)/folders/${folder.id}`)}
                    >
                      <View
                        style={[
                          styles.folderItemIcon,
                          { backgroundColor: `${folderColor}15` },
                        ]}
                      >
                        <Folder size={24} color={folderColor} />
                      </View>
                      <Text style={styles.folderItemName} numberOfLines={1}>
                        {folder.name}
                      </Text>
                      <Text style={styles.folderItemCount}>
                        {folder.noteCount} {folder.noteCount === 1 ? 'note' : 'notes'}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <ScrollView
            style={styles.notesList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {(loading && !refreshing) || isPending ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={c.primary} />
                <Text style={styles.loadingText}>
                  {isPending ? 'Checking session...' : t('home.loadingNotes')}
                </Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={48} color={c.destructive} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={fetchNotes}
                >
                  <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
                </TouchableOpacity>
              </View>
            ) : filteredNotes.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Feather name="file-text" size={64} color={c.border} />
                <Text style={styles.emptyTitle}>
                  {searchQuery ? t('home.noNotesFound') : t('home.noNotesYet')}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery
                    ? t('home.tryDifferentSearch')
                    : t('home.createFirstNote')}
                </Text>
                {isDevelopmentMode && (
                  <View style={styles.devModeContainer}>
                    <Feather name="info" size={20} color={c.warning} />
                    <Text style={styles.devModeText}>
                      {t('home.backendNotConnected')}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              filteredNotes.map((note) => {
                const { title } = getTranslatedNote(note);
                return (
                  <View key={note.id} style={styles.noteCardContainer}>
                    <Pressable
                      style={styles.noteCard}
                      onPress={() => handleNotePress(note)}
                    >
                      <View style={styles.noteLeftIcon}>
                        <Feather name="file-text" size={20} color={c.mutedForeground} />
                      </View>
                      <View style={styles.noteBody}>
                        <Text numberOfLines={2} style={styles.noteTitle}>
                          {title}
                        </Text>
                        <View style={styles.noteFooter}>
                          <Text style={styles.noteDate}>
                            {formatDate(note.createdAt)}
                          </Text>
                          {note.isCloned && (
                            <View style={styles.sharedBadge}>
                              <Feather name="users" size={10} color={c.primary} />
                              <Text style={styles.sharedBadgeText}>
                                {t('share.sharedWithMe')}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={styles.noteActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleMoveToFolder(note);
                          }}
                        >
                          <Feather name="folder" size={16} color={c.mutedForeground} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.shareButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleShareNote(note);
                          }}
                        >
                          <Feather name="share-2" size={16} color={c.primary} />
                        </TouchableOpacity>
                        <Feather name="chevron-right" size={20} color={c.mutedForeground} />
                      </View>
                    </Pressable>
                  </View>
                );
              })
            )}
          </ScrollView>

          <View style={styles.fabContainer}>
            <TouchableOpacity
              style={styles.fab}
              accessibilityLabel="Add note"
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.fabPlus}>+</Text>
              <Text style={styles.fabText}>New Note</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <SafeAreaView edges={['bottom']} style={styles.modalSafeArea}>
          <BlurView intensity={isDark ? 40 : 20} tint={isDark ? 'dark' : 'light'}>
          <View style={styles.glassOverlay}>
          <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
            {activeOption === null && (
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('home.newNote')}</Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.closeButton}
                  accessibilityLabel="Close"
                >
                  <Feather name="x" size={24} color={c.foreground} />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.optionsList}>
              {activeOption == null ? (
                // show the selectable options
                newNoteOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.optionRow}
                    onPress={() => {
                      // keep the New Note modal open and show the selected option inline
                      setActiveOption(option.id)
                    }}
                  >
                    <View style={styles.optionIconContainer}>
                      <Feather name={option.icon as any} size={19.99} color={c.foreground} />
                    </View>
                    <Text style={styles.optionText}>{option.label}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                // render the selected option inline inside the modal
                <View>
                  {activeOption === 1 && (
                    <RecordAudio
                      inline
                      onClose={() => setActiveOption(null)}
                      onNoteGenerated={() => {
                        fetchNotes();
                        setModalVisible(false);
                        setActiveOption(null);
                      }}
                    />
                  )}

                  {activeOption === 2 && (
                    <UploadAudio
                      inline
                      onClose={() => setActiveOption(null)}
                      onNoteGenerated={() => {
                        fetchNotes();
                        setModalVisible(false);
                        setActiveOption(null);
                      }}
                    />
                  )}

                  {activeOption === 3 && (
                    <UploadTextOrPDF
                      inline
                      onClose={() => setActiveOption(null)}
                      onNoteCreated={() => {
                        fetchNotes(); // Refresh notes list
                        setModalVisible(false); // Close modal
                        setActiveOption(null); // Reset active option
                      }}
                    />
                  )}

                  {activeOption === 4 && (
                    <WebLink
                      inline
                      onClose={() => setActiveOption(null)}
                      onNoteGenerated={() => {
                        fetchNotes();
                        setModalVisible(false);
                        setActiveOption(null);
                      }}
                    />
                  )}
                </View>
              )}
            </View>
          </Pressable>
          </View>
          </BlurView>
          </SafeAreaView>
        </Pressable>
      </Modal>

      {/* Share Link Modal */}
      {selectedNoteForShare && (
        <ShareLinkModal
          visible={shareModalVisible}
          onClose={() => {
            setShareModalVisible(false);
            setSelectedNoteForShare(null);
          }}
          noteId={selectedNoteForShare.id}
          noteTitle={selectedNoteForShare.title}
        />
      )}

      {/* Folder Selector Modal */}
      {selectedNoteForFolder && (
        <FolderSelectorModal
          visible={folderModalVisible}
          onClose={() => {
            setFolderModalVisible(false);
            setSelectedNoteForFolder(null);
          }}
          noteId={selectedNoteForFolder.id}
          currentFolderId={selectedNoteForFolder.folderId}
          onFolderSelected={() => {
            fetchNotes(); // Refresh notes list
            fetchFolders(); // Refresh folders list
          }}
        />
      )}
    </>
  )
}
