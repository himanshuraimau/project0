import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { useFolders } from '@/lib/hooks/useFolders'
import type { Folder } from '@/lib/api/types'
import { useTheme } from '@/lib/hooks/useTheme'
import { neutral } from '@/lib/design-system'
import * as Haptics from 'expo-haptics'

interface EditFolderModalProps {
  visible: boolean
  folder: Folder | null
  onClose: () => void
  onSuccess?: () => void
}

const FOLDER_COLORS = [
  '#6366f1', '#858dff', '#ec4899', '#f43f5e', '#f97316',
  '#f59e0b', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6',
]

export const EditFolderModal: React.FC<EditFolderModalProps> = ({
  visible,
  folder,
  onClose,
  onSuccess,
}) => {
  const { updateFolder, loading } = useFolders()
  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0])
  const [nameError, setNameError] = useState('')

  const sheetBg = isDark ? neutral[900] : '#fff'
  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'
  const separatorColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'

  useEffect(() => {
    if (folder) {
      setName(folder.name)
      setDescription(folder.description || '')
      setSelectedColor(folder.color || FOLDER_COLORS[0])
    }
  }, [folder])

  const handleClose = () => {
    if (!loading) {
      setNameError('')
      onClose()
    }
  }

  const handleNameChange = (text: string) => {
    setName(text)
    if (nameError) setNameError(text.trim() ? '' : 'Folder name is required')
  }

  const handleUpdate = async () => {
    if (!folder) return
    if (!name.trim()) {
      setNameError('Folder name is required')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return
    }

    const result = await updateFolder(folder.id, {
      name: name.trim(),
      description: description.trim() || undefined,
      color: selectedColor,
    })

    if (result) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      handleClose()
      onSuccess?.()
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    }
  }

  if (!folder) return null

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        <SafeAreaView edges={['bottom']} style={styles.safeWrap}>
          <View style={[styles.sheet, { backgroundColor: sheetBg }]}>
            <View style={[styles.handle, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)' }]} />

            <View style={styles.header}>
              <Text style={[styles.title, { color: c.foreground }]}>Edit Folder</Text>
              <Pressable
                onPress={handleClose}
                hitSlop={12}
                disabled={loading}
                style={({ pressed }) => [
                  styles.closeBtn,
                  { backgroundColor: isDark ? neutral[800] : 'rgba(0,0,0,0.05)', opacity: pressed ? 0.5 : 1 },
                ]}
              >
                <Feather name="x" size={16} color={c.mutedForeground} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.content}
            >
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: c.mutedForeground }]}>NAME</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: inputBg,
                      color: c.foreground,
                      borderColor: nameError ? c.destructive : 'transparent',
                      borderWidth: nameError ? 1.5 : 0,
                    },
                  ]}
                  placeholder="Folder name"
                  placeholderTextColor={c.mutedForeground}
                  value={name}
                  onChangeText={handleNameChange}
                  maxLength={50}
                  editable={!loading}
                />
                <View style={styles.inputFooter}>
                  {nameError ? (
                    <Text style={[styles.errorText, { color: c.destructive }]}>{nameError}</Text>
                  ) : <View />}
                  <Text style={[styles.charCount, { color: c.mutedForeground }]}>{name.length}/50</Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: c.mutedForeground }]}>DESCRIPTION (OPTIONAL)</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: inputBg, color: c.foreground }]}
                  placeholder="Brief description..."
                  placeholderTextColor={c.mutedForeground}
                  value={description}
                  onChangeText={setDescription}
                  maxLength={200}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  editable={!loading}
                />
                <View style={styles.inputFooter}>
                  <View />
                  <Text style={[styles.charCount, { color: c.mutedForeground }]}>{description.length}/200</Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: c.mutedForeground }]}>COLOR</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRow}>
                  {FOLDER_COLORS.map((color) => (
                    <Pressable
                      key={color}
                      style={[
                        styles.colorDot,
                        { backgroundColor: color },
                        selectedColor === color && styles.colorDotActive,
                      ]}
                      onPress={() => {
                        setSelectedColor(color)
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                      }}
                      disabled={loading}
                    >
                      {selectedColor === color && <Feather name="check" size={16} color="#fff" />}
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: separatorColor }]}>
              <Pressable
                style={({ pressed }) => [
                  styles.btn,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={handleClose}
                disabled={loading}
              >
                <Text style={[styles.btnText, { color: c.foreground }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.btn,
                  { backgroundColor: c.primary, opacity: (loading || !name.trim()) ? 0.5 : pressed ? 0.85 : 1 },
                ]}
                onPress={handleUpdate}
                disabled={loading || !name.trim()}
              >
                {loading ? (
                  <ActivityIndicator color={c.primaryForeground} size="small" />
                ) : (
                  <Text style={[styles.btnText, { color: c.primaryForeground }]}>Save Changes</Text>
                )}
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  safeWrap: { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, maxHeight: '85%' },
  handle: { width: 36, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 16 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '700', letterSpacing: -0.4 },
  closeBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },

  content: { paddingHorizontal: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
  input: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
  textArea: { height: 80, paddingTop: 14 },
  inputFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  charCount: { fontSize: 12 },
  errorText: { fontSize: 12 },

  colorRow: { gap: 10, paddingVertical: 4 },
  colorDot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  colorDotActive: { borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },

  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: StyleSheet.hairlineWidth },
  btn: { flex: 1, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 16, fontWeight: '600' },
})
