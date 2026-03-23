import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNoteCreation } from '@/lib/hooks/useNoteCreation';
import FullWidthButton from '@/components/ui/FullWidthButton';
import FolderSelect from '@/components/ui/FolderSelect';
import { useAlert } from '@/lib/contexts/AlertContext';
import { useTheme } from '@/lib/hooks/useTheme';
import { neutral } from '@/lib/design-system';

type Props = {
  visible?: boolean;
  onClose?: () => void;
  inline?: boolean;
  onNoteGenerated?: (noteId: string) => void;
};

const WebLink: React.FC<Props> = ({ visible: visibleProp, onClose, inline = false, onNoteGenerated }) => {
  const { processWebpage, processYouTube, generateAINote } = useNoteCreation();
  const [internalVisible, setInternalVisible] = useState<boolean>(visibleProp ?? true);
  const { showAlert } = useAlert();
  const { theme, mode } = useTheme();
  const c = theme.colors;
  const isDark = mode === 'dark';
  const visible = typeof visibleProp === 'boolean' ? visibleProp : internalVisible;
  const [link, setLink] = useState('');
  const [folder, setFolder] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<'extracting' | 'generating' | null>(null);

  const inputBg = isDark ? neutral[800] : neutral[100];
  const inputBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const close = () => {
    if (onClose) onClose();
    else setInternalVisible(false);
  };

  const isValidUrl = (url: string): boolean => {
    try {
      const urlToTest = url.startsWith('http') ? url : `https://${url}`;
      new URL(urlToTest);
      return true;
    } catch {
      return false;
    }
  };

  const isYouTubeUrl = (url: string): boolean => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)/i;
    return youtubeRegex.test(url);
  };

  const handleGenerateNotes = async () => {
    if (!link.trim()) {
      showAlert('Link Required', 'Please enter a website URL or YouTube link.');
      return;
    }

    if (!isValidUrl(link.trim())) {
      showAlert('Invalid URL', 'Please enter a valid URL (e.g., youtube.com/watch?v=...)');
      return;
    }

    setIsProcessing(true);

    try {
      setProcessingStep('extracting');

      const url = link.trim().startsWith('http') ? link.trim() : `https://${link.trim()}`;
      const isYouTube = isYouTubeUrl(url);

      let result: { transcript: { id: string; content?: string }; note?: { id: string; title: string } | null };

      if (isYouTube) {
        const youtubeResult = await processYouTube({ url, folderId: folder || undefined });
        if (!youtubeResult) return;
        result = { transcript: youtubeResult, note: null };
      } else {
        const webpageResult = await processWebpage({ url, folderId: folder || undefined });
        if (!webpageResult) return;
        result = webpageResult;
      }

      let note;
      if (result.note && result.note.id) {
        note = result.note;
      } else {
        setProcessingStep('generating');
        note = await generateAINote({
          transcriptId: result.transcript.id,
          folderId: folder || undefined,
        });
        if (!note) return;
      }

      if (onNoteGenerated) {
        onNoteGenerated(note.id);
      }

      showAlert(
        'Success!',
        'Your notes have been generated successfully.',
        [
          { text: 'View Notes', onPress: () => close() },
          { text: 'Close', onPress: close, style: 'cancel' },
        ]
      );

      setLink('');
    } catch (error: any) {
      // Hook handles errors
    } finally {
      setIsProcessing(false);
      setProcessingStep(null);
    }
  };

  const inner = (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.foreground }]}>Add link</Text>
        <Pressable
          onPress={close}
          style={({ pressed }) => [
            styles.closeButton,
            { backgroundColor: isDark ? neutral[800] : neutral[200], opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Feather name="x" size={16} color={c.mutedForeground} />
        </Pressable>
      </View>

      {/* Link input */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: c.mutedForeground }]}>LINK</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: inputBg,
              borderColor: inputBorder,
              color: c.foreground,
            },
          ]}
          placeholder="youtube.com/anyvideo"
          placeholderTextColor={c.mutedForeground}
          value={link}
          onChangeText={setLink}
          autoCapitalize="none"
          keyboardType="url"
        />
        <Text style={[styles.helper, { color: c.mutedForeground }]}>
          YouTube, PDFs, TikTok, Websites
        </Text>
      </View>

      <FolderSelect
        value={folder}
        onValueChange={(val: string) => setFolder(val)}
        style={{ marginTop: 12 }}
      />

      <FullWidthButton
        onPress={handleGenerateNotes}
        disabled={!link.trim()}
        loading={isProcessing}
        loadingText={processingStep === 'extracting' ? 'Extracting Content...' : 'Generating Notes...'}
        buttonText="Generate Notes"
      />
    </View>
  );

  if (inline) return <View>{inner}</View>;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.35)' }]}>
        <Pressable style={styles.backdrop} onPress={close} />
        <SafeAreaView style={{ flex: 1 }}>{inner}</SafeAreaView>
      </View>
    </Modal>
  );
};

export default WebLink;

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  container: { paddingBottom: 4 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '700', letterSpacing: -0.4 },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  field: { marginBottom: 4 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 2,
    textTransform: 'uppercase',
  },
  input: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 15,
    height: 48,
  },
  helper: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 2,
  },
});
