import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { marked } from 'marked';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/lib/auth/auth-client';
import { notesApi } from '@/lib/api';
import { SharedNoteData } from '@/lib/api/types';
import { useAlert } from '@/lib/contexts/AlertContext';
import BackButton from '@/components/ui/BackButton';

interface SharedNotePreviewProps {
  linkId: string;
  token: string;
}

export default function SharedNotePreview({
  linkId,
  token,
}: SharedNotePreviewProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session } = useSession();
  const { showAlert } = useAlert();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [noteData, setNoteData] = useState<SharedNoteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [webViewHeight, setWebViewHeight] = useState(400);

  useEffect(() => {
    fetchSharedNote();
  }, [linkId, token]);

  const fetchSharedNote = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notesApi.getSharedNote(linkId, token);
      setNoteData(data);
    } catch (err: any) {
      console.error('Failed to fetch shared note:', err);
      setError(err.message || t('share.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    // Check if user is logged in
    if (!session?.user) {
      showAlert(
        t('share.loginRequired'),
        t('share.loginRequiredMessage'),
        [
          {
            text: t('common.cancel'),
            style: 'cancel',
          },
          {
            text: t('auth.signIn'),
            onPress: () => {
              router.push('/(auth)/sign-in');
            },
          },
        ]
      );
      return;
    }

    setSaving(true);
    try {
      const clonedNote = await notesApi.cloneSharedNote(token);
      showAlert(t('common.success'), t('share.noteSaved'));
      
      // Navigate to the cloned note
      router.push(`/notes/${clonedNote.id}`);
    } catch (err: any) {
      console.error('Failed to save note:', err);
      
      // Check for specific errors
      if (err.message?.includes('already cloned')) {
        showAlert(t('share.alreadySaved'), t('share.alreadySavedMessage'));
      } else if (err.message?.includes('limit')) {
        showAlert(t('share.limitReached'), err.message);
      } else {
        showAlert(t('common.error'), err.message || t('share.saveError'));
      }
    } finally {
      setSaving(false);
    }
  };

  const convertToHTML = (content: string) => {
    try {
      if (content.includes('<p>') || content.includes('<div>') || content.includes('<h1>')) {
        return content;
      }
      return marked(content, {
        breaks: true,
        gfm: true,
      }) as string;
    } catch (error) {
      console.error('Error converting markdown to HTML:', error);
      return content;
    }
  };

  const getHTMLContent = () => {
    if (!noteData) return '';
    
    const htmlContent = convertToHTML(noteData.note.content);
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: 16px;
              line-height: 1.6;
              color: #1F2937;
              padding: 16px;
              background: white;
            }
            h1 { font-size: 28px; font-weight: 700; margin: 20px 0 16px; color: #111827; border-bottom: 2px solid #E5E7EB; padding-bottom: 12px; }
            h2 { font-size: 24px; font-weight: 700; margin: 18px 0 14px; color: #1F2937; border-bottom: 1px solid #E5E7EB; padding-bottom: 10px; }
            h3 { font-size: 20px; font-weight: 600; margin: 16px 0 12px; color: #374151; }
            h4 { font-size: 18px; font-weight: 600; margin: 14px 0 10px; color: #4B5563; }
            p { margin: 12px 0; line-height: 1.7; }
            ul, ol { margin: 12px 0; padding-left: 24px; }
            li { margin: 8px 0; line-height: 1.6; }
            code { background: #F3F4F6; padding: 2px 6px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 14px; }
            pre { background: #F3F4F6; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 16px 0; }
            pre code { background: none; padding: 0; }
            blockquote { border-left: 4px solid #7C3AED; padding-left: 16px; margin: 16px 0; color: #6B7280; font-style: italic; }
            a { color: #7C3AED; text-decoration: underline; }
            strong { font-weight: 700; color: #111827; }
            em { font-style: italic; color: #4B5563; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; }
            th, td { padding: 12px; text-align: left; border: 1px solid #E5E7EB; }
            th { background: #F3F4F6; font-weight: 600; }
            img { max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0; }
          </style>
        </head>
        <body>
          ${htmlContent}
          <script>
            window.ReactNativeWebView.postMessage(document.body.scrollHeight.toString());
          </script>
        </body>
      </html>
    `;
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#FFFFFF', '#FBF7FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>{t('share.loadingNote')}</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (error || !noteData) {
    return (
      <LinearGradient
        colors={['#FFFFFF', '#FBF7FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <BackButton />
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={64} color="#EF4444" />
            <Text style={styles.errorTitle}>{t('share.errorTitle')}</Text>
            <Text style={styles.errorText}>
              {error || t('share.noteNotFound')}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchSharedNote}
            >
              <Feather name="refresh-cw" size={20} color="white" />
              <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#FFFFFF', '#FBF7FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <BackButton />
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSaveNote}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Feather name="download" size={20} color="white" />
            )}
            <Text style={styles.saveButtonText}>
              {saving ? t('share.saving') : t('share.saveNote')}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Note Header */}
          <View style={styles.noteHeader}>
            <Text style={styles.noteTitle}>{noteData.note.title}</Text>
            
            <View style={styles.metadata}>
              <View style={styles.metadataItem}>
                <Feather name="user" size={14} color="#6B7280" />
                <Text style={styles.metadataText}>
                  {t('share.sharedBy', { name: noteData.author.name })}
                </Text>
              </View>
              <View style={styles.metadataItem}>
                <Feather name="eye" size={14} color="#6B7280" />
                <Text style={styles.metadataText}>
                  {t('share.viewCount', { count: noteData.shareInfo.viewCount })}
                </Text>
              </View>
            </View>

            {!session?.user && (
              <View style={styles.loginPrompt}>
                <Feather name="info" size={16} color="#7C3AED" />
                <Text style={styles.loginPromptText}>
                  {t('share.loginToSave')}
                </Text>
              </View>
            )}
          </View>

          {/* Note Content */}
          <View style={styles.noteContent}>
            <WebView
              source={{ html: getHTMLContent() }}
              style={{ height: webViewHeight, backgroundColor: 'transparent' }}
              scrollEnabled={false}
              onMessage={(event) => {
                const height = parseInt(event.nativeEvent.data, 10);
                if (height && height > 0) {
                  setWebViewHeight(height + 32);
                }
              }}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  noteHeader: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  noteTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  metadata: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metadataText: {
    fontSize: 13,
    color: '#6B7280',
  },
  loginPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#7C3AED',
  },
  loginPromptText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  noteContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
});
