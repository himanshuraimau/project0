import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Feather, Ionicons } from '@expo/vector-icons'
import { Folder as FolderIcon } from 'lucide-react-native'
import { useFolders } from '@/lib/hooks/useFolders'
import { notesApi } from '@/lib/api'
import type { Folder, Note } from '@/lib/api/types'
import { EditFolderModal } from './EditFolderModal'
import { DeleteFolderDialog } from './DeleteFolderDialog'
import { getTranslatedNote } from '@/lib/utils/translation'
import { useTheme } from '@/lib/hooks/useTheme'
import { neutral } from '@/lib/design-system'

interface FolderDetailScreenProps {
  folderId: string
}

export const FolderDetailScreen: React.FC<FolderDetailScreenProps> = ({ folderId }) => {
  const router = useRouter()
  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'
  const { fetchFolder, loading, error } = useFolders()
  const [folder, setFolder] = useState<Folder | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => { loadFolderData() }, [folderId])

  const loadFolderData = async () => {
    const data = await fetchFolder(folderId, true)
    if (data) {
      setFolder(data)
      await loadNotes()
    }
  }

  const loadNotes = async () => {
    setLoadingNotes(true)
    try {
      const allNotes = await notesApi.getNotes()
      setNotes(allNotes.filter((n) => n.folderId === folderId))
    } catch (err) {
      console.error('Error loading notes:', err)
    } finally {
      setLoadingNotes(false)
    }
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const cardBg = isDark ? neutral[900] : '#fff'
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
  const separatorColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const pageBg = isDark ? neutral[950] : '#f0f0f0'

  if ((loading && !folder) || error || !folder) {
    return (
      <View style={[styles.container, { backgroundColor: pageBg }]}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={12} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
              <Feather name="arrow-left" size={24} color={c.foreground} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: c.foreground }]}>Folder</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.stateWrap}>
            {error || (!loading && !folder) ? (
              <>
                <Feather name="alert-circle" size={44} color={c.destructive} />
                <Text style={[styles.stateTitle, { color: c.foreground }]}>Error loading folder</Text>
                <Text style={[styles.stateText, { color: c.mutedForeground }]}>{error || 'Folder not found'}</Text>
                <Pressable style={[styles.retryBtn, { backgroundColor: c.primary }]} onPress={() => router.back()}>
                  <Text style={[styles.retryText, { color: c.primaryForeground }]}>Go Back</Text>
                </Pressable>
              </>
            ) : (
              <>
                <ActivityIndicator size="large" color={c.primary} />
                <Text style={[styles.stateText, { color: c.mutedForeground }]}>Loading folder...</Text>
              </>
            )}
          </View>
        </SafeAreaView>
      </View>
    )
  }

  const folderColor = folder.color || '#6366f1'

  const renderNote = ({ item, index }: { item: Note; index: number }) => {
    const { title } = getTranslatedNote(item)
    return (
      <>
        <Pressable
          style={({ pressed }) => [styles.noteRow, { opacity: pressed ? 0.6 : 1 }]}
          onPress={() => router.push(`/notes/${item.id}`)}
        >
          <View style={[styles.noteIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
            <Feather name="file-text" size={18} color={c.mutedForeground} />
          </View>
          <View style={styles.noteBody}>
            <Text numberOfLines={2} style={[styles.noteTitle, { color: c.foreground }]}>{title}</Text>
            <Text style={[styles.noteDate, { color: c.mutedForeground }]}>{formatDate(item.createdAt)}</Text>
          </View>
          <Feather name="chevron-right" size={16} color={isDark ? neutral[600] : neutral[400]} />
        </Pressable>
        {index < notes.length - 1 && (
          <View style={[styles.separator, { backgroundColor: separatorColor }]} />
        )}
      </>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: pageBg }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
            <Feather name="arrow-left" size={24} color={c.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: c.foreground }]}>{folder.name}</Text>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => setShowEditModal(true)}
              hitSlop={8}
              style={({ pressed }) => [
                styles.actionCircle,
                { backgroundColor: isDark ? neutral[800] : 'rgba(0,0,0,0.05)', opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Feather name="edit-2" size={16} color={c.mutedForeground} />
            </Pressable>
            <Pressable
              onPress={() => setShowDeleteDialog(true)}
              hitSlop={8}
              style={({ pressed }) => [
                styles.actionCircle,
                { backgroundColor: isDark ? 'rgba(255,59,48,0.1)' : 'rgba(255,59,48,0.08)', opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Feather name="trash-2" size={16} color="#FF3B30" />
            </Pressable>
          </View>
        </View>

        <FlatList
          data={notes}
          renderItem={renderNote}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* Folder info card */}
              <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={[styles.folderIconWrap, { backgroundColor: `${folderColor}14` }]}>
                  <FolderIcon size={32} color={folderColor} />
                </View>
                <Text style={[styles.folderName, { color: c.foreground }]}>{folder.name}</Text>
                {folder.description && (
                  <Text style={[styles.folderDesc, { color: c.mutedForeground }]}>{folder.description}</Text>
                )}
                <View style={[styles.countPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                  <Feather name="file-text" size={12} color={c.mutedForeground} />
                  <Text style={[styles.countText, { color: c.mutedForeground }]}>
                    {notes.length} {notes.length === 1 ? 'note' : 'notes'}
                  </Text>
                </View>
              </View>

              {/* Notes section label */}
              <Text style={[styles.sectionLabel, { color: c.mutedForeground }]}>NOTES</Text>

              {loadingNotes ? (
                <View style={styles.loadingNotes}>
                  <ActivityIndicator size="small" color={c.primary} />
                  <Text style={[styles.stateText, { color: c.mutedForeground }]}>Loading notes...</Text>
                </View>
              ) : notes.length === 0 ? (
                <View style={styles.emptyNotes}>
                  <Feather name="file-text" size={40} color={isDark ? neutral[700] : neutral[300]} />
                  <Text style={[styles.stateTitle, { color: c.foreground }]}>No notes yet</Text>
                  <Text style={[styles.stateText, { color: c.mutedForeground }]}>
                    Create notes and move them to this folder
                  </Text>
                </View>
              ) : (
                <View style={[styles.notesGroup, { backgroundColor: cardBg, borderColor: cardBorder }]} />
              )}
            </>
          }
          ListHeaderComponentStyle={notes.length > 0 ? { marginBottom: -1 } : undefined}
          CellRendererComponent={notes.length > 0 ? ({ children, index, ...props }) => (
            <View {...props} style={index === 0 ? [styles.notesGroupStart, { backgroundColor: cardBg, borderColor: cardBorder }] : index === notes.length - 1 ? [styles.notesGroupEnd, { backgroundColor: cardBg }] : [{ backgroundColor: cardBg }]}>
              {children}
            </View>
          ) : undefined}
        />
      </SafeAreaView>

      <EditFolderModal
        visible={showEditModal}
        folder={folder}
        onClose={() => setShowEditModal(false)}
        onSuccess={loadFolderData}
      />
      <DeleteFolderDialog
        visible={showDeleteDialog}
        folder={folder}
        onClose={() => setShowDeleteDialog(false)}
        onSuccess={() => router.back()}
      />
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
  headerTitle: { fontSize: 17, fontWeight: '600', letterSpacing: -0.3, flex: 1, textAlign: 'center' },
  headerActions: { flexDirection: 'row', gap: 8 },
  actionCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  listContent: { paddingHorizontal: 20, paddingBottom: 40 },

  infoCard: {
    alignItems: 'center',
    padding: 28,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  folderIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  folderName: { fontSize: 22, fontWeight: '700', letterSpacing: -0.4, marginBottom: 4 },
  folderDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 12, paddingHorizontal: 16 },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  countText: { fontSize: 13, fontWeight: '600' },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },

  notesGroup: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  notesGroupStart: { borderTopLeftRadius: 14, borderTopRightRadius: 14, borderWidth: 1, borderBottomWidth: 0, overflow: 'hidden' },
  notesGroupEnd: { borderBottomLeftRadius: 14, borderBottomRightRadius: 14, overflow: 'hidden' },
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
  noteDate: { fontSize: 13 },

  stateWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  stateTitle: { marginTop: 16, fontSize: 18, fontWeight: '600', textAlign: 'center' },
  stateText: { marginTop: 8, fontSize: 14, textAlign: 'center' },
  retryBtn: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14 },
  retryText: { fontSize: 16, fontWeight: '600' },

  loadingNotes: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 12 },
  emptyNotes: { alignItems: 'center', paddingVertical: 60 },
})
