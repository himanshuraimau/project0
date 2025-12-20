/**
 * HeaderSelector Component
 * Dropdown selector for heading types (Header 1, Header 2, Body).
 * Requirements: 8.3, 10.1
 */

import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, LAYOUT } from '@/lib/editor/constants';
import type { BlockType, HeaderSelectorLabel, HeaderSelectorProps } from '@/lib/editor/types';

/**
 * HeaderSelector displays a dropdown for selecting heading types.
 * - Shows "Header 1", "Header 2", or "Body" based on current block type (Requirement 8.3)
 * - Purple border when active, gray border when inactive (Requirement 8.3)
 * - Disabled when cursor is in title block (Requirement 10.1)
 */
export default function HeaderSelector({
  currentType,
  onSelect,
  disabled,
}: HeaderSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (type: BlockType) => {
    onSelect(type);
    setIsOpen(false);
  };

  const options: { label: HeaderSelectorLabel; type: BlockType }[] = [
    { label: 'Header 1', type: 'h1' },
    { label: 'Header 2', type: 'h2' },
    { label: 'Body', type: 'body' },
  ];

  return (
    <>
      <TouchableOpacity
        onPress={() => !disabled && setIsOpen(true)}
        style={[
          styles.selector,
          isOpen && styles.selectorActive,
          disabled && styles.selectorDisabled,
        ]}
        disabled={disabled}
        accessibilityLabel={`Current format: ${currentType}. ${disabled ? 'Disabled for title block' : 'Tap to change'}`}
        accessibilityRole="button"
        accessibilityState={{ disabled, expanded: isOpen }}
      >
        <Text
          style={[
            styles.selectorText,
            isOpen && styles.selectorTextActive,
            disabled && styles.selectorTextDisabled,
          ]}
        >
          {currentType}
        </Text>
        <Feather
          name="chevron-down"
          size={16}
          color={disabled ? COLORS.borderGray : isOpen ? COLORS.accentPurple : COLORS.darkGray}
        />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setIsOpen(false)}>
          <View style={styles.dropdown}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.type}
                onPress={() => handleSelect(option.type)}
                style={[
                  styles.dropdownItem,
                  currentType === option.label && styles.dropdownItemActive,
                ]}
                accessibilityLabel={option.label}
                accessibilityRole="menuitem"
                accessibilityState={{ selected: currentType === option.label }}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    currentType === option.label && styles.dropdownItemTextActive,
                  ]}
                >
                  {option.label}
                </Text>
                {currentType === option.label && (
                  <Feather name="check" size={16} color={COLORS.accentPurple} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  /**
   * Selector button
   * - Gray border when inactive (Requirement 8.3)
   * - Fixed width to prevent expansion when text changes
   */
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    borderRadius: 6,
    width: 100,
  },

  /**
   * Selector button when active/open
   * - Purple border when active (Requirement 8.3)
   */
  selectorActive: {
    borderColor: COLORS.accentPurple,
  },

  /**
   * Selector button when disabled
   */
  selectorDisabled: {
    opacity: 0.5,
    borderColor: COLORS.borderGray,
  },

  /**
   * Selector text
   */
  selectorText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.darkGray,
  },

  /**
   * Selector text when active
   */
  selectorTextActive: {
    color: COLORS.accentPurple,
  },

  /**
   * Selector text when disabled
   */
  selectorTextDisabled: {
    color: COLORS.borderGray,
  },

  /**
   * Modal overlay
   */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /**
   * Dropdown container
   */
  dropdown: {
    backgroundColor: COLORS.white,
    width: 200,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },

  /**
   * Dropdown item
   */
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.dividerGray,
  },

  /**
   * Dropdown item when active/selected
   */
  dropdownItemActive: {
    backgroundColor: COLORS.sectionBoxBg,
  },

  /**
   * Dropdown item text
   */
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.black,
  },

  /**
   * Dropdown item text when active
   */
  dropdownItemTextActive: {
    color: COLORS.accentPurple,
    fontWeight: '600',
  },
});
