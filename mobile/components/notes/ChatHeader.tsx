import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

interface ChatHeaderProps {
  onBackPress?: () => void
  title?: string
}

/**
 * ChatHeader component - Static header for the chat interface
 * Positioned outside KeyboardAvoidingView to remain fixed during keyboard interactions
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.5, 7.1
 */
export default function ChatHeader({ 
  onBackPress, 
  title = 'Chat' 
}: ChatHeaderProps) {
  const router = useRouter()

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress()
    } else {
      router.back()
    }
  }

  return (
    <View style={styles.safeArea}>
      <View style={styles.header}>
        {/* Back Button - Circular with border and left-arrow icon */}
        <TouchableOpacity
          onPress={handleBackPress}
          style={styles.backButton}
          accessibilityLabel="Back, button"
          accessibilityRole="button"
        >
          <Feather name="arrow-left" size={20} color="#000000" />
        </TouchableOpacity>

        {/* Centered Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Spacer to balance the header layout */}
        <View style={styles.spacer} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 68, // 64-72px range, using 68px as middle value
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20, // Circular
    borderWidth: 1,
    borderColor: '#D0D0D0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 19, // 18-20px range, using 19px as middle value
    fontWeight: '600', // semibold
    color: '#000000',
    textAlign: 'center',
  },
  spacer: {
    width: 40, // Same width as back button to center the title
    height: 40,
  },
})
