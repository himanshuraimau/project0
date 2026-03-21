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
import { neutral } from '@/lib/design-system'

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

  const handleButtonPress = (button: AlertButton) => {
    onClose()
    if (button.onPress) {
      button.onPress()
    }
  }

  const alertButtons: AlertButton[] =
    buttons.length > 0 ? buttons : [{ text: 'OK', style: 'default' }]

  const isDestructiveAlert = alertButtons.some((b) => b.style === 'destructive')
  const cardBg = isDark ? neutral[800] : '#fff'
  const separatorColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          {/* Icon */}
          {isDestructiveAlert && (
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(255,59,48,0.1)' }]}>
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
              // Side-by-side layout for 2 buttons (cancel + action)
              <View style={styles.buttonRow}>
                {alertButtons.map((button, index) => {
                  const isCancel = button.style === 'cancel'
                  const isDestructive = button.style === 'destructive'
                  return (
                    <Pressable
                      key={index}
                      style={({ pressed }) => [
                        styles.btn,
                        styles.btnHalf,
                        isCancel && {
                          backgroundColor: isDark
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(0,0,0,0.04)',
                        },
                        isDestructive && { backgroundColor: '#FF3B30' },
                        !isCancel && !isDestructive && { backgroundColor: c.primary },
                        { opacity: pressed ? 0.8 : 1 },
                      ]}
                      onPress={() => handleButtonPress(button)}
                    >
                      <Text
                        style={[
                          styles.btnText,
                          isCancel && { color: c.foreground },
                          isDestructive && { color: '#fff' },
                          !isCancel && !isDestructive && { color: c.primaryForeground },
                        ]}
                      >
                        {button.text}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            ) : (
              // Stacked layout for 1 or 3+ buttons
              <View style={styles.buttonStack}>
                {alertButtons.map((button, index) => {
                  const isCancel = button.style === 'cancel'
                  const isDestructive = button.style === 'destructive'
                  return (
                    <Pressable
                      key={index}
                      style={({ pressed }) => [
                        styles.btn,
                        isCancel && {
                          backgroundColor: isDark
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(0,0,0,0.04)',
                        },
                        isDestructive && { backgroundColor: '#FF3B30' },
                        !isCancel && !isDestructive && { backgroundColor: c.primary },
                        { opacity: pressed ? 0.8 : 1 },
                      ]}
                      onPress={() => handleButtonPress(button)}
                    >
                      <Text
                        style={[
                          styles.btnText,
                          isCancel && { color: c.foreground },
                          isDestructive && { color: '#fff' },
                          !isCancel && !isDestructive && { color: c.primaryForeground },
                        ]}
                      >
                        {button.text}
                      </Text>
                    </Pressable>
                  )
                })}
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  card: {
    width: Math.min(SCREEN_W - 80, 320),
    borderRadius: 20,
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
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
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
})
