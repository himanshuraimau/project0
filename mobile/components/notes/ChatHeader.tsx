import React from 'react'
import { styled, XStack, YStack, Text } from 'tamagui'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Pressable } from 'react-native'

interface ChatHeaderProps {
  onBackPress?: () => void
  title?: string
}

// Styled components for header
const HeaderContainer = styled(XStack, {
  height: 68,
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: '$4',
  backgroundColor: '$background',
  borderBottomWidth: 1,
  borderBottomColor: '$border',
})

const BackButtonWrapper = styled(Pressable, {
  width: 40,
  height: 40,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: '$buttonBorder',
  backgroundColor: '$background',
  justifyContent: 'center',
  alignItems: 'center',
})

const HeaderTitle = styled(Text, {
  fontSize: 19,
  fontWeight: '600',
  color: '$text',
  textAlign: 'center',
})

const Spacer = styled(YStack, {
  width: 40,
  height: 40,
})

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
    <SafeAreaView edges={['top']} style={{ backgroundColor: '#FFFFFF' }}>
      <HeaderContainer>
        <BackButtonWrapper
          onPress={handleBackPress}
          accessibilityLabel="Back, button"
          accessibilityRole="button"
        >
          <Feather name="arrow-left" size={20} color="#000000" />
        </BackButtonWrapper>

        <HeaderTitle>{title}</HeaderTitle>

        <Spacer />
      </HeaderContainer>
    </SafeAreaView>
  )
}
