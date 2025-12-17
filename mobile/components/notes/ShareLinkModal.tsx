import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import { notesApi } from '@/lib/api';
import { useAlert } from '@/lib/contexts/AlertContext';
import { CreateShareLinkResponse } from '@/lib/api/types';

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
        // Successfully shared
        console.log('Share successful');
      } else if (result.action === Share.dismissedAction) {
        // User dismissed the share dialog
        console.log('Share dismissed');
      }
    } catch (error: any) {
      console.error('Failed to share:', error);
      // Fallback to copy if share fails
      await handleCopyLink();
    }
  };

  const handleClose = () => {
    setShareData(null);
    setCopied(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Feather name="share-2" size={24} color="#7C3AED" />
              <Text style={styles.title}>{t('share.shareNote')}</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Feather name="x" size={24} color="#6B7280" />
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
              <ActivityIndicator size="large" color="#7C3AED" />
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
                  <Feather name="eye" size={16} color="#6B7280" />
                  <Text style={styles.statText}>
                    {t('share.viewCount', { count: shareData.viewCount })}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Feather name="check-circle" size={16} color="#10B981" />
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
                    color="white"
                  />
                  <Text style={styles.buttonText}>
                    {copied ? t('share.copied') : t('share.copyLink')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.shareButton]}
                  onPress={handleNativeShare}
                >
                  <Feather name="share" size={20} color="white" />
                  <Text style={styles.buttonText}>{t('share.shareWith')}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
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
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  noteInfo: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  urlContainer: {
    marginBottom: 20,
  },
  urlLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  urlBox: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  urlText: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: '#6B7280',
  },
  infoContainer: {
    marginBottom: 24,
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
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
    backgroundColor: '#7C3AED',
  },
  shareButton: {
    backgroundColor: '#3B82F6',
  },
  buttonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
});
