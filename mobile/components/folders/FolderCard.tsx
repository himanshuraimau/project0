import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Folder } from 'lucide-react-native'
import { Feather } from '@expo/vector-icons'
import type { FolderWithCount } from '@/lib/api/types'
import { useTheme } from '@/lib/hooks/useTheme'
import { neutral } from '@/lib/design-system'

interface FolderCardProps {
  folder: FolderWithCount
  onPress: () => void
  isLast?: boolean
}

export const FolderCard: React.FC<FolderCardProps> = ({ folder, onPress, isLast = false }) => {
  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'
  const folderColor = folder.color || '#6366f1'

  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)'
  const cardBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'

  return (
    <View style={[styles.cardWrap, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <Pressable
        style={({ pressed }) => [
          styles.row,
          {
            backgroundColor: pressed
              ? (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)')
              : 'transparent',
          },
        ]}
        onPress={onPress}
      >
        <View style={[styles.iconWrap, { backgroundColor: `${folderColor}18` }]}>
          <Folder size={22} color={folderColor} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: c.foreground }]} numberOfLines={1}>
            {folder.name}
          </Text>
          {folder.description ? (
            <Text style={[styles.desc, { color: c.mutedForeground }]} numberOfLines={1}>
              {folder.description}
            </Text>
          ) : null}
          <Text style={[styles.count, { color: c.mutedForeground }]}>
            {folder.noteCount} {folder.noteCount === 1 ? 'note' : 'notes'}
          </Text>
        </View>
        <Feather name="chevron-right" size={18} color={isDark ? neutral[500] : neutral[400]} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  cardWrap: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  desc: { fontSize: 13, marginBottom: 2 },
  count: { fontSize: 13, fontWeight: '500' },
})
