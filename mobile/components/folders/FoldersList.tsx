import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Folder as FolderIcon, Plus, AlertCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useFolders } from '@/lib/hooks/useFolders';
import { FolderCard } from './FolderCard';
import type { FolderWithCount } from '@/lib/api/types';

interface FoldersListProps {
  onCreatePress?: (onSuccess?: () => void) => void;
}

export const FoldersList: React.FC<FoldersListProps> = ({ onCreatePress }) => {
  const router = useRouter();
  const { folders, loading, error, fetchFolders } = useFolders();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchFolders();
  }, []);

  // Refresh folders when screen comes into focus (e.g., after creating a folder)
  useFocusEffect(
    React.useCallback(() => {
      fetchFolders();
    }, [fetchFolders])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFolders();
    setRefreshing(false);
  };

  const handleFolderPress = (folder: FolderWithCount) => {
    router.push(`/(home)/folders/${folder.id}`);
  };

  const handleCreatePress = () => {
    if (onCreatePress) {
      // Pass a callback that will be called when folder creation is successful
      onCreatePress(() => {
        fetchFolders();
      });
    }
  };

  const renderFolder = ({ item }: { item: FolderWithCount }) => (
    <FolderCard folder={item} onPress={() => handleFolderPress(item)} />
  );

  const renderEmpty = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading folders...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <View style={styles.errorIconContainer}>
            <AlertCircle size={48} color="#EF4444" />
          </View>
          <Text style={styles.errorTitle}>Error loading folders</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchFolders}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <FolderIcon size={64} color="#D1D5DB" />
        </View>
        <Text style={styles.emptyTitle}>No folders yet</Text>
        <Text style={styles.emptySubtitle}>
          Create your first folder to start organizing your notes
        </Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreatePress}
        >
          <Text style={styles.createButtonText}>Create Folder</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerTitle}>My Folders</Text>
        <Text style={styles.headerSubtitle}>
          Organize your notes into folders
        </Text>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={['#FFFFFF', '#FBF7FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {renderHeader()}

        <FlatList
          data={folders}
          renderItem={renderFolder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            folders.length === 0 && styles.listContentEmpty,
          ]}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#7C3AED"
            />
          }
          showsVerticalScrollIndicator={false}
        />

        {/* FAB - Create Folder Button */}
        {folders.length > 0 && (
          <LinearGradient
            colors={['#7C3AED', '#4F46E5']}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <TouchableOpacity
              style={styles.fab}
              onPress={handleCreatePress}
              accessibilityLabel="Create folder"
            >
              <Plus size={28} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
          </LinearGradient>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    paddingTop: 0,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#6B7280',
  },
  listContent: {
    paddingTop: 20,
    paddingBottom: 120
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorIconContainer: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#7C3AED',
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  createButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    backgroundColor: '#7C3AED',
    borderRadius: 12,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  fabGradient: {
    position: 'absolute',
    right: 20,
    bottom: 60,
    borderRadius: 999,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
