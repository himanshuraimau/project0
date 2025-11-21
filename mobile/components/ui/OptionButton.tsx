import React from 'react'
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native'

interface OptionButtonProps {
  icon: string
  label: string
  iconBg: string
  selected?: boolean
  onPress: () => void
}

export function OptionButton({ icon, label, iconBg, selected = false, onPress }: OptionButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.option, selected && styles.optionSelected]}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        <Text style={styles.optionIcon}>{icon}</Text>
      </View>
      <Text style={styles.optionLabel}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingLeft: 19.99,
    paddingRight: 19.99,
    height: 83.97,
    width: 320,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 0,
  },
  optionSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#FBF7FF',
    borderWidth: 2,
  },
  iconContainer: {
    width: 43.98,
    height: 43.98,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15.99,
  },
  optionIcon: {
    fontSize: 24,
    lineHeight: 32,
    color: '#0A0A0A',
    fontFamily: 'Arimo',
  },
  optionLabel: {
    fontSize: 15,
    lineHeight: 22,
    color: '#000000',
    fontFamily: 'Arimo',
    fontWeight: '400',
    flex: 1,
    flexWrap: 'wrap',
  },
})
