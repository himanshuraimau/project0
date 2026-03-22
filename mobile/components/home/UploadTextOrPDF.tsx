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
import { useRouter } from 'expo-router';
import { useNoteCreation } from '@/lib/hooks/useNoteCreation';
import * as DocumentPicker from 'expo-document-picker';
import FullWidthButton from '@/components/ui/FullWidthButton';
import FolderSelect from '@/components/ui/FolderSelect';
import { useAlert } from '@/lib/contexts/AlertContext';
import { useTheme } from '@/lib/hooks/useTheme';

/** Aligns with web `parseNoteResult` for PDF process API `note` field shapes. */
function parseNoteResult(
  note: unknown,
): { id: string | null; error: string | null; message: string | null } {
  if (!note || typeof note !== 'object') {
    return { id: null, error: null, message: null };
  }

  const noteObj = note as {
    id?: unknown;
    error?: unknown;
    message?: unknown;
    note?: { id?: unknown };
    data?: { id?: unknown };
  };

  const directId =
    typeof noteObj.id === 'string' && noteObj.id.trim().length > 0
      ? noteObj.id
      : null;
  const nestedId =
    typeof noteObj.note?.id === 'string' && noteObj.note.id.trim().length > 0
      ? noteObj.note.id
      : typeof noteObj.data?.id === 'string' && noteObj.data.id.trim().length > 0
        ? noteObj.data.id
        : null;

  const error =
    typeof noteObj.error === 'string' && noteObj.error.trim().length > 0
      ? noteObj.error
      : null;
  const message =
    typeof noteObj.message === 'string' && noteObj.message.trim().length > 0
      ? noteObj.message
      : null;

  return { id: directId ?? nestedId, error, message };
}

type Props = {
  visible?: boolean;
  onClose?: () => void;
  inline?: boolean;
  onNoteCreated?: () => void; // Callback to refresh notes list
};

const UploadTextOrPDF: React.FC<Props> = ({ visible: visibleProp, onClose, inline = false, onNoteCreated }) => {
  const router = useRouter();
  const { generateNoteFromText, processPDF, generateAINote } = useNoteCreation();
  const [internalVisible, setInternalVisible] = useState<boolean>(visibleProp ?? true);
  const { showAlert } = useAlert();
  const { theme, mode } = useTheme();
  const c = theme.colors;
  const isDark = mode === 'dark';
  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
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
      const partialFailures: string[] = [];
      let anyTranscriptSaved = false;

      for (const pdf of selectedPDFs) {
        const formData = new FormData();

        formData.append('file', {
          uri: pdf.uri,
          type: 'application/pdf',
          name: pdf.name,
        } as any);

        if (folder) {
          formData.append('folderId', folder);
        }

        // Backend requires explicit opt-in for AI notes on multipart /pdf/process
        formData.append('generateNotes', 'true');

        const result = await processPDF(formData);

        if (!result) {
          throw new Error('Failed to process PDF');
        }

        anyTranscriptSaved = true;
        const transcriptId = result.transcript?.id;
        let parsed = parseNoteResult(result.note);
        let noteId = parsed.id;

        if (!noteId && transcriptId) {
          const retried = await generateAINote({
            transcriptId,
            folderId: folder || undefined,
          });
          if (retried?.id) {
            noteId = retried.id;
          }
        }

        if (noteId) {
          lastNoteId = noteId;
        } else if (transcriptId) {
          partialFailures.push(
            `${pdf.name}: ${parsed.message || parsed.error || 'Could not generate notes'}`,
          );
        } else {
          partialFailures.push(`${pdf.name}: No transcript returned`);
        }
      }

      if (onNoteCreated && anyTranscriptSaved) {
        onNoteCreated();
      }

      const clearAndClose = () => {
        setTitleValue('');
        setTextValue('');
        setFolder('');
        setSelectedPDFs([]);
        close();
      };

      if (partialFailures.length === 0 && lastNoteId) {
        showAlert('Success!', 'Your notes have been generated successfully.', [
          {
            text: 'View Notes',
            onPress: () => {
              close();
              router.push(`/notes/${lastNoteId}`);
            },
          },
          {
            text: 'Close',
            style: 'cancel' as const,
            onPress: clearAndClose,
          },
        ]);
        return;
      }

      if (partialFailures.length > 0 && lastNoteId) {
        showAlert(
          'Partial success',
          `Some files had issues:\n${partialFailures.join('\n')}`,
          [
            {
              text: 'View last note',
              onPress: () => {
                close();
                router.push(`/notes/${lastNoteId}`);
              },
            },
            { text: 'Close', style: 'cancel' as const, onPress: clearAndClose },
          ],
        );
        return;
      }

      if (partialFailures.length > 0) {
        showAlert(
          'Note generation issue',
          `Your PDF was processed, but notes could not be created:\n${partialFailures.join('\n')}`,
          [{ text: 'Close', style: 'cancel' as const, onPress: clearAndClose }],
        );
        return;
      }

      showAlert('Done', 'Processing finished.', [
        { text: 'Close', style: 'cancel' as const, onPress: clearAndClose },
      ]);
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
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: 12,
      marginBottom: 4,
    },
    title: { color: c.foreground, fontSize: 20, fontWeight: '600' },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: inputBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    field: { marginTop: 12 },
    label: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.5,
      color: c.mutedForeground,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    errorContainer: {
      backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : '#FEE2E2',
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
    },
    errorText: {
      color: c.destructive,
      fontSize: 14,
      fontWeight: '600',
    },
    textInput: {
      backgroundColor: inputBg,
      borderRadius: 12,
      padding: 14,
      textAlignVertical: 'top',
      minHeight: 120,
      color: c.foreground,
      fontSize: 14,
    },
    pdfListContainer: {
      backgroundColor: inputBg,
      borderRadius: 12,
      padding: 8,
    },
    pdfItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: 10,
      padding: 12,
      marginBottom: 6,
    },
    pdfName: {
      flex: 1,
      color: c.foreground,
      fontSize: 14,
      fontWeight: '500',
      marginLeft: 10,
    },
    removePdfButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : '#FEE2E2',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },
    actionsColumn: {
      flexDirection: 'column',
      marginTop: 16,
    },
  });

  const inner = (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Upload Text</Text>
        <Pressable onPress={close} disabled={loading} style={styles.closeButton}>
          <Feather name="x" size={18} color={c.foreground} />
        </Pressable>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.field}>
        <Text style={styles.label}>TEXT</Text>
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
        style={{ marginTop: 12 }}
      />

      {selectedPDFs.length > 0 && (
        <View style={[styles.field, { marginTop: 12 }]}>
          <Text style={styles.label}>SELECTED PDFS ({selectedPDFs.length})</Text>
          <View style={styles.pdfListContainer}>
            {selectedPDFs.map((pdf, index) => (
              <View key={index} style={styles.pdfItem}>
                <Feather name="file-text" size={16} color={c.primary} />
                <Text style={styles.pdfName} numberOfLines={1}>
                  {pdf.name}
                </Text>
                <Pressable
                  onPress={() => {
                    setSelectedPDFs(prev => prev.filter((_, i) => i !== index));
                  }}
                  style={styles.removePdfButton}
                >
                  <Feather name="x" size={14} color={c.destructive} />
                </Pressable>
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
          icon={<Feather name="file-text" size={18} color={c.foreground} style={{ marginRight: 8 }} />}
          backgroundColor={inputBg}
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
  );

  if (inline) return <View>{inner}</View>;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={close} />
        <SafeAreaView style={{ flex: 1 }}>
          {inner}
        </SafeAreaView>
      </View>
    </Modal>
  );
};

export default UploadTextOrPDF;
