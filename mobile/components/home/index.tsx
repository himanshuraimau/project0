import React, { useState, useEffect } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useTheme } from '@/lib/hooks/useTheme'
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
import RecordAudio from './RecordAudio';
import UploadAudio from './UploadAudio';
import UploadTextOrPDF from './UploadTextOrPDF';
import WebLink from './WebLink';
import { notesApi } from '@/lib/api';
import type { Note } from '@/lib/api/types';

export default function NotesHome() {
  const { theme } = useTheme()
  const router = useRouter()
  const [modalVisible, setModalVisible] = useState(false)
  const [activeOption, setActiveOption] = useState<number | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('All')
  const [isDevelopmentMode, setIsDevelopmentMode] = useState(false)

  const newNoteOptions = [
    { id: 1, icon: 'mic', label: 'Record audio' },
    { id: 2, icon: 'upload-cloud', label: 'Upload audio' },
    { id: 3, icon: 'file-text', label: 'Upload text or PDF' },
    { id: 4, icon: 'link', label: 'YouTube or web link' },
  ]

  // Fetch notes on mount
  useEffect(() => {
    fetchNotes()
  }, [])

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

  // Filter notes based on search query
  const filteredNotes = notes.filter(note => {
    const matchesSearch = searchQuery.trim() === '' || 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Add filter logic here for Pinned, Shared, Folders, Archive when implemented
    return matchesSearch
  })

  const handleNotePress = (note: Note) => {
    // Navigate to note detail screen
    // router.push(`/notes/${note.id}`)
    console.log('Note pressed:', note.id)
  }

  return (
    <>
      <LinearGradient
        colors={[theme.colors.background, '#FBF7FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.topBar}>
            <View style={styles.timeBadge}>
              <Text style={styles.timeText}>4:23</Text>
            </View>
            <View style={styles.statusIcons}>
              <Feather name="wifi" size={18} color="#222" style={{ marginRight: 8 }} />
              <Feather name="battery" size={18} color="#222" />
            </View>
          </View>

          <View style={styles.titleRow}>
            <Text style={styles.title}>My notes</Text>
            <TouchableOpacity 
              style={styles.settingsButton} 
              accessibilityLabel="Settings"
              onPress={() => router.push('/(drawer)/(home)/settings')}
            >
              <Feather name="settings" size={22} color="#374151" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Feather name="search" size={18} color="#9CA3AF" style={{ marginLeft: 12 }} />
            <TextInput
              placeholder="Search notes, tags, or people"
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

          <View style={styles.filtersWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
              {['All', 'Pinned', 'Shared', 'Folders', 'Archive'].map((f) => {
                const selected = f === selectedFilter
                return (
                  <Pressable 
                    key={f} 
                    style={[styles.filterPill, selected && styles.filterPillSelected]}
                    onPress={() => setSelectedFilter(f)}
                  >
                    <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{f}</Text>
                  </Pressable>
                )
              })}
            </ScrollView>
          </View>

          <ScrollView 
            style={styles.notesList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {loading && !refreshing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7C3AED" />
                <Text style={styles.loadingText}>Loading notes...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={48} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={fetchNotes}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : filteredNotes.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Feather name="file-text" size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>
                  {searchQuery ? 'No notes found' : 'No notes yet'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery 
                    ? 'Try a different search term' 
                    : 'Create your first note to get started'}
                </Text>
                {isDevelopmentMode && (
                  <View style={styles.devModeContainer}>
                    <Feather name="info" size={20} color="#F59E0B" />
                    <Text style={styles.devModeText}>
                      Backend not connected. Start your server to load real notes.
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              filteredNotes.map((note) => (
                <Pressable 
                  key={note.id} 
                  style={styles.noteCard}
                  onPress={() => handleNotePress(note)}
                >
                  <View style={styles.noteLeftIcon}>
                    <Feather name="file-text" size={20} color="#6B7280" />
                  </View>
                  <View style={styles.noteBody}>
                    <Text numberOfLines={2} style={styles.noteTitle}>
                      {note.title}
                    </Text>
                    <Text style={styles.noteDate}>
                      {formatDate(note.createdAt)}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={20} color="#9CA3AF" />
                </Pressable>
              ))
            )}
          </ScrollView>

          <LinearGradient colors={['#7C3AED', '#4F46E5']} style={styles.fabGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <TouchableOpacity 
              style={styles.fab} 
              accessibilityLabel="Add note"
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.fabPlus}>+</Text>
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.homeIndicator} />
        </SafeAreaView>
      </LinearGradient>

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
          <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Note</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
                accessibilityLabel="Close"
              >
                <Feather name="x" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

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
                      <Feather name={option.icon as any} size={24} color="#7C3AED" />
                    </View>
                    <Text style={styles.optionText}>{option.label}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                // render the selected option inline inside the modal
                <View>
                  {activeOption === 1 && (
                    <RecordAudio inline onClose={() => setActiveOption(null)} />
                  )}

                  {activeOption === 2 && (
                    <UploadAudio inline onClose={() => setActiveOption(null)} />
                  )}

                  {activeOption === 3 && (
                    <UploadTextOrPDF inline onClose={() => setActiveOption(null)} />
                  )}

                  {activeOption === 4 && (
                    <WebLink inline onClose={() => setActiveOption(null)} />
                  )}
                </View>
              )}
            </View>

            {activeOption !== null && (
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => setActiveOption(null)}
              >
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
            )}

            <View style={styles.modalHomeIndicator} />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    backgroundColor: '#F87171',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeText: {
    color: '#fff',
    fontWeight: '700',
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
    fontWeight: '800',
    color: '#111827',
  },
  settingsButton: {
    padding: 6,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    height: 48,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: '#111827',
  },
  filtersWrapper: {
    height: 48,
    marginBottom: 12,
  },
  filtersScroll: {
    alignItems: 'center',
    paddingRight: 12,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 10,
  },
  filterPillSelected: {
    backgroundColor: '#7C3AED',
  },
  filterText: {
    color: '#374151',
    fontWeight: '600',
  },
  filterTextSelected: {
    color: '#fff',
  },
  notesList: {
    flex: 1,
    marginTop: 6,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  noteLeftIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  noteBody: {
    flex: 1,
  },
  noteTitle: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 6,
  },
  noteDate: {
    color: '#6B7280',
    fontSize: 13,
  },
  fabGradient: {
    position: 'absolute',
    right: 18,
    bottom: 36,
    borderRadius: 999,
  },
  fab: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabPlus: {
    color: '#fff',
    fontSize: 34,
    lineHeight: 36,
    fontWeight: '700',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
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
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignSelf: 'flex-start',
    marginTop: 16,
  },
  backText: {
    color: '#7C3AED',
    fontSize: 16,
    fontWeight: '600',
  },
  modalHomeIndicator: {
    height: 6,
    backgroundColor: '#E6E6F0',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    marginTop: 20,
    color: '#111827',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 15,
    textAlign: 'center',
  },
  devModeContainer: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  devModeText: {
    marginLeft: 10,
    flex: 1,
    color: '#92400E',
    fontSize: 13,
    fontWeight: '600',
  },
})
