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
} from 'react-native';
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
    const [folders, setFolders] = useState<FolderWithCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

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

    const filteredFolders = folders.filter(folder =>
        folder.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
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

                                {filteredFolders.length === 0 && !loading && (
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
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '80%',
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
});
