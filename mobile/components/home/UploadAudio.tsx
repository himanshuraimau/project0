import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import * as DocumentPicker from 'expo-document-picker';
import { Upload } from 'lucide-react-native';
import { useNoteCreation } from '@/lib/hooks/useNoteCreation';
import FullWidthButton from '@/components/ui/FullWidthButton';
import FolderSelect from '@/components/ui/FolderSelect';
import { useAlert } from '@/lib/contexts/AlertContext';
import { compressAudioForUpload, shouldCompressAudio } from '@/lib/utils/audioCompression';

// Local emoji icon fallback (keeps component dependency-free)
const Icon: React.FC<{ name: string; size?: number; color?: string; style?: any }> = ({
  name,
  size = 18,
  color = '#000',
  style,
}) => {
  const map: Record<string, string> = {
    close: '✕',
    upload: '⤴️',
    folder: '📁',
    caret: '▾',
    sparkle: '✨',
  };
  const glyph = map[name] ?? '◻️';
  return <Text style={[{ fontSize: size, color }, style]}>{glyph}</Text>;
};

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
  const visible = typeof visibleProp === 'boolean' ? visibleProp : internalVisible;
  const [language, setLanguage] = useState('english');
  const [folder, setFolder] = useState('');  // Empty string = no folder (uncategorized)
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<'compressing' | 'transcribing' | 'generating' | null>(null);

  const close = () => {
    if (onClose) onClose();
    else setInternalVisible(false);
  };

  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Allow all files - we'll validate audio types ourselves
        copyToCacheDirectory: false, // Don't copy to cache - allows larger files and faster picking
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // Validate audio file type
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
        
        // Check file size (25MB limit for OpenAI Whisper)
        const maxSize = 25 * 1024 * 1024; // 25MB
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
      let audioUri = selectedFile.uri;
      let audioName = selectedFile.name || 'uploaded-audio.mp3';
      let audioType = selectedFile.mimeType || 'audio/mpeg';

      // Step 1: Compress audio if needed (files > 10MB)
      const needsCompression = await shouldCompressAudio(selectedFile.uri);
      
      if (needsCompression) {
        setProcessingStep('compressing');
        
        try {
          const compressionResult = await compressAudioForUpload(selectedFile.uri);
          audioUri = compressionResult.uri;
          audioType = 'audio/m4a'; // Compressed format
          audioName = audioName.replace(/\.[^/.]+$/, '.m4a'); // Change extension
          
          if (__DEV__) {
            console.log(`✅ Compressed: ${(compressionResult.originalSize / 1024 / 1024).toFixed(2)}MB → ${(compressionResult.compressedSize / 1024 / 1024).toFixed(2)}MB (${compressionResult.compressionRatio}% reduction)`);
          }
        } catch (compressionError) {
          console.error('Compression failed, uploading original:', compressionError);
          // Continue with original file if compression fails
        }
      }

      // Step 2: Transcribe audio and generate notes
      setProcessingStep('transcribing');

      // Create FormData for audio file
      const formData = new FormData();
      
      // Append the audio file (compressed or original)
      formData.append('audio', {
        uri: audioUri,
        type: audioType,
        name: audioName,
      } as any);
      
      // Add folderId if selected
      if (folder) {
        formData.append('folderId', folder);
      }

      // Use hook for transcription
      const transcriptionResult = await transcribeAudio(formData);

      if (!transcriptionResult) {
        // Error handled by hook
        return;
      }

      // Check if note was already generated by the backend
      let note;
      if (transcriptionResult.note && transcriptionResult.note.id) {
        note = transcriptionResult.note;
      } else {
        // Step 3: Generate AI note from transcript if not already done
        setProcessingStep('generating');

        // Use hook for note generation
        note = await generateAINote({
          transcriptId: transcriptionResult.transcript.id,
          folderId: folder || undefined,
        });

        if (!note) {
          // Error handled by hook
          return;
        }
      }

      // Trigger refresh callback immediately on success
      if (onNoteGenerated) {
        onNoteGenerated(note.id);
      }

      // Success!
      showAlert(
        'Success!',
        'Your notes have been generated successfully.',
        [
          {
            text: 'View Notes',
            onPress: () => {
              close();
            },
          },
          {
            text: 'Close',
            onPress: close,
            style: 'cancel',
          },
        ]
      );
    } catch (error: any) {
      // Hook handles errors
    } finally {
      setIsProcessing(false);
      setProcessingStep(null);
    }
  };

  const inner = (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Upload audio</Text>
          <TouchableOpacity onPress={close}>
            <Icon name="close" size={22} color="#111" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.separator} />
      <View style={[styles.container, styles.containerContent]}>
        <TouchableOpacity style={styles.uploadArea} onPress={pickAudioFile} activeOpacity={0.7}>
          <Upload size={44} color="#6b6b6b" />
          <Text style={styles.uploadText}>
            {selectedFile ? selectedFile.name : 'Drag audio file here, or click to select'}
          </Text>
          {selectedFile && (
            <Text style={styles.fileInfo}>
              {(selectedFile.size! / 1024 / 1024).toFixed(2)} MB
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.pickerWrap}>
          <Text style={styles.label}>Audio language</Text>
          <RNPickerSelect
            onValueChange={val => setLanguage(val)}
            items={[{ label: 'English', value: 'english' }]}
            value={language}
            style={pickerStyles}
            useNativeAndroidPickerStyle={false}
            placeholder={{}}
            Icon={() => <Icon name="caret" size={16} color="#6b6b6b" />}
          />
        </View>

        <FolderSelect
          value={folder}
          onValueChange={(val: string) => setFolder(val)}
        />

        <View style={styles.buttonContainer}>
          <FullWidthButton
            onPress={handleGenerateNotes}
            disabled={!selectedFile}
            loading={isProcessing}
            loadingText={
              processingStep === 'compressing' 
                ? 'Compressing Audio...' 
                : processingStep === 'transcribing' 
                ? 'Transcribing Audio...' 
                : 'Generating Notes...'
            }
            buttonText="Generate Notes"
          />
        </View>
      </View>
    </>
  );

  if (inline) return <View>{inner}</View>;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={close} />
        <SafeAreaView style={{ flex: 1 }}>
          {inner}
        </SafeAreaView>
      </View>
    </Modal>
  );
};

export default UploadAudio;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 10,
    paddingBottom: 16,
  },
  containerContent: {
    paddingTop: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
    marginHorizontal: 8,
  },
  title: { color: '#111', fontSize: 20, fontWeight: '600' },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: -40,
    width: Dimensions.get('window').width + 20,
  },
  uploadArea: {
    marginTop: 8,
    backgroundColor: '#fbfbfd',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e6e6ea',
    paddingVertical: 40,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: { color: '#6b6b6b', marginTop: 12 },
  fileInfo: { color: '#6b6b6b', fontSize: 12, marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 14 },
  pickerWrap: { marginVertical: 8 },
  label: {
    fontFamily: 'Arimo',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 32,
    color: '#364153',
    marginBottom: 6,
  },
  folderRow: { flexDirection: 'row', alignItems: 'center' },
  folderIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#f2efff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  buttonContainer: {
  },
});

const pickerStyles = {
  inputIOS: {
    color: '#111',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    fontSize: 14,
    borderWidth: 1.26,
    borderColor: '#D4D4D4',
    height: 53,
    width: 300,
  },
  inputAndroid: {
    color: '#111',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    fontSize: 14,
    borderWidth: 1.26,
    borderColor: '#D4D4D4',
    height: 53,
    width: 300,
  },
  placeholder: {
    color: '#6b6b6b',
  },
  iconContainer: {
    top: 16,
    right: 16,
  },
};