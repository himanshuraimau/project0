import React from 'react'
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

interface BackButtonProps {
  onPress?: () => void
  style?: ViewStyle
  iconColor?: string
  iconSize?: number
}

export default function BackButton({ 
  onPress, 
  style, 
  iconColor = '#000',
  iconSize = 24 
}: BackButtonProps) {
  const router = useRouter()

  const handlePress = () => {
    if (onPress) {
      onPress()
    } else {
      router.back()
    }
  }

  return (
    <TouchableOpacity onPress={handlePress} style={[styles.backButton, style]}>
      <Feather name="arrow-left" size={iconSize} color={iconColor} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.25,
    borderColor: '#E5E7EB',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2, // For Android shadow
  },
})
