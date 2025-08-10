import { tokens } from '@/lib/constants/Colors'
import { useTheme } from '@/lib/hooks/useTheme'
import React, { useMemo, useState } from 'react'
import {
    StyleProp,
    Text,
    TextStyle,
    TouchableOpacity,
    TouchableOpacityProps,
    ViewStyle,
} from 'react-native'

export type UIButtonProps = TouchableOpacityProps & {
  variant?: 'primary' | 'accent' | 'social'
  size?: 'sm' | 'md'
  label: string
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}

export const Button: React.FC<UIButtonProps> = ({
  variant = 'primary',
  size = 'md',
  label,
  style,
  textStyle,
  ...touchableProps
}) => {
  const { mode, theme } = useTheme()
  const base = variant === 'social' ? tokens.socialButton(mode) : tokens.button(mode)
  const [pressed, setPressed] = useState(false)
  const dynamicShadow = useMemo(() => (pressed ? theme.shadow({ offset: 2, opacity: 0.35 }) : {}), [pressed, theme])
  const dynamicBg: ViewStyle | undefined =
    variant === 'social'
      ? undefined
      : (pressed
          ? { backgroundColor: theme.palette.redHover }
          : variant === 'accent'
            ? { backgroundColor: theme.colors.accent }
            : { backgroundColor: theme.colors.primary })

  const sizeOverride: ViewStyle =
    size === 'sm'
      ? { paddingVertical: 6, paddingHorizontal: 12 }
      : { paddingVertical: 12, paddingHorizontal: 22 }
  const containerStyle = [base.container, sizeOverride, dynamicShadow, dynamicBg, style]
  const labelStyle = [
    base.text,
    size === 'sm' ? ({ fontSize: theme.fontSize.sm } as TextStyle) : null,
    textStyle,
  ]

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={containerStyle}
      onPressIn={(e) => {
        setPressed(true)
        touchableProps.onPressIn?.(e)
      }}
      onPressOut={(e) => {
        setPressed(false)
        touchableProps.onPressOut?.(e)
      }}
      {...touchableProps}
    >
      <Text style={labelStyle as any}>{label}</Text>
    </TouchableOpacity>
  )
}

export default Button


