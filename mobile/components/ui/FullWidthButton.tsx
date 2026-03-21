import React from 'react'
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { Sparkles } from 'lucide-react-native'
import { useTheme } from '@/lib/hooks/useTheme'

type Props = {
  onPress: () => void
  disabled?: boolean
  loading?: boolean
  loadingText?: string
  buttonText?: string
  icon?: React.ReactNode
  backgroundColor?: string
  textColor?: string
  style?: any
  textStyle?: any
}

const FullWidthButton: React.FC<Props> = ({
  onPress,
  disabled = false,
  loading = false,
  loadingText = 'Processing...',
  buttonText = 'Generate Notes',
  icon,
  backgroundColor,
  textColor,
  style,
  textStyle,
}) => {
  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'
  const isDisabled = disabled || loading

  const bg = backgroundColor || c.foreground
  const fg = textColor || c.background
  const disabledBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
  const disabledFg = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isDisabled ? disabledBg : bg,
          opacity: isDisabled ? 1 : pressed ? 0.85 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <>
          <ActivityIndicator color={isDisabled ? disabledFg : fg} size="small" style={styles.icon} />
          <Text style={[styles.buttonText, { color: isDisabled ? disabledFg : fg }, textStyle]}>
            {loadingText}
          </Text>
        </>
      ) : (
        <>
          {icon || <Sparkles size={18} color={isDisabled ? disabledFg : fg} style={styles.icon} />}
          <Text style={[styles.buttonText, { color: isDisabled ? disabledFg : fg }, textStyle]}>
            {buttonText}
          </Text>
        </>
      )}
    </Pressable>
  )
}

export default FullWidthButton

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: 52,
    borderRadius: 14,
    marginTop: 16,
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: -0.2,
  },
  icon: {
    marginRight: 8,
  },
})
