import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFolders } from '@/lib/hooks/useFolders'
import type { Folder } from '@/lib/api/types'
import { useTheme } from '@/lib/hooks/useTheme'
import { neutral } from '@/lib/design-system'
import * as Haptics from 'expo-haptics'

interface DeleteFolderDialogProps {
  visible: boolean
  folder: Folder | null
  onClose: () => void
  onSuccess?: () => void
}

export const DeleteFolderDialog: React.FC<DeleteFolderDialogProps> = ({
  visible,
  folder,
  onClose,
  onSuccess,
}) => {
  const { deleteFolder, loading } = useFolders()
  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'

  const handleDelete = async () => {
    if (!folder) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    const success = await deleteFolder(folder.id)
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onClose()
      onSuccess?.()
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    }
  }

  if (!folder) return null

  const cardBg = isDark ? neutral[800] : '#fff'

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.card, { backgroundColor: cardBg }]} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.iconWrap, { backgroundColor: 'rgba(255,59,48,0.1)' }]}>
            <Ionicons name="warning" size={24} color="#FF3B30" />
          </View>

          <Text style={[styles.title, { color: c.foreground }]}>Delete Folder?</Text>

          <Text style={[styles.message, { color: c.mutedForeground }]}>
            {"Are you sure you want to delete \u201C"}{folder.name}{"\u201D? Notes will be moved to uncategorized."}
          </Text>

          <View style={[styles.warningBanner, { backgroundColor: isDark ? 'rgba(255,149,0,0.08)' : '#FFF8EE' }]}>
            <Text style={[styles.warningText, { color: isDark ? '#FFB84D' : '#92400E' }]}>
              This action cannot be undone.
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.btn,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={[styles.btnText, { color: c.foreground }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.btn,
                { backgroundColor: '#FF3B30', opacity: loading ? 0.6 : pressed ? 0.85 : 1 },
              ]}
              onPress={handleDelete}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={[styles.btnText, { color: '#fff' }]}>Delete</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const { width: SCREEN_W } = Dimensions.get('window')

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  card: {
    width: Math.min(SCREEN_W - 80, 320),
    borderRadius: 20,
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3, marginBottom: 8 },
  message: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 12 },
  warningBanner: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 20,
  },
  warningText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 10, width: '100%' },
  btn: { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 16, fontWeight: '600', letterSpacing: -0.2 },
})
