import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useFolders } from '@/lib/hooks/useFolders';
import type { Folder } from '@/lib/api/types';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';

interface EditFolderModalProps {
  visible: boolean;
  folder: Folder | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const FOLDER_COLORS = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Purple', value: '#858dff' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Blue', value: '#3b82f6' },
];

export const EditFolderModal: React.FC<EditFolderModalProps> = ({
  visible,
  folder,
  onClose,
  onSuccess,
}) => {
  const { updateFolder, loading } = useFolders();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0].value);
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setDescription(folder.description || '');
      setSelectedColor(folder.color || FOLDER_COLORS[0].value);
    }
  }, [folder]);

  const handleClose = () => {
    if (!loading) {
      setNameError('');
      onClose();
    }
  };

  const validateName = (text: string): boolean => {
    if (!text.trim()) {
      setNameError('Folder name is required');
      return false;
    }
    if (text.length > 50) {
      setNameError('Folder name must be 50 characters or less');
      return false;
    }
    setNameError('');
    return true;
  };

  const handleNameChange = (text: string) => {
    setName(text);
    if (nameError) {
      validateName(text);
    }
  };

  const handleUpdate = async () => {
    if (!folder) return;

    if (!validateName(name)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (description.length > 200) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Description',
        text2: 'Description must be 200 characters or less',
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const result = await updateFolder(folder.id, {
      name: name.trim(),
      description: description.trim() || undefined,
      color: selectedColor,
    });

    if (result) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: 'success',
        text1: 'Folder Updated',
        text2: `${name} has been updated successfully`,
      });
      handleClose();
      onSuccess?.();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: 'error',
        text1: 'Failed to Update',
        text2: 'Could not update folder. Please try again.',
      });
    }
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  if (!folder) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />
        
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Edit Folder</Text>
              <Text style={styles.subtitle}>
                Update folder details
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              disabled={loading}
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Folder Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Folder Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, nameError ? styles.inputError : null]}
                placeholder="e.g., AI Research, Class Notes, Projects"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={handleNameChange}
                maxLength={50}
                editable={!loading}
              />
              <View style={styles.inputFooter}>
                {nameError ? (
                  <Text style={styles.errorText}>{nameError}</Text>
                ) : null}
                <Text style={styles.charCount}>{name.length}/50</Text>
              </View>
            </View>

            {/* Description Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Brief description of what this folder contains..."
                placeholderTextColor="#9CA3AF"
                value={description}
                onChangeText={setDescription}
                maxLength={200}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!loading}
              />
              <View style={styles.inputFooter}>
                <Text style={styles.charCount}>{description.length}/200</Text>
              </View>
            </View>

            {/* Color Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Folder Color</Text>
              <View style={styles.colorGrid}>
                {FOLDER_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color.value}
                    onPress={() => handleColorSelect(color.value)}
                    disabled={loading}
                    style={[
                      styles.colorButton,
                      { backgroundColor: color.value },
                      selectedColor === color.value && styles.colorButtonSelected,
                    ]}
                    accessibilityLabel={`Select ${color.name} color`}
                  >
                    {selectedColor === color.value && (
                      <View style={styles.colorCheckmark} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button,
                styles.updateButton,
                (loading || !name.trim()) && styles.updateButtonDisabled,
              ]}
              onPress={handleUpdate}
              disabled={loading || !name.trim()}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.updateButtonText}>Update Folder</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
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
    fontSize: 24,
    fontWeight: '500',
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
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111827',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  textArea: {
    height: 80,
    paddingTop: 14,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 'auto',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    flex: 1,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorButtonSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  colorCheckmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 1)',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
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
  updateButton: {
    backgroundColor: '#4f3be7',
  },
  updateButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
