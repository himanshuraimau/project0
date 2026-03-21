import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { Folder as FolderIcon } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { useFolders } from '@/lib/hooks/useFolders'
import { FolderCard } from './FolderCard'
import type { FolderWithCount } from '@/lib/api/types'
import { useTheme } from '@/lib/hooks/useTheme'
import { neutral } from '@/lib/design-system'

interface FoldersListProps {
  onCreatePress?: (onSuccess?: () => void) => void
}

export const FoldersList: React.FC<FoldersListProps> = ({ onCreatePress }) => {
  const router = useRouter()
  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'
  const { folders, loading, error, fetchFolders } = useFolders()
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { fetchFolders() }, [])

  useFocusEffect(
    React.useCallback(() => { fetchFolders() }, [fetchFolders])
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchFolders()
    setRefreshing(false)
  }

  const handleFolderPress = (folder: FolderWithCount) => {
    router.push(`/(home)/folders/${folder.id}`)
  }

  const handleCreatePress = () => {
    onCreatePress?.(() => fetchFolders())
  }

  const cardBg = isDark ? neutral[900] : '#fff'
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
  const separatorColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'

  const renderFolder = ({ item, index }: { item: FolderWithCount; index: number }) => (
    <FolderCard
      folder={item}
      onPress={() => handleFolderPress(item)}
      isLast={index === folders.length - 1}
    />
  )

  const renderEmpty = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.stateWrap}>
          <ActivityIndicator size="large" color={c.primary} />
          <Text style={[styles.stateText, { color: c.mutedForeground }]}>Loading folders...</Text>
        </View>
      )
    }
    if (error) {
      return (
        <View style={styles.stateWrap}>
          <Feather name="alert-circle" size={44} color={c.destructive} />
          <Text style={[styles.stateTitle, { color: c.foreground }]}>Error loading folders</Text>
          <Text style={[styles.stateText, { color: c.mutedForeground }]}>{error}</Text>
          <Pressable style={[styles.retryBtn, { backgroundColor: c.primary }]} onPress={fetchFolders}>
            <Text style={[styles.retryText, { color: c.primaryForeground }]}>Try Again</Text>
          </Pressable>
        </View>
      )
    }
    return (
      <View style={styles.stateWrap}>
        <View style={[styles.emptyIcon, { backgroundColor: isDark ? neutral[800] : 'rgba(0,0,0,0.04)' }]}>
          <FolderIcon size={40} color={isDark ? neutral[600] : neutral[300]} />
        </View>
        <Text style={[styles.stateTitle, { color: c.foreground }]}>No folders yet</Text>
        <Text style={[styles.stateText, { color: c.mutedForeground }]}>
          Create your first folder to organize your notes
        </Text>
        <Pressable
          style={[styles.retryBtn, { backgroundColor: c.foreground }]}
          onPress={handleCreatePress}
        >
          <Text style={[styles.retryText, { color: c.background }]}>Create Folder</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? neutral[950] : '#f0f0f0' }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
          >
            <Feather name="arrow-left" size={24} color={c.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: c.foreground }]}>My Folders</Text>
          <View style={{ width: 24 }} />
        </View>

        <FlatList
          data={folders}
          renderItem={renderFolder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            folders.length === 0 && styles.listContentEmpty,
          ]}
          ListHeaderComponent={
            folders.length > 0 ? (
              <Text style={[styles.countLabel, { color: c.mutedForeground }]}>
                {folders.length} {folders.length === 1 ? 'FOLDER' : 'FOLDERS'}
              </Text>
            ) : null
          }
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />
          }
          showsVerticalScrollIndicator={false}
        />

        {/* FAB */}
        {folders.length > 0 && (
          <Pressable
            style={({ pressed }) => [
              styles.fab,
              {
                backgroundColor: c.foreground,
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              },
            ]}
            onPress={handleCreatePress}
          >
            <Feather name="plus" size={22} color={c.background} />
          </Pressable>
        )}
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', letterSpacing: -0.3 },

  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },
  listContentEmpty: { flexGrow: 1 },

  countLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },

  stateWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  stateTitle: { marginTop: 16, fontSize: 20, fontWeight: '600', textAlign: 'center' },
  stateText: { marginTop: 8, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtn: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  retryText: { fontSize: 16, fontWeight: '600' },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'android' ? 24 : 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
})
