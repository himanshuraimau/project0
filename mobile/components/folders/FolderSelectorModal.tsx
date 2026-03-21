import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather, Ionicons } from '@expo/vector-icons'
import { Folder as FolderIcon } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { foldersApi } from '@/lib/api'
import type { FolderWithCount } from '@/lib/api/types'
import { useAlert } from '@/lib/contexts/AlertContext'
import { useTheme } from '@/lib/hooks/useTheme'
import { neutral } from '@/lib/design-system'

interface FolderSelectorModalProps {
  visible: boolean
  onClose: () => void
  noteId: string
  currentFolderId?: string | null
  onFolderSelected?: () => void
}

export default function FolderSelectorModal({
  visible,
  onClose,
  noteId,
  currentFolderId,
  onFolderSelected,
}: FolderSelectorModalProps) {
  const { t } = useTranslation()
  const { showAlert } = useAlert()
  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'
  const [folders, setFolders] = useState<FolderWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderColor, setNewFolderColor] = useState('#4f3be7')
  const [creating, setCreating] = useState(false)

  const folderColors = [
    '#4f3be7', '#EC4899', '#F59E0B', '#10B981',
    '#3B82F6', '#858dff', '#EF4444', '#14B8A6',
  ]

  useEffect(() => {
    if (visible) {
      fetchFolders()
      setSearchQuery('')
      setShowCreateForm(false)
    }
  }, [visible])

  const fetchFolders = async () => {
    try {
      setLoading(true)
      const fetched = await foldersApi.getFolders()
      setFolders(fetched || [])
    } catch (error: any) {
      showAlert(t('common.error'), error.message || t('folders.failedToLoad'))
    } finally {
      setLoading(false)
    }
  }

  const handleSelectFolder = async (folderId: string | null) => {
    try {
      setSaving(true)
      await foldersApi.moveNoteToFolder(noteId, folderId)
      const folderName = folderId
        ? folders.find((f) => f.id === folderId)?.name
        : t('folders.uncategorized')
      showAlert(t('folders.noteMoved'), t('folders.movedTo', { folderName }))
      onFolderSelected?.()
      onClose()
    } catch (error: any) {
      showAlert(t('common.error'), error.message || t('folders.failedToMove'))
    } finally {
      setSaving(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      showAlert(t('common.error'), t('folders.nameRequired'))
      return
    }
    try {
      setCreating(true)
      const newFolder = await foldersApi.createFolder({
        name: newFolderName.trim(),
        color: newFolderColor,
      })
      setFolders((prev) => [...prev, { ...newFolder, noteCount: 0 }])
      await handleSelectFolder(newFolder.id)
      setNewFolderName('')
      setNewFolderColor('#4f3be7')
      setShowCreateForm(false)
    } catch (error: any) {
      showAlert(t('common.error'), error.message || t('folders.failedToCreate'))
    } finally {
      setCreating(false)
    }
  }

  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const sheetBg = isDark ? neutral[900] : '#fff'
  const cardBg = isDark ? neutral[800] : '#f0f0f0'
  const separatorColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const searchBg = isDark ? neutral[800] : '#e8e8ed'
  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <SafeAreaView edges={['bottom']} style={styles.safeWrap}>
          <Pressable
            style={[styles.sheet, { backgroundColor: sheetBg }]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <View style={[styles.handle, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)' }]} />

            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: c.foreground }]}>
                {t('folders.moveToFolder')}
              </Text>
              <Pressable
                onPress={onClose}
                hitSlop={12}
                style={({ pressed }) => [
                  styles.closeBtn,
                  {
                    backgroundColor: isDark ? neutral[800] : 'rgba(0,0,0,0.05)',
                    opacity: pressed ? 0.5 : 1,
                  },
                ]}
              >
                <Feather name="x" size={16} color={c.mutedForeground} />
              </Pressable>
            </View>

            {/* Search */}
            <View style={[styles.searchBar, { backgroundColor: searchBg }]}>
              <Feather name="search" size={16} color={c.mutedForeground} />
              <TextInput
                style={[styles.searchInput, { color: c.foreground }]}
                placeholder={t('common.search')}
                placeholderTextColor={c.mutedForeground}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <Feather name="x-circle" size={14} color={c.mutedForeground} />
                </Pressable>
              )}
            </View>

            {/* Content */}
            <ScrollView
              style={styles.list}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {loading ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator size="large" color={c.primary} />
                </View>
              ) : (
                <>
                  {/* Uncategorized + folders in a grouped card */}
                  <View style={[styles.group, { backgroundColor: isDark ? neutral[800] : '#fff', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                    {/* Uncategorized */}
                    <Pressable
                      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
                      onPress={() => handleSelectFolder(null)}
                      disabled={saving}
                    >
                      <View style={[styles.folderIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                        <Feather name="inbox" size={18} color={c.mutedForeground} />
                      </View>
                      <View style={styles.rowInfo}>
                        <Text style={[styles.rowName, { color: c.foreground }]}>
                          {t('folders.uncategorized')}
                        </Text>
                        <Text style={[styles.rowSub, { color: c.mutedForeground }]}>
                          {t('folders.notesWithoutFolder')}
                        </Text>
                      </View>
                      {currentFolderId === null && (
                        <Ionicons name="checkmark-circle" size={20} color={c.primary} />
                      )}
                    </Pressable>

                    {filteredFolders.map((folder, idx) => (
                      <React.Fragment key={folder.id}>
                        <View style={[styles.separator, { backgroundColor: separatorColor }]} />
                        <Pressable
                          style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
                          onPress={() => handleSelectFolder(folder.id)}
                          disabled={saving}
                        >
                          <View
                            style={[
                              styles.folderIcon,
                              { backgroundColor: `${folder.color || '#4f3be7'}14` },
                            ]}
                          >
                            <FolderIcon size={18} color={folder.color || '#4f3be7'} />
                          </View>
                          <View style={styles.rowInfo}>
                            <Text style={[styles.rowName, { color: c.foreground }]}>
                              {folder.name}
                            </Text>
                            <Text style={[styles.rowSub, { color: c.mutedForeground }]}>
                              {folder.noteCount} {folder.noteCount === 1 ? t('folders.note') : t('folders.notes')}
                            </Text>
                          </View>
                          {currentFolderId === folder.id && (
                            <Ionicons name="checkmark-circle" size={20} color={c.primary} />
                          )}
                        </Pressable>
                      </React.Fragment>
                    ))}
                  </View>

                  {/* Create folder */}
                  {!showCreateForm ? (
                    <Pressable
                      style={({ pressed }) => [
                        styles.createBtn,
                        {
                          backgroundColor: isDark ? 'rgba(79,59,231,0.1)' : 'rgba(79,59,231,0.06)',
                          borderColor: isDark ? 'rgba(79,59,231,0.2)' : 'rgba(79,59,231,0.12)',
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                      onPress={() => setShowCreateForm(true)}
                      disabled={saving}
                    >
                      <View style={[styles.createIcon, { backgroundColor: c.primary }]}>
                        <Feather name="plus" size={16} color="#fff" />
                      </View>
                      <Text style={[styles.createText, { color: c.primary }]}>
                        {t('folders.createFolder')}
                      </Text>
                    </Pressable>
                  ) : (
                    <View style={[styles.formCard, { backgroundColor: isDark ? neutral[800] : '#fff', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                      <Text style={[styles.formTitle, { color: c.foreground }]}>
                        New Folder
                      </Text>

                      <TextInput
                        style={[styles.formInput, { backgroundColor: inputBg, color: c.foreground }]}
                        placeholder="Folder name"
                        placeholderTextColor={c.mutedForeground}
                        value={newFolderName}
                        onChangeText={setNewFolderName}
                        autoFocus
                      />

                      <Text style={[styles.colorLabel, { color: c.mutedForeground }]}>
                        Color
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.colorRow}
                      >
                        {folderColors.map((color) => (
                          <Pressable
                            key={color}
                            style={[
                              styles.colorDot,
                              { backgroundColor: color },
                              newFolderColor === color && styles.colorDotActive,
                            ]}
                            onPress={() => setNewFolderColor(color)}
                          >
                            {newFolderColor === color && (
                              <Feather name="check" size={14} color="#fff" />
                            )}
                          </Pressable>
                        ))}
                      </ScrollView>

                      <View style={styles.formActions}>
                        <Pressable
                          style={({ pressed }) => [
                            styles.formBtn,
                            {
                              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                              opacity: pressed ? 0.7 : 1,
                            },
                          ]}
                          onPress={() => {
                            setShowCreateForm(false)
                            setNewFolderName('')
                            setNewFolderColor('#4f3be7')
                          }}
                          disabled={creating}
                        >
                          <Text style={[styles.formBtnText, { color: c.foreground }]}>
                            Cancel
                          </Text>
                        </Pressable>
                        <Pressable
                          style={({ pressed }) => [
                            styles.formBtn,
                            {
                              backgroundColor: c.primary,
                              opacity: (creating || !newFolderName.trim()) ? 0.5 : pressed ? 0.85 : 1,
                            },
                          ]}
                          onPress={handleCreateFolder}
                          disabled={creating || !newFolderName.trim()}
                        >
                          {creating ? (
                            <ActivityIndicator size="small" color={c.primaryForeground} />
                          ) : (
                            <Text style={[styles.formBtnText, { color: c.primaryForeground }]}>
                              Create & Select
                            </Text>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  )}

                  {filteredFolders.length === 0 && !loading && !showCreateForm && (
                    <View style={styles.emptyWrap}>
                      <Text style={[styles.emptyText, { color: c.mutedForeground }]}>
                        {searchQuery ? t('folders.noFoldersFound') : t('folders.noFoldersYet')}
                      </Text>
                    </View>
                  )}
                </>
              )}

              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Saving overlay */}
            {saving && (
              <View style={[styles.savingOverlay, { backgroundColor: isDark ? 'rgba(7,7,8,0.85)' : 'rgba(255,255,255,0.85)' }]}>
                <ActivityIndicator size="large" color={c.primary} />
                <Text style={[styles.savingText, { color: c.mutedForeground }]}>
                  {t('common.loading')}
                </Text>
              </View>
            )}
          </Pressable>
        </SafeAreaView>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  safeWrap: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    maxHeight: '80%',
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '700', letterSpacing: -0.4 },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },

  list: { paddingHorizontal: 20 },
  loadingWrap: { paddingVertical: 40, alignItems: 'center' },

  group: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 56 },
  folderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '600', marginBottom: 1 },
  rowSub: { fontSize: 12 },

  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    marginBottom: 14,
  },
  createIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createText: { fontSize: 15, fontWeight: '600' },

  formCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  formTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3, marginBottom: 14 },
  formInput: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 14,
  },
  colorLabel: { fontSize: 13, fontWeight: '600', letterSpacing: 0.1, marginBottom: 10 },
  colorRow: { gap: 10, paddingBottom: 18 },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDotActive: {
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  formActions: { flexDirection: 'row', gap: 10 },
  formBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formBtnText: { fontSize: 15, fontWeight: '600' },

  emptyWrap: { paddingVertical: 32, alignItems: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center' },

  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  savingText: { marginTop: 12, fontSize: 14 },
})
