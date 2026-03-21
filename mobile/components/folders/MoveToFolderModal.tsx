import React, { useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather, Ionicons } from '@expo/vector-icons'
import { Folder } from 'lucide-react-native'
import { useFolders } from '@/lib/hooks/useFolders'
import type { Note } from '@/lib/api/types'
import { useTheme } from '@/lib/hooks/useTheme'
import { neutral } from '@/lib/design-system'
import * as Haptics from 'expo-haptics'

interface MoveToFolderModalProps {
  visible: boolean
  note: Note | null
  onClose: () => void
  onSuccess?: () => void
}

export const MoveToFolderModal: React.FC<MoveToFolderModalProps> = ({
  visible,
  note,
  onClose,
  onSuccess,
}) => {
  const { folders, fetchFolders, moveNote, loading } = useFolders()
  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'

  useEffect(() => {
    if (visible) fetchFolders()
  }, [visible])

  const handleMove = async (folderId: string | null) => {
    if (!note) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    const success = await moveNote(note.id, folderId)
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onClose()
      onSuccess?.()
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    }
  }

  if (!note) return null

  const currentFolderId = note.folderId
  const sheetBg = isDark ? neutral[900] : '#fff'
  const cardBg = isDark ? neutral[800] : '#f0f0f0'
  const separatorColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={onClose}>
        <SafeAreaView edges={['bottom']} style={styles.safeWrap}>
          <Pressable
            style={[styles.sheet, { backgroundColor: sheetBg }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.handle, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)' }]} />

            <View style={styles.header}>
              <Text style={[styles.title, { color: c.foreground }]}>Move to Folder</Text>
              <Pressable
                onPress={onClose}
                hitSlop={12}
                style={({ pressed }) => [
                  styles.closeBtn,
                  { backgroundColor: isDark ? neutral[800] : 'rgba(0,0,0,0.05)', opacity: pressed ? 0.5 : 1 },
                ]}
              >
                <Feather name="x" size={16} color={c.mutedForeground} />
              </Pressable>
            </View>

            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              <View style={[styles.group, { backgroundColor: isDark ? neutral[800] : '#fff', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                {/* Uncategorized */}
                <Pressable
                  style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
                  onPress={() => handleMove(null)}
                  disabled={loading}
                >
                  <View style={[styles.folderIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                    <Feather name="inbox" size={18} color={c.mutedForeground} />
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={[styles.rowName, { color: c.foreground }]}>Uncategorized</Text>
                    <Text style={[styles.rowSub, { color: c.mutedForeground }]}>Notes without a folder</Text>
                  </View>
                  {currentFolderId === null && (
                    <Ionicons name="checkmark-circle" size={20} color={c.primary} />
                  )}
                </Pressable>

                {folders.map((folder) => {
                  const folderColor = folder.color || '#6366f1'
                  const isSelected = currentFolderId === folder.id
                  return (
                    <React.Fragment key={folder.id}>
                      <View style={[styles.separator, { backgroundColor: separatorColor }]} />
                      <Pressable
                        style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
                        onPress={() => handleMove(folder.id)}
                        disabled={loading}
                      >
                        <View style={[styles.folderIcon, { backgroundColor: `${folderColor}14` }]}>
                          <Folder size={18} color={folderColor} />
                        </View>
                        <View style={styles.rowInfo}>
                          <Text style={[styles.rowName, { color: c.foreground }]}>{folder.name}</Text>
                          <Text style={[styles.rowSub, { color: c.mutedForeground }]}>
                            {folder.noteCount} {folder.noteCount === 1 ? 'note' : 'notes'}
                          </Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={20} color={c.primary} />
                        )}
                      </Pressable>
                    </React.Fragment>
                  )
                })}
              </View>

              {folders.length === 0 && (
                <View style={styles.emptyWrap}>
                  <Feather name="folder" size={40} color={isDark ? neutral[700] : neutral[300]} />
                  <Text style={[styles.emptyTitle, { color: c.foreground }]}>No folders yet</Text>
                  <Text style={[styles.emptySub, { color: c.mutedForeground }]}>
                    Create folders to organize your notes
                  </Text>
                </View>
              )}

              <View style={{ height: 20 }} />
            </ScrollView>

            {loading && (
              <View style={[styles.loadingOverlay, { backgroundColor: isDark ? 'rgba(7,7,8,0.85)' : 'rgba(255,255,255,0.85)' }]}>
                <ActivityIndicator size="large" color={c.primary} />
              </View>
            )}
          </Pressable>
        </SafeAreaView>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  safeWrap: { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, maxHeight: '75%' },
  handle: { width: 36, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 16 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', letterSpacing: -0.4 },
  closeBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },

  list: { paddingHorizontal: 20 },
  group: { borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, gap: 12 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 56 },
  folderIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '600', marginBottom: 1 },
  rowSub: { fontSize: 12 },

  emptyWrap: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { marginTop: 12, fontSize: 16, fontWeight: '600' },
  emptySub: { marginTop: 4, fontSize: 14, textAlign: 'center' },

  loadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
})
