import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Folder, ChevronRight } from 'lucide-react-native';
import type { FolderWithCount } from '@/lib/api/types';

interface FolderCardProps {
  folder: FolderWithCount;
  onPress: () => void;
}

export const FolderCard: React.FC<FolderCardProps> = ({ folder, onPress }) => {
  const folderColor = folder.color || '#6366f1';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      {/* Folder Icon with Color */}
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: `${folderColor}15` },
        ]}
      >
        <Folder size={32} color={folderColor} />
      </View>

      {/* Folder Info */}
      <View style={styles.contentContainer}>
        <Text style={styles.folderName} numberOfLines={1}>
          {folder.name}
        </Text>
        
        {folder.description && (
          <Text style={styles.folderDescription} numberOfLines={2}>
            {folder.description}
          </Text>
        )}

        <Text style={styles.noteCount}>
          {folder.noteCount} {folder.noteCount === 1 ? 'note' : 'notes'}
        </Text>
      </View>

      {/* Chevron */}
      <View style={styles.chevronContainer}>
        <ChevronRight size={22} color="#9CA3AF" />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginHorizontal: 4,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
    marginRight: 10,
  },
  folderName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  folderDescription: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  noteCount: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  chevronContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
