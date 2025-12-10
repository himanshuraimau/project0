import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { useFolders } from '@/lib/hooks/useFolders';
import type { Folder } from '@/lib/api/types';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';

interface DeleteFolderDialogProps {
  visible: boolean;
  folder: Folder | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DeleteFolderDialog: React.FC<DeleteFolderDialogProps> = ({
  visible,
  folder,
  onClose,
  onSuccess,
}) => {
  const { deleteFolder, loading } = useFolders();

  const handleDelete = async () => {
    if (!folder) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const success = await deleteFolder(folder.id);

    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: 'success',
        text1: 'Folder Deleted',
        text2: 'Notes have been moved to uncategorized',
      });
      onClose();
      onSuccess?.();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: 'error',
        text1: 'Failed to Delete',
        text2: 'Could not delete folder. Please try again.',
      });
    }
  };

  if (!folder) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.dialog}>
          {/* Warning Icon */}
          <View style={styles.iconContainer}>
            <AlertTriangle size={48} color="#EF4444" />
          </View>

          {/* Title */}
          <Text style={styles.title}>Delete Folder?</Text>

          {/* Message */}
          <Text style={styles.message}>
            Are you sure you want to delete "{folder.name}"? All notes in this
            folder will be moved to uncategorized.
          </Text>

          {/* Note */}
          <View style={styles.noteContainer}>
            <Text style={styles.noteText}>
              This action cannot be undone.
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.deleteButton,
                loading && styles.deleteButtonDisabled,
              ]}
              onPress={handleDelete}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.deleteButtonText}>Delete</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  noteContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  noteText: {
    fontSize: 13,
    color: '#92400E',
    textAlign: 'center',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  deleteButtonDisabled: {
    backgroundColor: '#FCA5A5',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
