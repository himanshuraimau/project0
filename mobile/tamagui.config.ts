import { config } from '@tamagui/config/v3'
import { createTamagui } from 'tamagui'

// Extend the default config with our custom tokens matching current UI
const appConfig = createTamagui({
  ...config,
  tokens: {
    ...config.tokens,
    color: {
      ...config.tokens.color,
      // Chatbot-specific colors matching current implementation
      background: '#FFFFFF',
      primary: '#7A2EFF',
      text: '#000000',
      textDark: '#222222',
      textLight: '#A0A0A0',
      botBubble: '#F2F2F2',
      userBubble: '#7A2EFF',
      border: '#EAEAEA',
      borderDark: '#333333',
      borderFocus: '#000000',
      buttonBorder: '#D0D0D0',
    },
    space: {
      ...config.tokens.space,
      // Chatbot-specific spacing
      1: 4,
      2: 8,
      3: 12,
      4: 16,
      5: 20,
      6: 24,
    },
    radius: {
      ...config.tokens.radius,
      // Chatbot-specific radii
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
      xxl: 24,
      pill: 999,
    },
    size: {
      ...config.tokens.size,
      // Chatbot-specific sizes
      inputHeight: 44,
      headerHeight: 68,
      backButton: 40,
      sendButton: 36,
    },
  },
})

export type AppConfig = typeof appConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default appConfig
