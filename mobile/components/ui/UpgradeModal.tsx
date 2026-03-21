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
import { Feather } from '@expo/vector-icons'
import { useTheme } from '@/lib/hooks/useTheme'
import { neutral } from '@/lib/design-system'

interface UpgradeModalProps {
  visible: boolean
  onClose: () => void
  onUpgrade: () => void
}

const FEATURES = [
  { icon: 'cloud-upload' as const, text: 'Unlimited PDF uploads, audio hours, and YouTube videos' },
  { icon: 'sparkles' as const, text: 'Smarter notes, flashcards, quizzes, and mind maps' },
  { icon: 'flash' as const, text: 'Faster AI edits and generation' },
  { icon: 'chatbubble-ellipses' as const, text: 'Unlimited chat with notes and podcast summaries' },
]

export default function UpgradeModal({ visible, onClose, onUpgrade }: UpgradeModalProps) {
  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'

  const cardBg = isDark ? neutral[800] : '#fff'
  const featureBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          {/* Close */}
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={({ pressed }) => [
              styles.closeBtn,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                opacity: pressed ? 0.5 : 1,
              },
            ]}
          >
            <Feather name="x" size={16} color={c.mutedForeground} />
          </Pressable>

          {/* Title */}
          <Text style={[styles.title, { color: c.foreground }]}>Upgrade to Premium</Text>
          <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
            {"Flinote is "}
            <Text style={{ color: c.primary, fontStyle: 'italic' }}>faster</Text>
            {", "}
            <Text style={{ color: c.primary, fontStyle: 'italic' }}>smarter</Text>
            {", and "}
            <Text style={{ color: c.primary, fontStyle: 'italic' }}>unlimited</Text>
            {" with Pro."}
          </Text>

          {/* Features */}
          <View style={styles.featuresList}>
            {FEATURES.map((feat, idx) => (
              <View key={idx} style={[styles.featureRow, { backgroundColor: featureBg }]}>
                <View style={[styles.featureIcon, { backgroundColor: isDark ? 'rgba(79,59,231,0.12)' : 'rgba(79,59,231,0.08)' }]}>
                  <Ionicons name={feat.icon} size={16} color={c.primary} />
                </View>
                <Text style={[styles.featureText, { color: c.foreground }]}>{feat.text}</Text>
              </View>
            ))}
          </View>

          {/* Buttons */}
          <Pressable
            style={({ pressed }) => [
              styles.upgradeBtn,
              { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={onUpgrade}
          >
            <Ionicons name="diamond" size={16} color={c.primaryForeground} />
            <Text style={[styles.upgradeBtnText, { color: c.primaryForeground }]}>
              Upgrade Now
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.cancelBtn,
              { opacity: pressed ? 0.5 : 1 },
            ]}
            onPress={onClose}
          >
            <Text style={[styles.cancelBtnText, { color: c.mutedForeground }]}>Maybe later</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const { width: SCREEN_W } = Dimensions.get('window')

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: Math.min(SCREEN_W - 56, 380),
    borderRadius: 24,
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 16,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 22,
  },

  featuresList: { gap: 8, marginBottom: 24 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  featureIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19,
  },

  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 16,
    gap: 8,
    marginBottom: 10,
  },
  upgradeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
})
