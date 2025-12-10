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
        <Folder size={28} color={folderColor} />
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
        <ChevronRight size={20} color="#9CA3AF" />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 6,
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
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  contentContainer: {
    flex: 1,
    marginRight: 8,
  },
  folderName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  folderDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
    lineHeight: 18,
  },
  noteCount: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  chevronContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
