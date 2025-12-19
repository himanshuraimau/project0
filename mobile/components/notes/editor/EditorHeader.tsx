/**
 * EditorHeader Component
 * Fixed 64px height header with back button, centered title, and save button.
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, LAYOUT } from '@/lib/editor/constants';
import type { EditorHeaderProps } from '@/lib/editor/types';

/**
 * EditorHeader displays a fixed header with navigation and save controls.
 * - 64px fixed height (Requirement 2.1)
 * - White background with 1px bottom border (Requirement 2.1)
 * - Back button 40×40px on left (Requirement 2.2)
 * - "Edit Note" title centered, 18px semibold (Requirement 2.3)
 * - Orange checkmark save button on right (Requirement 2.4)
 */
export default function EditorHeader({
  onBack,
  onSave,
  saving,
}: EditorHeaderProps) {
  return (
    <View style={styles.header}>
      {/* Back Button - 40×40px circular (Requirement 2.2) */}
      <TouchableOpacity
        onPress={onBack}
        style={styles.backButton}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Feather name="arrow-left" size={LAYOUT.iconSize} color={COLORS.black} />
      </TouchableOpacity>

      {/* Centered Title - 18px semibold (Requirement 2.3) */}
      <Text style={styles.title}>Edit Note</Text>

      {/* Save Button - Orange checkmark (Requirement 2.4) */}
      <TouchableOpacity
        onPress={onSave}
        style={styles.saveButton}
        disabled={saving}
        accessibilityLabel={saving ? 'Saving note' : 'Save note'}
        accessibilityRole="button"
      >
        {saving ? (
          <ActivityIndicator size="small" color={COLORS.saveOrange} />
        ) : (
          <Feather name="check" size={LAYOUT.iconSize} color={COLORS.saveOrange} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  /**
   * Header container
   * - 64px fixed height (Requirement 2.1)
   * - White background (Requirement 2.1)
   * - 1px bottom border #EAEAEA (Requirement 2.1)
   */
  header: {
    height: LAYOUT.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.dividerGray,
  },

  /**
   * Back button
   * - 40×40px circular (Requirement 2.2)
   */
  backButton: {
    width: LAYOUT.headerButtonSize,
    height: LAYOUT.headerButtonSize,
    borderRadius: LAYOUT.headerButtonSize / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /**
   * Title text
   * - 18px font size (Requirement 2.3)
   * - Semibold weight (Requirement 2.3)
   * - Black color (Requirement 2.3)
   */
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
  },

  /**
   * Save button
   * - 40×40px circular
   * - Orange checkmark icon (Requirement 2.4)
   */
  saveButton: {
    width: LAYOUT.headerButtonSize,
    height: LAYOUT.headerButtonSize,
    borderRadius: LAYOUT.headerButtonSize / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
