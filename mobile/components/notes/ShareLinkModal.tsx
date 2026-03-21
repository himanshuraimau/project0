import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather, Ionicons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import { useTranslation } from 'react-i18next'
import { notesApi } from '@/lib/api'
import { useAlert } from '@/lib/contexts/AlertContext'
import { CreateShareLinkResponse } from '@/lib/api/types'
import { useTheme } from '@/lib/hooks/useTheme'
import { neutral } from '@/lib/design-system'

interface ShareLinkModalProps {
  visible: boolean
  onClose: () => void
  noteId: string
  noteTitle: string
}

export default function ShareLinkModal({
  visible,
  onClose,
  noteId,
  noteTitle,
}: ShareLinkModalProps) {
  const { t } = useTranslation()
  const { showAlert } = useAlert()
  const { theme, mode } = useTheme()
  const c = theme.colors
  const isDark = mode === 'dark'
  const [loading, setLoading] = useState(false)
  const [shareData, setShareData] = useState<CreateShareLinkResponse | null>(null)
  const [copied, setCopied] = useState(false)

  const sheetBg = isDark ? neutral[900] : '#fff'
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'
  const separatorColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'

  useEffect(() => {
    if (visible && !shareData) generateShareLink()
  }, [visible, noteId])

  const generateShareLink = async () => {
    setLoading(true)
    try {
      const response = await notesApi.createShareLink(noteId)
      setShareData(response)
    } catch (error: any) {
      if (error.message?.includes('subscription')) {
        showAlert(t('share.subscriptionRequired'), t('share.subscriptionRequiredMessage'))
      } else {
        showAlert(t('common.error'), error.message || t('share.generateLinkError'))
      }
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = async () => {
    if (!shareData?.shareUrl) return
    try {
      await Clipboard.setStringAsync(shareData.shareUrl)
      setCopied(true)
      showAlert(t('common.success'), t('share.linkCopied'))
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      showAlert(t('common.error'), t('share.copyError'))
    }
  }

  const handleNativeShare = async () => {
    if (!shareData?.shareUrl) return
    try {
      const { Share } = await import('react-native')
      await Share.share({
        message: `${noteTitle}\n\n${shareData.shareUrl}`,
        title: t('share.shareNote'),
        url: shareData.shareUrl,
      })
    } catch (error: any) {
      await handleCopyLink()
    }
  }

  const handleClose = () => {
    setShareData(null)
    setCopied(false)
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <SafeAreaView edges={['bottom']} style={styles.safeWrap}>
          <Pressable
            style={[styles.sheet, { backgroundColor: sheetBg }]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <View style={[styles.handle, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)' }]} />

            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: c.foreground }]}>{t('share.shareNote')}</Text>
              <Pressable
                onPress={handleClose}
                hitSlop={12}
                style={({ pressed }) => [
                  styles.closeBtn,
                  { backgroundColor: isDark ? neutral[800] : 'rgba(0,0,0,0.05)', opacity: pressed ? 0.5 : 1 },
                ]}
              >
                <Feather name="x" size={16} color={c.mutedForeground} />
              </Pressable>
            </View>

            {/* Note info */}
            <View style={[styles.noteCard, { backgroundColor: cardBg }]}>
              <View style={[styles.noteIcon, { backgroundColor: isDark ? 'rgba(79,59,231,0.1)' : 'rgba(79,59,231,0.06)' }]}>
                <Feather name="file-text" size={16} color={c.primary} />
              </View>
              <Text style={[styles.noteTitle, { color: c.foreground }]} numberOfLines={2}>
                {noteTitle}
              </Text>
            </View>

            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={c.primary} />
                <Text style={[styles.loadingText, { color: c.mutedForeground }]}>
                  {t('share.generatingLink')}
                </Text>
              </View>
            ) : shareData ? (
              <>
                {/* URL */}
                <Text style={[styles.sectionLabel, { color: c.mutedForeground }]}>SHARE LINK</Text>
                <View style={[styles.urlBox, { backgroundColor: cardBg }]}>
                  <Text
                    style={[styles.urlText, { color: c.mutedForeground }]}
                    numberOfLines={2}
                  >
                    {shareData.shareUrl}
                  </Text>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                  <View style={[styles.statPill, { backgroundColor: cardBg }]}>
                    <Feather name="eye" size={14} color={c.mutedForeground} />
                    <Text style={[styles.statText, { color: c.mutedForeground }]}>
                      {t('share.viewCount', { count: shareData.viewCount })}
                    </Text>
                  </View>
                  <View style={[styles.statPill, { backgroundColor: isDark ? 'rgba(52,199,89,0.1)' : 'rgba(52,199,89,0.08)' }]}>
                    <Ionicons name="checkmark-circle" size={14} color="#34C759" />
                    <Text style={[styles.statText, { color: '#34C759' }]}>{t('share.active')}</Text>
                  </View>
                </View>

                {/* Info */}
                <View style={styles.infoWrap}>
                  <Text style={[styles.infoText, { color: c.mutedForeground }]}>
                    {"\u2022 "}{t('share.shareInfo')}
                  </Text>
                  <Text style={[styles.infoText, { color: c.mutedForeground }]}>
                    {"\u2022 "}{t('share.viewersNeedLogin')}
                  </Text>
                  <Text style={[styles.infoText, { color: c.mutedForeground }]}>
                    {"\u2022 "}{t('share.noteStaysPrivate')}
                  </Text>
                </View>

                {/* Buttons */}
                <View style={styles.btnRow}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.btn,
                      { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 },
                    ]}
                    onPress={handleCopyLink}
                  >
                    <Feather name={copied ? 'check' : 'copy'} size={18} color={c.primaryForeground} />
                    <Text style={[styles.btnText, { color: c.primaryForeground }]}>
                      {copied ? t('share.copied') : t('share.copyLink')}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.btn,
                      { backgroundColor: c.foreground, opacity: pressed ? 0.85 : 1 },
                    ]}
                    onPress={handleNativeShare}
                  >
                    <Feather name="share" size={18} color={c.background} />
                    <Text style={[styles.btnText, { color: c.background }]}>
                      {t('share.shareWith')}
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </Pressable>
        </SafeAreaView>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  safeWrap: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 18,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: { fontSize: 20, fontWeight: '700', letterSpacing: -0.4 },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 10,
    marginBottom: 20,
  },
  noteIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteTitle: { fontSize: 14, fontWeight: '600', flex: 1 },

  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: { marginTop: 12, fontSize: 14 },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  urlBox: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
  },
  urlText: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 18,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  statText: { fontSize: 13, fontWeight: '500' },

  infoWrap: { gap: 4, marginBottom: 20 },
  infoText: { fontSize: 12, lineHeight: 18 },

  btnRow: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 14,
  },
  btnText: { fontSize: 15, fontWeight: '600' },
})
