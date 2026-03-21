import React from 'react'
import {
  ScrollView,
  StyleSheet,
  Pressable,
  View,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useTheme } from '@/lib/hooks/useTheme'
import { neutral } from '@/lib/design-system'
import type { RichTextToolbarProps } from '@/lib/editor/types'
import HeaderSelector from './HeaderSelector'

export default function RichTextToolbar({
  currentBlockType,
  isTitleBlock,
  keyboardHeight,
  onBlockTypeChange,
  onToggleBold,
  onToggleItalic,
  onToggleUnderline,
  onToggleBulletList,
  onToggleOrderedList,
  onSetAlignment,
  isBoldActive,
  isItalicActive,
  isUnderlineActive,
  isBulletListActive,
  isOrderedListActive,
  currentAlignment,
}: RichTextToolbarProps) {
  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'

  const getHeaderLabel = () => {
    switch (currentBlockType) {
      case 'h1': return 'Header 1' as const
      case 'h2': return 'Header 2' as const
      default: return 'Body' as const
    }
  }

  const iconColor = isDark ? neutral[400] : neutral[500]
  const activeColor = c.primary
  const sepColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'

  return (
    <View style={[styles.toolbar, { backgroundColor: isDark ? neutral[950] : '#fff', borderTopColor: sepColor }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate={0}
        snapToAlignment="start"
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        <HeaderSelector
          currentType={getHeaderLabel()}
          onSelect={onBlockTypeChange}
          disabled={isTitleBlock}
        />

        <View style={[styles.separator, { backgroundColor: sepColor }]} />

        <ToolbarButton icon="list" isActive={isBulletListActive} onPress={onToggleBulletList} iconColor={iconColor} activeColor={activeColor} />
        <ToolbarButton icon="hash" isActive={isOrderedListActive} onPress={onToggleOrderedList} iconColor={iconColor} activeColor={activeColor} />

        <View style={[styles.separator, { backgroundColor: sepColor }]} />

        <ToolbarButton icon="align-left" isActive={currentAlignment === 'left'} onPress={() => onSetAlignment('left')} iconColor={iconColor} activeColor={activeColor} />
        <ToolbarButton icon="align-center" isActive={currentAlignment === 'center'} onPress={() => onSetAlignment('center')} iconColor={iconColor} activeColor={activeColor} />
        <ToolbarButton icon="align-right" isActive={currentAlignment === 'right'} onPress={() => onSetAlignment('right')} iconColor={iconColor} activeColor={activeColor} />

        <View style={[styles.separator, { backgroundColor: sepColor }]} />

        <ToolbarButton icon="bold" isActive={isBoldActive} onPress={onToggleBold} iconColor={iconColor} activeColor={activeColor} />
        <ToolbarButton icon="italic" isActive={isItalicActive} onPress={onToggleItalic} iconColor={iconColor} activeColor={activeColor} />
        <ToolbarButton icon="underline" isActive={isUnderlineActive} onPress={onToggleUnderline} iconColor={iconColor} activeColor={activeColor} />
      </ScrollView>
    </View>
  )
}

interface ToolbarButtonProps {
  icon: keyof typeof Feather.glyphMap
  isActive: boolean
  onPress: () => void
  iconColor: string
  activeColor: string
}

function ToolbarButton({ icon, isActive, onPress, iconColor, activeColor }: ToolbarButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.toolbarButton, { opacity: pressed ? 0.5 : 1 }]}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
    >
      <Feather name={icon} size={20} color={isActive ? activeColor : iconColor} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  toolbar: {
    height: 48,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 2,
  },
  toolbarButton: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    width: StyleSheet.hairlineWidth,
    height: 22,
    marginHorizontal: 8,
  },
})
