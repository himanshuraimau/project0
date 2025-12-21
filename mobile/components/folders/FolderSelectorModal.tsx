import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Folder as FolderIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { foldersApi } from '@/lib/api';
import type { FolderWithCount } from '@/lib/api/types';
import { useAlert } from '@/lib/contexts/AlertContext';

interface FolderSelectorModalProps {
    visible: boolean;
    onClose: () => void;
    noteId: string;
    currentFolderId?: string | null;
    onFolderSelected?: () => void;
}

export default function FolderSelectorModal({
    visible,
    onClose,
    noteId,
    currentFolderId,
    onFolderSelected,
}: FolderSelectorModalProps) {
    const { t } = useTranslation();
    const { showAlert } = useAlert();
    const insets = useSafeAreaInsets();
    const [folders, setFolders] = useState<FolderWithCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [newFolderColor, setNewFolderColor] = useState('#7C3AED');
    const [creating, setCreating] = useState(false);

    const folderColors = [
        '#7C3AED', '#EC4899', '#F59E0B', '#10B981',
        '#3B82F6', '#8B5CF6', '#EF4444', '#14B8A6'
    ];

    useEffect(() => {
        if (visible) {
            fetchFolders();
        }
    }, [visible]);

    const fetchFolders = async () => {
        try {
            setLoading(true);
            const fetchedFolders = await foldersApi.getFolders();
            setFolders(fetchedFolders || []);
        } catch (error: any) {
            console.error('Failed to fetch folders:', error);
            showAlert(t('common.error'), error.message || t('folders.failedToLoad'));
        } finally {
            setLoading(false);
        }
    };

    const handleSelectFolder = async (folderId: string | null) => {
        try {
            setSaving(true);
            await foldersApi.moveNoteToFolder(noteId, folderId);

            const folderName = folderId
                ? folders.find(f => f.id === folderId)?.name
                : t('folders.uncategorized');

            showAlert(
                t('folders.noteMoved'),
                t('folders.movedTo', { folderName })
            );

            onFolderSelected?.();
            onClose();
        } catch (error: any) {
            console.error('Failed to move note:', error);
            showAlert(t('common.error'), error.message || t('folders.failedToMove'));
        } finally {
            setSaving(false);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) {
            showAlert(t('common.error'), t('folders.nameRequired'));
            return;
        }

        try {
            setCreating(true);
            const newFolder = await foldersApi.createFolder({
                name: newFolderName.trim(),
                color: newFolderColor,
            });

            // Add to folders list
            setFolders(prev => [...prev, { ...newFolder, noteCount: 0 }]);

            // Automatically select the new folder
            await handleSelectFolder(newFolder.id);

            // Reset form
            setNewFolderName('');
            setNewFolderColor('#7C3AED');
            setShowCreateForm(false);
        } catch (error: any) {
            console.error('Failed to create folder:', error);
            showAlert(t('common.error'), error.message || t('folders.failedToCreate'));
        } finally {
            setCreating(false);
        }
    };

    const filteredFolders = folders.filter(folder =>
        folder.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            {/* Full screen backdrop with solid background */}
            <Pressable style={styles.overlay} onPress={onClose}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardAvoidingView}
                >
                    {/* Modal content - prevent close on tap */}
                    <Pressable
                        style={[
                            styles.modalContainer,
                            { paddingBottom: Math.max(insets.bottom, 20) }
                        ]}
                        onPress={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.headerLeft}>
                                <FolderIcon size={24} color="#7C3AED" />
                                <Text style={styles.title}>{t('folders.moveToFolder')}</Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Feather name="x" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        {/* Search */}
                        <View style={styles.searchContainer}>
                            <Feather name="search" size={16} color="#9CA3AF" style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder={t('common.search')}
                                placeholderTextColor="#9CA3AF"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <Feather name="x" size={16} color="#9CA3AF" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Folders List */}
                        <ScrollView style={styles.foldersList} showsVerticalScrollIndicator={false}>
                            {loading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color="#7C3AED" />
                                </View>
                            ) : (
                                <>
                                    {/* No Folder Option */}
                                    <TouchableOpacity
                                        style={[
                                            styles.folderItem,
                                            currentFolderId === null && styles.folderItemSelected,
                                        ]}
                                        onPress={() => handleSelectFolder(null)}
                                        disabled={saving}
                                    >
                                        <View style={[styles.folderIcon, { backgroundColor: '#F3F4F6' }]}>
                                            <Feather name="inbox" size={20} color="#6B7280" />
                                        </View>
                                        <View style={styles.folderInfo}>
                                            <Text style={styles.folderName}>{t('folders.uncategorized')}</Text>
                                            <Text style={styles.folderDescription}>
                                                {t('folders.notesWithoutFolder')}
                                            </Text>
                                        </View>
                                        {currentFolderId === null && (
                                            <Feather name="check" size={20} color="#7C3AED" />
                                        )}
                                    </TouchableOpacity>

                                    {/* User Folders */}
                                    {filteredFolders.map((folder) => (
                                        <TouchableOpacity
                                            key={folder.id}
                                            style={[
                                                styles.folderItem,
                                                currentFolderId === folder.id && styles.folderItemSelected,
                                            ]}
                                            onPress={() => handleSelectFolder(folder.id)}
                                            disabled={saving}
                                        >
                                            <View
                                                style={[
                                                    styles.folderIcon,
                                                    { backgroundColor: `${folder.color || '#7C3AED'}15` },
                                                ]}
                                            >
                                                <FolderIcon size={20} color={folder.color || '#7C3AED'} />
                                            </View>
                                            <View style={styles.folderInfo}>
                                                <Text style={styles.folderName}>{folder.name}</Text>
                                                <Text style={styles.folderCount}>
                                                    {folder.noteCount} {folder.noteCount === 1 ? t('folders.note') : t('folders.notes')}
                                                </Text>
                                            </View>
                                            {currentFolderId === folder.id && (
                                                <Feather name="check" size={20} color="#7C3AED" />
                                            )}
                                        </TouchableOpacity>
                                    ))}

                                    {/* Create New Folder Button */}
                                    {!showCreateForm && (
                                        <TouchableOpacity
                                            style={styles.createFolderButton}
                                            onPress={() => setShowCreateForm(true)}
                                            disabled={saving}
                                        >
                                            <View style={styles.createFolderIcon}>
                                                <Feather name="plus" size={20} color="#7C3AED" />
                                            </View>
                                            <Text style={styles.createFolderText}>
                                                {t('folders.createFolder')}
                                            </Text>
                                        </TouchableOpacity>
                                    )}

                                    {/* Create Folder Form */}
                                    {showCreateForm && (
                                        <View style={styles.createForm}>
                                            <Text style={styles.createFormTitle}>Create New Folder</Text>

                                            <TextInput
                                                style={styles.createInput}
                                                placeholder="Folder name"
                                                placeholderTextColor="#9CA3AF"
                                                value={newFolderName}
                                                onChangeText={setNewFolderName}
                                                autoFocus
                                            />

                                            {/* Color Picker */}
                                            <Text style={styles.colorLabel}>Color</Text>
                                            <View style={styles.colorPicker}>
                                                {folderColors.map((color) => (
                                                    <TouchableOpacity
                                                        key={color}
                                                        style={[
                                                            styles.colorOption,
                                                            { backgroundColor: color },
                                                            newFolderColor === color && styles.colorOptionSelected,
                                                        ]}
                                                        onPress={() => setNewFolderColor(color)}
                                                    >
                                                        {newFolderColor === color && (
                                                            <Feather name="check" size={16} color="#FFFFFF" />
                                                        )}
                                                    </TouchableOpacity>
                                                ))}
                                            </View>

                                            {/* Form Actions */}
                                            <View style={styles.formActions}>
                                                <TouchableOpacity
                                                    style={styles.cancelButton}
                                                    onPress={() => {
                                                        setShowCreateForm(false);
                                                        setNewFolderName('');
                                                        setNewFolderColor('#7C3AED');
                                                    }}
                                                    disabled={creating}
                                                >
                                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={styles.createButton}
                                                    onPress={handleCreateFolder}
                                                    disabled={creating || !newFolderName.trim()}
                                                >
                                                    {creating ? (
                                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                                    ) : (
                                                        <Text style={styles.createButtonText}>Create & Select</Text>
                                                    )}
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    )}

                                    {filteredFolders.length === 0 && !loading && !showCreateForm && (
                                        <View style={styles.emptyContainer}>
                                            <Text style={styles.emptyText}>
                                                {searchQuery ? t('folders.noFoldersFound') : t('folders.noFoldersYet')}
                                            </Text>
                                        </View>
                                    )}
                                </>
                            )}
                        </ScrollView>

                        {/* Loading Overlay */}
                        {saving && (
                            <View style={styles.savingOverlay}>
                                <ActivityIndicator size="large" color="#7C3AED" />
                                <Text style={styles.savingText}>{t('common.loading')}</Text>
                            </View>
                        )}
                    </Pressable>
                </KeyboardAvoidingView>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    keyboardAvoidingView: {
        width: '100%',
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 24,
        paddingHorizontal: 24,
        maxHeight: '85%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    closeButton: {
        padding: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#111827',
        padding: 0,
    },
    foldersList: {
        maxHeight: 400,
    },
    loadingContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    folderItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: '#F9FAFB',
    },
    folderItemSelected: {
        backgroundColor: '#F3E8FF',
        borderWidth: 1,
        borderColor: '#7C3AED',
    },
    folderIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    folderInfo: {
        flex: 1,
    },
    folderName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    folderDescription: {
        fontSize: 12,
        color: '#6B7280',
    },
    folderCount: {
        fontSize: 12,
        color: '#6B7280',
    },
    emptyContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    savingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    savingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
    },
    createFolderButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: '#F3E8FF',
        borderWidth: 1,
        borderColor: '#E9D5FF',
        borderStyle: 'dashed',
    },
    createFolderIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        backgroundColor: '#FFFFFF',
    },
    createFolderText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#7C3AED',
    },
    createForm: {
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    createFormTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
    },
    createInput: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#111827',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 12,
    },
    colorLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 8,
    },
    colorPicker: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 16,
    },
    colorOption: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    colorOptionSelected: {
        borderWidth: 3,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    formActions: {
        flexDirection: 'row',
        gap: 10,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    createButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#7C3AED',
        alignItems: 'center',
    },
    createButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
