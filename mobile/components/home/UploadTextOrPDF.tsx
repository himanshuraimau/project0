import React, {useState} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { notesApi } from '@/lib/api';
import { setClerkTokenGetter } from '@/lib/api/client';
import * as DocumentPicker from 'expo-document-picker';
import GenerateNote from '@/components/ui/GenerateNote';

// Prefer react-native-vector-icons when available; fallback to emoji glyphs so component is resilient in all environments
let Icon: any = null;
try {
  // use MaterialCommunityIcons for common glyphs
  // eslint-disable-next-line global-require
  Icon = require('react-native-vector-icons/MaterialCommunityIcons').default;
} catch (e) {
  // fallback local Icon
  Icon = ({name, size = 18, color = '#000', style}: any) => {
    const map: Record<string, string> = {
      close: '✕',
      'chevron-down': '▾',
      file: '📄',
      sparkle: '✨',
      person: '👤',
    };
    const glyph = map[name] ?? '◻️';
    return <Text style={[{fontSize: size, color}, style]}>{glyph}</Text>;
  };
}

type Props = {
  visible?: boolean;
  onClose?: () => void;
  inline?: boolean;
  onNoteCreated?: () => void; // Callback to refresh notes list
};

const UploadTextOrPDF: React.FC<Props> = ({visible: visibleProp, onClose, inline = false, onNoteCreated}) => {
  const router = useRouter();
  const { getToken } = useAuth();
  const [internalVisible, setInternalVisible] = useState<boolean>(visibleProp ?? true);
  const visible = typeof visibleProp === 'boolean' ? visibleProp : internalVisible;
  const [titleValue, setTitleValue] = useState('');
  const [textValue, setTextValue] = useState('');
  const [folder, setFolder] = useState('all_notes');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPDFs, setSelectedPDFs] = useState<DocumentPicker.DocumentPickerAsset[]>([]);

  // Set up Clerk token getter
  React.useEffect(() => {
    setClerkTokenGetter(getToken);
  }, [getToken]);

  const close = () => {
    if (onClose) onClose();
    else setInternalVisible(false);
  };

  const handleGenerateNote = async () => {
    const hasTextContent = textValue.trim().length > 0;
    const hasPDFs = selectedPDFs.length > 0;
    const hasTitle = titleValue.trim().length > 0;
    
    // Validation: Must have content (text OR PDF)
    if (!hasTextContent && !hasPDFs) {
      Alert.alert('Missing Content', 'Please enter some text or select PDF files.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let title = '';
      let text = '';
      
      // Generate title if not provided
      if (hasTitle) {
        title = titleValue.trim();
      } else if (hasPDFs) {
        // Use first PDF name as title
        title = selectedPDFs[0].name.replace('.pdf', '');
      } else {
        title = 'Untitled Note';
      }
      
      // Generate content
      if (hasPDFs) {
        // Create note with PDF information
        // TODO: Implement actual PDF text extraction or upload to backend
        const pdfInfo = selectedPDFs.map(pdf => `[PDF: ${pdf.name}]`).join('\n\n');
        text = hasTextContent 
          ? `${textValue.trim()}\n\n--- Attached PDFs ---\n${pdfInfo}`
          : pdfInfo;
        
        console.log('Creating note with PDFs:', selectedPDFs.map(p => p.name));
        console.log('PDF URIs for future processing:', selectedPDFs.map(p => p.uri));
      } else {
        text = textValue.trim();
      }

      console.log('Creating note with:', { title, textLength: text.length });

      // Use generateNoteFromText API - it handles transcript creation automatically
      const response = await notesApi.generateNoteFromText({
        title: title,
        text: text,
      });

      console.log('Note created successfully:', response.note.id);
      console.log('Transcript created:', response.transcript.id);

      // Show success message
      Alert.alert(
        'Success!',
        'Your note has been created successfully.',
        [
          {
            text: 'View Note',
            onPress: () => {
              close();
              router.push(`/notes/${response.note.id}`);
            },
          },
          {
            text: 'OK',
            onPress: () => {
              // Clear form
              setTitleValue('');
              setTextValue('');
              setFolder('all_notes');
              setSelectedPDFs([]);
              
              // Call refresh callback
              if (onNoteCreated) onNoteCreated();
              
              close();
            },
          },
        ]
      );
    } catch (err: any) {
      console.error('Failed to create note:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError(err.message || 'Failed to create note. Please try again.');
      Alert.alert('Error', err.message || 'Failed to create note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImportPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        console.log('User cancelled PDF selection');
        return;
      }

      // Store selected PDFs
      setSelectedPDFs(result.assets);
      
      // Show success message
      const fileNames = result.assets.map(asset => asset.name).join(', ');
      Alert.alert(
        'PDFs Selected',
        `Selected ${result.assets.length} file(s): ${fileNames}`,
        [{ text: 'OK' }]
      );

      console.log('Selected PDFs:', result.assets);
    } catch (err: any) {
      console.error('Failed to pick PDF:', err);
      Alert.alert('Error', 'Failed to select PDF files. Please try again.');
    }
  };

  const inner = (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Upload Text</Text>
        <TouchableOpacity onPress={close} disabled={loading}>
          {/* Use name 'close' compatible with vector icons */}
          <Icon name="close" size={20} color="#111" />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.field}>
        <Text style={styles.label}>
          Title {selectedPDFs.length === 0 ? '*' : '(Optional - will use PDF name if empty)'}
        </Text>
        <TextInput
          style={styles.titleInput}
          placeholder={selectedPDFs.length > 0 ? "Optional - will use PDF name" : "Enter note title..."}
          placeholderTextColor="#8b8b8b"
          value={titleValue}
          onChangeText={setTitleValue}
          editable={!loading}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>
          Text {selectedPDFs.length === 0 ? '*' : '(Optional)'}
        </Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter your text here..."
          placeholderTextColor="#8b8b8b"
          multiline
          numberOfLines={6}
          value={textValue}
          onChangeText={setTextValue}
          editable={!loading}
        />
      </View>

      <View style={[styles.field, {marginTop: 10}]}>
        <Text style={styles.label}>Folder</Text>
        <View style={styles.folderRow}>
          <View style={styles.folderIconWrap}>
            <Icon name="account" size={14} color="#7b61ff" />
          </View>

          <RNPickerSelect
            onValueChange={val => setFolder(val)}
            items={[{label: 'All notes', value: 'all_notes'}]}
            value={folder}
            style={pickerStyles}
            useNativeAndroidPickerStyle={false}
            placeholder={{}}
            Icon={() => <Icon name="chevron-down" size={18} color="#6b6b6b" />}
          />
        </View>
      </View>

      {selectedPDFs.length > 0 && (
        <View style={[styles.field, {marginTop: 10}]}>
          <Text style={styles.label}>Selected PDFs ({selectedPDFs.length})</Text>
          <View style={styles.pdfListContainer}>
            {selectedPDFs.map((pdf, index) => (
              <View key={index} style={styles.pdfItem}>
                <Icon name="file" size={16} color="#7C3AED" style={{marginRight: 8}} />
                <Text style={styles.pdfName} numberOfLines={1}>
                  {pdf.name}
                </Text>
                <TouchableOpacity 
                  onPress={() => {
                    setSelectedPDFs(prev => prev.filter((_, i) => i !== index));
                  }}
                  style={styles.removePdfButton}
                >
                  <Icon name="close" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.actionsRow}>
        <TouchableOpacity 
          style={[styles.importBtn, loading && styles.buttonDisabled]} 
          activeOpacity={0.85}
          disabled={loading}
          onPress={handleImportPDF}
        >
          <Icon name="file" size={16} color="#333" style={{marginRight: 8}} />
          <Text style={styles.importText}>Import PDF(s)</Text>
        </TouchableOpacity>

        <GenerateNote
          onPress={handleGenerateNote}
          disabled={false}
          loading={loading}
          loadingText="Creating..."
          buttonText="Create Note"
          style={styles.customGenerateBtn}
          textStyle={styles.customGenerateText}
        />
      </View>
    </View>
  );

  if (inline) return <View>{inner}</View>;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={close} />
        <SafeAreaView style={{flex: 1}}>
          {inner}
        </SafeAreaView>
      </View>
    </Modal>
  );
};

export default UploadTextOrPDF;

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
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {color: '#111', fontSize: 18, fontWeight: '600'},
  field: {marginTop: 8},
  label: {color: '#6b6b6b', fontSize: 12, marginBottom: 6},
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
  titleInput: {
    backgroundColor: '#fbfbfd',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e6e6ea',
    padding: 12,
    color: '#111',
    fontSize: 14,
  },
  textInput: {
    backgroundColor: '#fbfbfd',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e6e6ea',
    padding: 12,
    textAlignVertical: 'top',
    minHeight: 120,
    color: '#111',
  },
  folderRow: {flexDirection: 'row', alignItems: 'center'},
  folderIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#f2efff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  pdfListContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e6e6ea',
  },
  pdfItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  pdfName: {
    flex: 1,
    color: '#111',
    fontSize: 14,
    fontWeight: '500',
  },
  removePdfButton: {
    padding: 4,
    marginLeft: 8,
  },
  actionsRow: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 18},
  importBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f3f3',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginRight: 8,
  },
  importText: {color: '#222', fontWeight: '600'},
  generateBtn: {
    flex: 1,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  customGenerateBtn: {
    flex: 1,
    height: 56,
    borderRadius: 15,
    marginTop: 18,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  customGenerateText: {
    fontFamily: 'Arimo',
    fontSize: 19,
    lineHeight: 28,
  },
});

const pickerStyles = {
  inputIOS: {
    color: '#111',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    fontSize: 14,
  },
  inputAndroid: {
    color: '#111',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    fontSize: 14,
  },
  placeholder: {
    color: '#6b6b6b',
  },
};
