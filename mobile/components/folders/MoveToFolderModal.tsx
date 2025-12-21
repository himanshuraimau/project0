import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { X, Folder, Check } from 'lucide-react-native';
import { useFolders } from '@/lib/hooks/useFolders';
import type { Note } from '@/lib/api/types';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';

interface MoveToFolderModalProps {
  visible: boolean;
  note: Note | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const MoveToFolderModal: React.FC<MoveToFolderModalProps> = ({
  visible,
  note,
  onClose,
  onSuccess,
}) => {
  const { folders, fetchFolders, moveNote, loading } = useFolders();

  useEffect(() => {
    if (visible) {
      fetchFolders();
    }
  }, [visible]);

  const handleMoveToFolder = async (folderId: string | null, folderName: string) => {
    if (!note) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const success = await moveNote(note.id, folderId);

    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: 'success',
        text1: 'Note Moved',
        text2: `Moved to ${folderName}`,
      });
      onClose();
      onSuccess?.();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: 'error',
        text1: 'Failed to Move',
        text2: 'Could not move note. Please try again.',
      });
    }
  };

  if (!note) return null;

  const currentFolderId = note.folderId;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <StatusBar backgroundColor="rgba(0, 0, 0, 0.5)" barStyle="light-content" />
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Move to Folder</Text>
              <Text style={styles.subtitle}>Select a folder for this note</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              disabled={loading}
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Folders List */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Uncategorized Option */}
            <TouchableOpacity
              style={[
                styles.folderOption,
                currentFolderId === null && styles.folderOptionSelected,
              ]}
              onPress={() => handleMoveToFolder(null, 'Uncategorized')}
              disabled={loading}
            >
              <View style={styles.folderOptionLeft}>
                <View style={[styles.folderIcon, { backgroundColor: '#E5E7EB' }]}>
                  <Folder size={24} color="#6B7280" />
                </View>
                <View style={styles.folderInfo}>
                  <Text style={styles.folderName}>Uncategorized</Text>
                  <Text style={styles.folderDescription}>
                    Notes without a folder
                  </Text>
                </View>
              </View>
              {currentFolderId === null && (
                <Check size={20} color="#7C3AED" strokeWidth={3} />
              )}
            </TouchableOpacity>

            {/* Folder Options */}
            {folders.map((folder) => {
              const folderColor = folder.color || '#6366f1';
              const isSelected = currentFolderId === folder.id;

              return (
                <TouchableOpacity
                  key={folder.id}
                  style={[
                    styles.folderOption,
                    isSelected && styles.folderOptionSelected,
                  ]}
                  onPress={() => handleMoveToFolder(folder.id, folder.name)}
                  disabled={loading}
                >
                  <View style={styles.folderOptionLeft}>
                    <View
                      style={[
                        styles.folderIcon,
                        { backgroundColor: `${folderColor}15` },
                      ]}
                    >
                      <Folder size={24} color={folderColor} />
                    </View>
                    <View style={styles.folderInfo}>
                      <Text style={styles.folderName}>{folder.name}</Text>
                      {folder.description && (
                        <Text style={styles.folderDescription} numberOfLines={1}>
                          {folder.description}
                        </Text>
                      )}
                      <Text style={styles.folderCount}>
                        {folder.noteCount} {folder.noteCount === 1 ? 'note' : 'notes'}
                      </Text>
                    </View>
                  </View>
                  {isSelected && (
                    <Check size={20} color="#7C3AED" strokeWidth={3} />
                  )}
                </TouchableOpacity>
              );
            })}

            {folders.length === 0 && (
              <View style={styles.emptyContainer}>
                <Folder size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>No folders yet</Text>
                <Text style={styles.emptySubtext}>
                  Create folders to organize your notes
                </Text>
              </View>
            )}
          </ScrollView>

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#7C3AED" />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent', // Let backdrop handle the background
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  closeButton: {
    padding: 4,
    marginLeft: 12,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  folderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  folderOptionSelected: {
    backgroundColor: '#F5F3FF',
    borderColor: '#7C3AED',
  },
  folderOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  folderIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  folderInfo: {
    flex: 1,
  },
  folderName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  folderDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  folderCount: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
