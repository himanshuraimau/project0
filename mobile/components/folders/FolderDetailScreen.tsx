import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Folder as FolderIcon,
  Edit2,
  Trash2,
  FileText,
  AlertCircle,
} from 'lucide-react-native';
import { useFolders } from '@/lib/hooks/useFolders';
import { notesApi } from '@/lib/api';
import type { Folder, Note } from '@/lib/api/types';
import { EditFolderModal } from './EditFolderModal';
import { DeleteFolderDialog } from './DeleteFolderDialog';
import { getTranslatedNote } from '@/lib/utils/translation';

interface FolderDetailScreenProps {
  folderId: string;
}

export const FolderDetailScreen: React.FC<FolderDetailScreenProps> = ({
  folderId,
}) => {
  const router = useRouter();
  const { fetchFolder, loading, error } = useFolders();
  const [folder, setFolder] = useState<Folder | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    loadFolderData();
  }, [folderId]);

  const loadFolderData = async () => {
    const folderData = await fetchFolder(folderId, true);
    if (folderData) {
      setFolder(folderData);
      await loadNotes();
    }
  };

  const loadNotes = async () => {
    setLoadingNotes(true);
    try {
      const allNotes = await notesApi.getNotes();
      const folderNotes = allNotes.filter((note) => note.folderId === folderId);
      setNotes(folderNotes);
    } catch (err) {
      console.error('Error loading notes:', err);
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleDeleteSuccess = () => {
    router.back();
  };

  const handleNotePress = (note: Note) => {
    router.push(`/notes/${note.id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderNote = ({ item }: { item: Note }) => {
    const { title } = getTranslatedNote(item);
    return (
      <Pressable
        style={({ pressed }) => [
          styles.noteCard,
          pressed && styles.noteCardPressed,
        ]}
        onPress={() => handleNotePress(item)}
      >
        <View style={styles.noteLeftIcon}>
          <FileText size={20} color="#6B7280" />
        </View>
        <View style={styles.noteBody}>
          <Text numberOfLines={2} style={styles.noteTitle}>
            {title}
          </Text>
          <Text style={styles.noteDate}>{formatDate(item.createdAt)}</Text>
        </View>
      </Pressable>
    );
  };

  if (loading && !folder) {
    return (
      <LinearGradient
        colors={['#F9FAFB', '#FFFFFF']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Loading folder...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (error || !folder) {
    return (
      <LinearGradient
        colors={['#F9FAFB', '#FFFFFF']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <AlertCircle size={48} color="#EF4444" />
            <Text style={styles.errorTitle}>Error loading folder</Text>
            <Text style={styles.errorMessage}>{error || 'Folder not found'}</Text>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const folderColor = folder.color || '#6366f1';

  return (
    <LinearGradient
      colors={['#F9FAFB', '#FFFFFF']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backIconButton}>
            <ChevronLeft size={24} color="#374151" />
          </TouchableOpacity>
          
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => setShowEditModal(true)}
              style={styles.headerActionButton}
            >
              <Edit2 size={20} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowDeleteDialog(true)}
              style={styles.headerActionButton}
            >
              <Trash2 size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Folder Info */}
        <View style={styles.folderInfo}>
          <View
            style={[
              styles.folderIconContainer,
              { backgroundColor: `${folderColor}15` },
            ]}
          >
            <FolderIcon size={40} color={folderColor} />
          </View>
          
          <Text style={styles.folderName}>{folder.name}</Text>
          
          {folder.description && (
            <Text style={styles.folderDescription}>{folder.description}</Text>
          )}
          
          <Text style={styles.noteCount}>
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </Text>
        </View>

        {/* Notes List */}
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Notes in this folder</Text>
          
          {loadingNotes ? (
            <View style={styles.loadingNotesContainer}>
              <ActivityIndicator size="small" color="#7C3AED" />
              <Text style={styles.loadingNotesText}>Loading notes...</Text>
            </View>
          ) : notes.length === 0 ? (
            <View style={styles.emptyNotesContainer}>
              <FileText size={48} color="#D1D5DB" />
              <Text style={styles.emptyNotesTitle}>No notes yet</Text>
              <Text style={styles.emptyNotesSubtitle}>
                Create notes and move them to this folder
              </Text>
            </View>
          ) : (
            <FlatList
              data={notes}
              renderItem={renderNote}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.notesList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </SafeAreaView>

      {/* Edit Modal */}
      <EditFolderModal
        visible={showEditModal}
        folder={folder}
        onClose={() => setShowEditModal(false)}
        onSuccess={loadFolderData}
      />

      {/* Delete Dialog */}
      <DeleteFolderDialog
        visible={showDeleteDialog}
        folder={folder}
        onClose={() => setShowDeleteDialog(false)}
        onSuccess={handleDeleteSuccess}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backIconButton: {
    padding: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerActionButton: {
    padding: 8,
  },
  folderInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  folderIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  folderName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  folderDescription: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  noteCount: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  notesSection: {
    flex: 1,
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  notesList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  noteCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  noteLeftIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  noteBody: {
    flex: 1,
  },
  noteTitle: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
  noteDate: {
    color: '#6B7280',
    fontSize: 13,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  loadingNotesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingNotesText: {
    fontSize: 15,
    color: '#6B7280',
  },
  emptyNotesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyNotesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyNotesSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#7C3AED',
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
