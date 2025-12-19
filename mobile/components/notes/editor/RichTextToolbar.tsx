/**
 * RichTextToolbar Component
 * Horizontally scrollable toolbar with formatting controls.
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.6, 8.7
 */

import React from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, LAYOUT } from '@/lib/editor/constants';
import type { RichTextToolbarProps } from '@/lib/editor/types';
import HeaderSelector from './HeaderSelector';

/**
 * RichTextToolbar displays a horizontally scrollable toolbar with formatting controls.
 * - 48px height with white background and top border (Requirement 8.1)
 * - Horizontal scroll without momentum/snap (Requirement 8.2)
 * - Header selector showing current block type (Requirement 8.3)
 * - Formatting buttons with context-aware state (Requirement 8.4, 8.6, 8.7)
 */
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
  // Determine header selector label based on current block type
  const getHeaderLabel = () => {
    switch (currentBlockType) {
      case 'h1':
        return 'Header 1' as const;
      case 'h2':
        return 'Header 2' as const;
      default:
        return 'Body' as const;
    }
  };

  return (
    <View style={styles.toolbar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate={0}
        snapToAlignment="start"
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Selector (Requirement 8.3) */}
        <HeaderSelector
          currentType={getHeaderLabel()}
          onSelect={onBlockTypeChange}
          disabled={isTitleBlock}
        />

        {/* Separator */}
        <View style={styles.separator} />

        {/* Bullet List Button (Requirement 8.6) */}
        <ToolbarButton
          icon="list"
          isActive={isBulletListActive}
          onPress={onToggleBulletList}
          accessibilityLabel="Bullet list"
        />

        {/* Numbered List Button (Requirement 8.6) */}
        <ToolbarButton
          icon="hash"
          isActive={isOrderedListActive}
          onPress={onToggleOrderedList}
          accessibilityLabel="Numbered list"
        />

        {/* Separator */}
        <View style={styles.separator} />

        {/* Alignment Buttons (Requirement 8.6) */}
        <ToolbarButton
          icon="align-left"
          isActive={currentAlignment === 'left'}
          onPress={() => onSetAlignment('left')}
          accessibilityLabel="Align left"
        />
        <ToolbarButton
          icon="align-center"
          isActive={currentAlignment === 'center'}
          onPress={() => onSetAlignment('center')}
          accessibilityLabel="Align center"
        />
        <ToolbarButton
          icon="align-right"
          isActive={currentAlignment === 'right'}
          onPress={() => onSetAlignment('right')}
          accessibilityLabel="Align right"
        />

        {/* Separator */}
        <View style={styles.separator} />

        {/* Bold Button (Requirement 8.6) */}
        <ToolbarButton
          icon="bold"
          isActive={isBoldActive}
          onPress={onToggleBold}
          accessibilityLabel="Bold"
        />

        {/* Italic Button (Requirement 8.6) */}
        <ToolbarButton
          icon="italic"
          isActive={isItalicActive}
          onPress={onToggleItalic}
          accessibilityLabel="Italic"
        />

        {/* Underline Button (Requirement 8.6) */}
        <ToolbarButton
          icon="underline"
          isActive={isUnderlineActive}
          onPress={onToggleUnderline}
          accessibilityLabel="Underline"
        />
      </ScrollView>
    </View>
  );
}

/**
 * Individual toolbar button component.
 * - 24×24px icons with 44×44px touch targets (Requirement 8.7)
 * - Purple highlight when active (Requirement 8.4)
 */
interface ToolbarButtonProps {
  icon: keyof typeof Feather.glyphMap;
  isActive: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}

function ToolbarButton({
  icon,
  isActive,
  onPress,
  accessibilityLabel,
}: ToolbarButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.toolbarButton}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
    >
      <Feather
        name={icon}
        size={LAYOUT.iconSize}
        color={isActive ? COLORS.accentPurple : COLORS.darkGray}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  /**
   * Toolbar container
   * - 48px height (Requirement 8.1)
   * - White background (Requirement 8.1)
   * - Top border #EAEAEA (Requirement 8.1)
   * Note: Position is handled by parent Animated.View in EditView
   */
  toolbar: {
    height: LAYOUT.toolbarHeight,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.dividerGray,
  },

  /**
   * Scroll content container
   * - Horizontal layout with padding
   */
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 4,
  },

  /**
   * Toolbar button
   * - 44×44px touch target (Requirement 8.7)
   * - Proper spacing between buttons
   */
  toolbarButton: {
    width: LAYOUT.touchTargetSize,
    height: LAYOUT.touchTargetSize,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },

  /**
   * Separator between button groups
   */
  separator: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.dividerGray,
    marginHorizontal: 12,
  },
});
