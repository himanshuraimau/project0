import React, { useState } from 'react'
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
import { Feather } from '@expo/vector-icons'
import { useFolders } from '@/lib/hooks/useFolders'
import { useTheme } from '@/lib/hooks/useTheme'
import * as Haptics from 'expo-haptics'

interface CreateFolderModalProps {
  visible: boolean
  onClose: () => void
  onSuccess?: () => void
}

const FOLDER_COLORS = [
  '#6366f1', '#858dff', '#ec4899', '#f43f5e', '#f97316',
  '#f59e0b', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6',
]

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { createFolder, loading } = useFolders()
  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0])
  const [nameError, setNameError] = useState('')

  // Liquid glass
  const sheetBg = isDark ? 'rgba(23,24,26,0.95)' : 'rgba(255,255,255,0.95)'
  const sheetBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'
  const inputBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
  const inputBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const separatorColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'

  const handleClose = () => {
    if (!loading) {
      setName('')
      setDescription('')
      setSelectedColor(FOLDER_COLORS[0])
      setNameError('')
      onClose()
    }
  }

  const handleNameChange = (text: string) => {
    setName(text)
    if (nameError) {
      setNameError(text.trim() ? '' : 'Folder name is required')
    }
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      setNameError('Folder name is required')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return
    }

    const result = await createFolder({
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

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        <View style={[styles.safeWrap, { backgroundColor: sheetBg }]}>
          <View style={[styles.sheet, { backgroundColor: sheetBg, borderColor: sheetBorder }]}>
            <View style={[styles.handle, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)' }]} />

            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: c.foreground }]}>Create Folder</Text>
              <Pressable
                onPress={handleClose}
                hitSlop={12}
                disabled={loading}
                style={({ pressed }) => [
                  styles.closeBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                    opacity: pressed ? 0.6 : 1,
                  },
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
              {/* Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: c.mutedForeground }]}>NAME</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: inputBg,
                      borderColor: nameError ? c.destructive : inputBorder,
                      color: c.foreground,
                    },
                  ]}
                  placeholder="e.g., AI Research, Class Notes"
                  placeholderTextColor={c.mutedForeground}
                  value={name}
                  onChangeText={handleNameChange}
                  maxLength={50}
                  editable={!loading}
                  autoFocus
                />
                <View style={styles.inputFooter}>
                  {nameError ? (
                    <Text style={[styles.errorText, { color: c.destructive }]}>{nameError}</Text>
                  ) : <View />}
                  <Text style={[styles.charCount, { color: c.mutedForeground }]}>{name.length}/50</Text>
                </View>
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: c.mutedForeground }]}>DESCRIPTION (OPTIONAL)</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: inputBg, borderColor: inputBorder, color: c.foreground }]}
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

              {/* Color */}
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

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: separatorColor }]}>
              <Pressable
                style={({ pressed }) => [
                  styles.btn,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}
                onPress={handleClose}
                disabled={loading}
              >
                <Text style={[styles.btnText, { color: c.foreground }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.btn,
                  {
                    backgroundColor: c.primary,
                    opacity: (loading || !name.trim()) ? 0.4 : 1,
                    transform: [{ scale: pressed && !loading && name.trim() ? 0.97 : 1 }],
                  },
                ]}
                onPress={handleCreate}
                disabled={loading || !name.trim()}
              >
                {loading ? (
                  <ActivityIndicator color={c.primaryForeground} size="small" />
                ) : (
                  <Text style={[styles.btnText, { color: c.primaryForeground }]}>Create Folder</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  safeWrap: { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0, paddingTop: 12, maxHeight: '85%' },
  handle: { width: 36, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 16 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '700', letterSpacing: -0.4 },
  closeBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },

  content: { paddingHorizontal: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
  textArea: { height: 80, paddingTop: 14 },
  inputFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  charCount: { fontSize: 12 },
  errorText: { fontSize: 12 },

  colorRow: { gap: 10, paddingVertical: 4 },
  colorDot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  colorDotActive: { borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },

  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4, borderTopWidth: StyleSheet.hairlineWidth },
  btn: { flex: 1, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 16, fontWeight: '600' },
})
