import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import * as DocumentPicker from 'expo-document-picker';
import { Feather } from '@expo/vector-icons';
import { Upload } from 'lucide-react-native';
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

const UploadAudio: React.FC<Props> = ({ visible: visibleProp, onClose, inline = false, onNoteGenerated }) => {
  const { transcribeAudio, generateAINote } = useNoteCreation();
  const [internalVisible, setInternalVisible] = useState<boolean>(visibleProp ?? true);
  const { showAlert } = useAlert();
  const { theme, mode } = useTheme();
  const c = theme.colors;
  const isDark = mode === 'dark';
  const visible = typeof visibleProp === 'boolean' ? visibleProp : internalVisible;
  const [language, setLanguage] = useState('english');
  const [folder, setFolder] = useState('');
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<'transcribing' | 'generating' | null>(null);

  const inputBg = isDark ? neutral[800] : neutral[100];
  const inputBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const close = () => {
    if (onClose) onClose();
    else setInternalVisible(false);
  };

  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: false,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];

        const allowedMimeTypes = [
          'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave',
          'audio/flac', 'audio/m4a', 'audio/x-m4a', 'audio/ogg',
          'audio/webm', 'audio/mp4', 'audio/aac'
        ];

        const allowedExtensions = [
          '.mp3', '.wav', '.m4a', '.flac', '.ogg', '.webm', '.mp4', '.aac', '.mpeg'
        ];

        const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
        const isValidMimeType = file.mimeType && allowedMimeTypes.includes(file.mimeType.toLowerCase());
        const isValidExtension = allowedExtensions.includes(fileExtension);

        if (!isValidMimeType && !isValidExtension) {
          showAlert(
            'Invalid File Type',
            `Please select an audio file. Supported formats: MP3, WAV, M4A, FLAC, OGG, WebM, MP4, AAC.\n\nSelected: ${file.name}`
          );
          return;
        }

        const maxSize = 25 * 1024 * 1024;
        if (file.size && file.size > maxSize) {
          showAlert(
            'File Too Large',
            `Audio file is too large. Maximum size is 25MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`
          );
          return;
        }

        setSelectedFile(file);
      }
    } catch (error) {
      showAlert('Error', 'Failed to pick audio file. Please try again.');
    }
  };

  const handleGenerateNotes = async () => {
    if (!selectedFile) {
      showAlert('No File Selected', 'Please select an audio file first.');
      return;
    }

    setIsProcessing(true);

    try {
      setProcessingStep('transcribing');

      const formData = new FormData();
      formData.append('audio', {
        uri: selectedFile.uri,
        type: selectedFile.mimeType || 'audio/mpeg',
        name: selectedFile.name || 'uploaded-audio.mp3',
      } as any);

      if (folder) {
        formData.append('folderId', folder);
      }

      const transcriptionResult = await transcribeAudio(formData);

      if (!transcriptionResult) return;

      console.log('Transcription result:', {
        hasNote: !!transcriptionResult.note,
        noteId: transcriptionResult.note?.id,
        transcriptId: transcriptionResult.transcript?.id,
        noteError: transcriptionResult.noteError,
      });

      let note;
      if (transcriptionResult.note && transcriptionResult.note.id) {
        console.log('Using note from backend:', transcriptionResult.note.id);
        note = transcriptionResult.note;
      } else {
        if (transcriptionResult.noteError) {
          console.warn('Transcription saved; inline note failed:', transcriptionResult.noteError);
        }
        console.warn('No note in response, generating new note (this may cause duplicate indexing)');
        setProcessingStep('generating');

        note = await generateAINote({
          transcriptId: transcriptionResult.transcript.id,
          folderId: folder || undefined,
        });

        if (!note) return;
        console.log('Generated new note:', note.id);
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
    } catch (error: any) {
      // Hook handles errors
    } finally {
      setIsProcessing(false);
      setProcessingStep(null);
    }
  };

  const pickerStyles = {
    inputIOS: {
      color: c.foreground,
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: inputBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: inputBorder,
      fontSize: 15,
      height: 48,
    },
    inputAndroid: {
      color: c.foreground,
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: inputBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: inputBorder,
      fontSize: 15,
      height: 48,
    },
    placeholder: { color: c.mutedForeground },
    iconContainer: { top: 14, right: 16 },
  };

  const inner = (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.foreground }]}>Upload audio</Text>
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

      {/* Upload area */}
      <Pressable
        style={({ pressed }) => [
          styles.uploadArea,
          {
            backgroundColor: inputBg,
            borderColor: selectedFile
              ? c.primary
              : inputBorder,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
        onPress={pickAudioFile}
      >
        <View style={[styles.uploadIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
          <Upload size={24} color={c.mutedForeground} />
        </View>
        <Text style={[styles.uploadText, { color: c.foreground }]}>
          {selectedFile ? selectedFile.name : 'Tap to select audio'}
        </Text>
        <Text style={[styles.uploadHint, { color: c.mutedForeground }]}>
          {selectedFile
            ? `${(selectedFile.size! / 1024 / 1024).toFixed(2)} MB`
            : 'MP3, WAV, M4A, FLAC, OGG — 25MB max'}
        </Text>
      </Pressable>

      {/* Language */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: c.mutedForeground }]}>AUDIO LANGUAGE</Text>
        <RNPickerSelect
          onValueChange={val => setLanguage(val)}
          items={[{ label: 'English', value: 'english' }]}
          value={language}
          style={pickerStyles}
          useNativeAndroidPickerStyle={false}
          placeholder={{}}
          Icon={() => <Feather name="chevron-down" size={16} color={c.mutedForeground} />}
        />
      </View>

      <FolderSelect
        value={folder}
        onValueChange={(val: string) => setFolder(val)}
        style={{ marginTop: 12 }}
      />

      <FullWidthButton
        onPress={handleGenerateNotes}
        disabled={!selectedFile}
        loading={isProcessing}
        loadingText={processingStep === 'transcribing' ? 'Transcribing Audio...' : 'Generating Notes...'}
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

export default UploadAudio;

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

  uploadArea: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  uploadHint: {
    fontSize: 13,
    fontWeight: '400',
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
});
