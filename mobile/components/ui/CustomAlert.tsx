import React from 'react'
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/lib/hooks/useTheme'

interface AlertButton {
  text: string
  onPress?: () => void
  style?: 'default' | 'cancel' | 'destructive'
}

interface CustomAlertProps {
  visible: boolean
  title?: string
  message?: string
  buttons?: AlertButton[]
  onClose: () => void
}

export default function CustomAlert({
  visible,
  title,
  message,
  buttons = [],
  onClose,
}: CustomAlertProps) {
  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'

  // Liquid glass
  const cardBg = isDark ? 'rgba(30,30,35,0.92)' : 'rgba(255,255,255,0.92)'
  const cardBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'

  const handleButtonPress = (button: AlertButton) => {
    onClose()
    if (button.onPress) {
      button.onPress()
    }
  }

  const alertButtons: AlertButton[] =
    buttons.length > 0 ? buttons : [{ text: 'OK', style: 'default' }]

  const isDestructiveAlert = alertButtons.some((b) => b.style === 'destructive')

  const renderButton = (button: AlertButton, index: number, isHalf = false) => {
    const isCancel = button.style === 'cancel'
    const isDestructive = button.style === 'destructive'

    return (
      <Pressable
        key={index}
        style={({ pressed }) => [
          styles.btn,
          isHalf && styles.btnHalf,
          {
            backgroundColor: isCancel
              ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)')
              : isDestructive
                ? '#FF3B30'
                : c.primary,
            transform: [{ scale: pressed ? 0.97 : 1 }],
          },
        ]}
        onPress={() => handleButtonPress(button)}
      >
        <Text
          style={[
            styles.btnText,
            {
              color: isCancel ? c.foreground : '#fff',
            },
          ]}
        >
          {button.text}
        </Text>
      </Pressable>
    )
  }

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: cardBg,
              borderColor: cardBorder,
            },
          ]}
        >
          {/* Icon */}
          {isDestructiveAlert && (
            <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(255,59,48,0.12)' : 'rgba(255,59,48,0.08)' }]}>
              <Ionicons name="warning" size={24} color="#FF3B30" />
            </View>
          )}

          {/* Title */}
          {title && (
            <Text style={[styles.title, { color: c.foreground }]}>{title}</Text>
          )}

          {/* Message */}
          {message && (
            <Text style={[styles.message, { color: c.mutedForeground }]}>{message}</Text>
          )}

          {/* Buttons */}
          <View style={styles.buttonArea}>
            {alertButtons.length === 2 ? (
              <View style={styles.buttonRow}>
                {alertButtons.map((button, index) => renderButton(button, index, true))}
              </View>
            ) : (
              <View style={styles.buttonStack}>
                {alertButtons.map((button, index) => renderButton(button, index))}
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  )
}

const { width: SCREEN_W } = Dimensions.get('window')

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  card: {
    width: Math.min(SCREEN_W - 80, 320),
    borderRadius: 22,
    borderWidth: 1,
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 16,
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 4,
  },
  buttonArea: {
    width: '100%',
    marginTop: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  buttonStack: {
    gap: 10,
  },
  btn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnHalf: {
    flex: 1,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
})
