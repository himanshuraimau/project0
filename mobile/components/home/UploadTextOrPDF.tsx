import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useNoteCreation } from '@/lib/hooks/useNoteCreation';
import * as DocumentPicker from 'expo-document-picker';
import FullWidthButton from '@/components/ui/FullWidthButton';
import FolderSelect from '@/components/ui/FolderSelect';
import { useAlert } from '@/lib/contexts/AlertContext';
import { useTheme } from '@/lib/hooks/useTheme';

// Prefer react-native-vector-icons when available; fallback to emoji glyphs so component is resilient in all environments
let Icon: any = null;
try {
  // use MaterialCommunityIcons for common glyphs
  // eslint-disable-next-line global-require
  Icon = require('react-native-vector-icons/MaterialCommunityIcons').default;
} catch (e) {
  // fallback local Icon
  Icon = ({ name, size = 18, color = '#000', style }: any) => {
    const map: Record<string, string> = {
      close: '✕',
      'chevron-down': '▾',
      caret: '▾',
      chevronRight: '▶',
      file: '📄',
      sparkle: '✨',
      person: '👤',
    };
    const glyph = map[name] ?? '◻️';
    return <Text style={[{ fontSize: size, color }, style]}>{glyph}</Text>;
  };
}

type Props = {
  visible?: boolean;
  onClose?: () => void;
  inline?: boolean;
  onNoteCreated?: () => void; // Callback to refresh notes list
};

const UploadTextOrPDF: React.FC<Props> = ({ visible: visibleProp, onClose, inline = false, onNoteCreated }) => {
  const router = useRouter();
  const { generateNoteFromText, processPDF } = useNoteCreation();
  const [internalVisible, setInternalVisible] = useState<boolean>(visibleProp ?? true);
  const { showAlert } = useAlert();
  const { theme, mode } = useTheme();
  const c = theme.colors;
  const isDark = mode === 'dark';
  const visible = typeof visibleProp === 'boolean' ? visibleProp : internalVisible;
  const [titleValue, setTitleValue] = useState('');
  const [textValue, setTextValue] = useState('');
  const [folder, setFolder] = useState('');  // Empty string = no folder (uncategorized)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPDFs, setSelectedPDFs] = useState<DocumentPicker.DocumentPickerAsset[]>([]);

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
      showAlert('Missing Content', 'Please enter some text or select PDF files.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // If PDFs are selected, process them through the PDF API
      if (hasPDFs) {
        await handlePDFUpload();
        return;
      }

      // Otherwise, create a text note
      let title = hasTitle ? titleValue.trim() : 'Untitled Note';
      let text = textValue.trim();

      // Use generateNoteFromText hook - it handles limits automatically
      const response = await generateNoteFromText({
        title: title,
        text: text,
        folderId: folder || undefined,
      });

      if (!response) {
        // Error was handled by hook (e.g. limit reached)
        setLoading(false);
        return;
      }

      // Trigger refresh callback immediately on success
      if (onNoteCreated) onNoteCreated();

      // Show success message
      showAlert(
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
              setFolder('');
              setSelectedPDFs([]);
              close();
            },
          },
        ]
      );
    } catch (err: any) {
      setError(err.message || 'Failed to create note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePDFUpload = async () => {
    try {
      let lastNoteId: string | null = null;

      // Process each PDF file
      for (const pdf of selectedPDFs) {
        const formData = new FormData();

        // Append the PDF file
        formData.append('file', {
          uri: pdf.uri,
          type: 'application/pdf',
          name: pdf.name,
        } as any);

        // Add folder if selected
        if (folder) {
          formData.append('folderId', folder);
        }

        // Do NOT auto-generate notes - only upload PDF
        formData.append('generateNotes', 'false');

        // Upload and process PDF using the hook
        const result = await processPDF(formData);

        if (!result) {
          throw new Error('Failed to process PDF');
        }

        // Get the note ID from the result
        if (result.note?.id) {
          lastNoteId = result.note.id;
        }
      }

      // Trigger refresh callback
      if (onNoteCreated) onNoteCreated();

      // Show success message with option to view the note
      showAlert(
        'Success!',
        'Your notes have been generated successfully.',
        [
          ...(lastNoteId ? [{
            text: 'View Notes',
            onPress: () => {
              close();
              router.push(`/notes/${lastNoteId}`);
            },
          }] : []),
          {
            text: 'Close',
            style: 'cancel' as const,
            onPress: () => {
              // Clear form
              setTitleValue('');
              setTextValue('');
              setFolder('');
              setSelectedPDFs([]);
              close();
            },
          },
        ]
      );
    } catch (err: any) {
      throw new Error(err.message || 'Failed to upload PDF');
    }
  };

  const handleImportPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: true,
        copyToCacheDirectory: false, // Don't copy to cache - allows larger files
      });

      if (result.canceled) {
        return;
      }

      // Check file sizes (25MB limit per file)
      const maxSize = 25 * 1024 * 1024; // 25MB
      const oversizedFiles = result.assets.filter(file => file.size && file.size > maxSize);

      if (oversizedFiles.length > 0) {
        const fileList = oversizedFiles.map(f =>
          `${f.name} (${(f.size! / 1024 / 1024).toFixed(2)}MB)`
        ).join(', ');

        showAlert(
          'Files Too Large',
          `The following files exceed the 25MB limit: ${fileList}. Please select smaller files.`
        );
        return;
      }

      // Store selected PDFs
      setSelectedPDFs(result.assets);

      // Show success message
      const fileNames = result.assets.map(asset => asset.name).join(', ');
      showAlert(
        'PDFs Selected',
        `Selected ${result.assets.length} file(s): ${fileNames}`,
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      showAlert('Error', 'Failed to select PDF files. Please try again.');
    }
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    container: {
      backgroundColor: c.card,
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
    title: { color: c.foreground, fontSize: 20, fontWeight: '600' },
    separator: {
      height: 1,
      backgroundColor: c.border,
      marginHorizontal: -40,
      width: Dimensions.get('window').width + 20,
    },
    field: { marginTop: 8 },
    label: {
      fontFamily: 'Inter',
      fontWeight: '500',
      fontSize: 18,
      lineHeight: 32,
      color: c.foreground,
      marginBottom: 6,
    },
    errorContainer: {
      backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : '#FEE2E2',
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(239,68,68,0.25)' : '#FCA5A5',
    },
    errorText: {
      color: c.destructive,
      fontSize: 14,
      fontWeight: '600',
    },
    titleInput: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : c.muted,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      padding: 12,
      color: c.foreground,
      fontSize: 14,
    },
    textInput: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : c.muted,
      borderRadius: 10,
      borderWidth: 1.26,
      borderColor: c.border,
      padding: 12,
      textAlignVertical: 'top',
      minHeight: 120,
      color: c.foreground,
    },
    folderRow: { flexDirection: 'row', alignItems: 'center' },
    folderIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },
    pdfListContainer: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : c.muted,
      borderRadius: 12,
      padding: 8,
      borderWidth: 0.5,
      borderColor: c.border,
    },
    pdfItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: 8,
      padding: 10,
      marginBottom: 6,
    },
    pdfName: {
      flex: 1,
      color: c.foreground,
      fontSize: 14,
      fontWeight: '500',
    },
    removePdfButton: {
      padding: 4,
      marginLeft: 8,
    },
    actionsColumn: {
      flexDirection: 'column',
      marginTop: 18,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
  });

  const inner = (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Upload Text</Text>
          <TouchableOpacity onPress={close} disabled={loading}>
            <Icon name="close" size={20} color={c.foreground} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.separator} />
      <View style={[styles.container, styles.containerContent]}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Text</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your text here..."
            placeholderTextColor={c.mutedForeground}
            multiline
            numberOfLines={6}
            value={textValue}
            onChangeText={setTextValue}
            editable={!loading}
          />
        </View>

        <FolderSelect
          value={folder}
          onValueChange={(val: string) => setFolder(val)}
        />

        {selectedPDFs.length > 0 && (
          <View style={[styles.field, { marginTop: 10 }]}>
            <Text style={styles.label}>Selected PDFs ({selectedPDFs.length})</Text>
            <View style={styles.pdfListContainer}>
              {selectedPDFs.map((pdf, index) => (
                <View key={index} style={styles.pdfItem}>
                  <Icon name="file" size={16} color={c.primary} style={{ marginRight: 8 }} />
                  <Text style={styles.pdfName} numberOfLines={1}>
                    {pdf.name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedPDFs(prev => prev.filter((_, i) => i !== index));
                    }}
                    style={styles.removePdfButton}
                  >
                    <Icon name="close" size={16} color={c.destructive} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.actionsColumn}>
          <FullWidthButton
            onPress={handleImportPDF}
            disabled={loading}
            buttonText="Import PDF(s)"
            icon={<Icon name="file" size={20} color={c.foreground} style={{ marginRight: 8 }} />}
            backgroundColor={c.border}
            textColor={c.foreground}
            style={{ marginTop: 0 }}
          />

          <FullWidthButton
            onPress={handleGenerateNote}
            disabled={false}
            loading={loading}
            loadingText="Creating..."
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

export default UploadTextOrPDF;
