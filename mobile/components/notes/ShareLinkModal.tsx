import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import { notesApi } from '@/lib/api';
import { useAlert } from '@/lib/contexts/AlertContext';
import { CreateShareLinkResponse } from '@/lib/api/types';
import { useTheme } from '@/lib/hooks/useTheme';

interface ShareLinkModalProps {
  visible: boolean;
  onClose: () => void;
  noteId: string;
  noteTitle: string;
}

export default function ShareLinkModal({
  visible,
  onClose,
  noteId,
  noteTitle,
}: ShareLinkModalProps) {
  const { t } = useTranslation();
  const { showAlert } = useAlert();
  const { theme, mode } = useTheme();
  const c = theme.colors;
  const isDark = mode === 'dark';
  const [loading, setLoading] = useState(false);
  const [shareData, setShareData] = useState<CreateShareLinkResponse | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (visible && !shareData) {
      generateShareLink();
    }
  }, [visible, noteId]);

  const generateShareLink = async () => {
    setLoading(true);
    try {
      const response = await notesApi.createShareLink(noteId);
      setShareData(response);
    } catch (error: any) {
      console.error('Failed to generate share link:', error);

      // Check if it's a subscription error
      if (error.message?.includes('subscription')) {
        showAlert(
          t('share.subscriptionRequired'),
          t('share.subscriptionRequiredMessage')
        );
      } else {
        showAlert(t('common.error'), error.message || t('share.generateLinkError'));
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareData?.shareUrl) return;

    try {
      await Clipboard.setStringAsync(shareData.shareUrl);
      setCopied(true);
      showAlert(t('common.success'), t('share.linkCopied'));

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      showAlert(t('common.error'), t('share.copyError'));
    }
  };

  const handleNativeShare = async () => {
    if (!shareData?.shareUrl) return;

    try {
      // Use React Native's Share API for sharing text/URLs
      const { Share } = await import('react-native');

      const result = await Share.share({
        message: `${noteTitle}\n\n${shareData.shareUrl}`,
        title: t('share.shareNote'),
        url: shareData.shareUrl, // iOS only
      });

      if (result.action === Share.sharedAction) {
        console.log('Share successful');
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error: any) {
      console.error('Failed to share:', error);
      await handleCopyLink();
    }
  };

  const handleClose = () => {
    setShareData(null);
    setCopied(false);
    onClose();
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      overflow: 'hidden',
      borderTopWidth: 0.5,
      borderLeftWidth: 0.5,
      borderRightWidth: 0.5,
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      maxHeight: '80%',
    },
    glassOverlay: {
      backgroundColor: isDark ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.88)',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 40,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    title: {
      fontSize: 20,
      fontWeight: '500',
      color: c.foreground,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : c.muted,
      justifyContent: 'center',
      alignItems: 'center',
    },
    noteInfo: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : c.muted,
      padding: 12,
      borderRadius: 12,
      marginBottom: 20,
      borderWidth: 0.5,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
    },
    noteTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: c.foreground,
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: c.mutedForeground,
    },
    urlContainer: {
      marginBottom: 20,
    },
    urlLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: c.foreground,
      marginBottom: 8,
    },
    urlBox: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : c.muted,
      padding: 12,
      borderRadius: 12,
      borderWidth: 0.5,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : c.border,
    },
    urlText: {
      fontSize: 13,
      color: c.mutedForeground,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    statsContainer: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 20,
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : c.muted,
      borderRadius: 12,
      borderWidth: 0.5,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statText: {
      fontSize: 13,
      color: c.mutedForeground,
    },
    infoContainer: {
      marginBottom: 24,
      gap: 6,
    },
    infoText: {
      fontSize: 12,
      color: c.mutedForeground,
      lineHeight: 18,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    button: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 12,
    },
    copyButton: {
      backgroundColor: c.primary,
    },
    shareButton: {
      backgroundColor: c.info,
    },
    buttonText: {
      color: c.primaryForeground,
      fontSize: 15,
      fontWeight: '600',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={isDark ? 40 : 20} tint={isDark ? 'dark' : 'light'} style={styles.modalContainer}>
          <View style={styles.glassOverlay}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Feather name="share-2" size={24} color={c.primary} />
                <Text style={styles.title}>{t('share.shareNote')}</Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Feather name="x" size={20} color={c.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* Note Title */}
            <View style={styles.noteInfo}>
              <Text style={styles.noteTitle} numberOfLines={2}>
                {noteTitle}
              </Text>
            </View>

            {/* Loading State */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={c.primary} />
                <Text style={styles.loadingText}>{t('share.generatingLink')}</Text>
              </View>
            )}

            {/* Share Link Content */}
            {!loading && shareData && (
              <>
                {/* Share URL */}
                <View style={styles.urlContainer}>
                  <Text style={styles.urlLabel}>{t('share.shareLink')}</Text>
                  <View style={styles.urlBox}>
                    <Text style={styles.urlText} numberOfLines={2}>
                      {shareData.shareUrl}
                    </Text>
                  </View>
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Feather name="eye" size={16} color={c.mutedForeground} />
                    <Text style={styles.statText}>
                      {t('share.viewCount', { count: shareData.viewCount })}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Feather name="check-circle" size={16} color={c.success} />
                    <Text style={styles.statText}>{t('share.active')}</Text>
                  </View>
                </View>

                {/* Info */}
                <View style={styles.infoContainer}>
                  <Text style={styles.infoText}>• {t('share.shareInfo')}</Text>
                  <Text style={styles.infoText}>• {t('share.viewersNeedLogin')}</Text>
                  <Text style={styles.infoText}>• {t('share.noteStaysPrivate')}</Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.copyButton]}
                    onPress={handleCopyLink}
                  >
                    <Feather
                      name={copied ? 'check' : 'copy'}
                      size={20}
                      color={c.primaryForeground}
                    />
                    <Text style={styles.buttonText}>
                      {copied ? t('share.copied') : t('share.copyLink')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.shareButton]}
                    onPress={handleNativeShare}
                  >
                    <Feather name="share" size={20} color={c.primaryForeground} />
                    <Text style={styles.buttonText}>{t('share.shareWith')}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </BlurView>
      </View>
    </Modal>
  );
}
