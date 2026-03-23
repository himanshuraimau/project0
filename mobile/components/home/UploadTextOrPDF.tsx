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
import { neutral } from '@/lib/design-system';

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
  onNoteCreated?: () => void;
};

const UploadTextOrPDF: React.FC<Props> = ({ visible: visibleProp, onClose, inline = false, onNoteCreated }) => {
  const router = useRouter();
  const { generateNoteFromText, processPDF, generateAINote } = useNoteCreation();
  const [internalVisible, setInternalVisible] = useState<boolean>(visibleProp ?? true);
  const { showAlert } = useAlert();
  const { theme, mode } = useTheme();
  const c = theme.colors;
  const isDark = mode === 'dark';
  const visible = typeof visibleProp === 'boolean' ? visibleProp : internalVisible;
  const [titleValue, setTitleValue] = useState('');
  const [textValue, setTextValue] = useState('');
  const [folder, setFolder] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPDFs, setSelectedPDFs] = useState<DocumentPicker.DocumentPickerAsset[]>([]);

  const inputBg = isDark ? neutral[800] : neutral[100];
  const inputBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const close = () => {
    if (onClose) onClose();
    else setInternalVisible(false);
  };

  const handleGenerateNote = async () => {
    const hasTextContent = textValue.trim().length > 0;
    const hasPDFs = selectedPDFs.length > 0;
    const hasTitle = titleValue.trim().length > 0;

    if (!hasTextContent && !hasPDFs) {
      showAlert('Missing Content', 'Please enter some text or select PDF files.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (hasPDFs) {
        await handlePDFUpload();
        return;
      }

      let title = hasTitle ? titleValue.trim() : 'Untitled Note';
      let text = textValue.trim();

      const response = await generateNoteFromText({
        title: title,
        text: text,
        folderId: folder || undefined,
      });

      if (!response) {
        setLoading(false);
        return;
      }

      if (onNoteCreated) onNoteCreated();

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
          { text: 'Close', style: 'cancel' as const, onPress: clearAndClose },
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
        copyToCacheDirectory: false,
      });

      if (result.canceled) return;

      const maxSize = 25 * 1024 * 1024;
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

      setSelectedPDFs(result.assets);

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

  const inner = (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.foreground }]}>Upload Text</Text>
        <Pressable
          onPress={close}
          disabled={loading}
          style={({ pressed }) => [
            styles.closeButton,
            { backgroundColor: isDark ? neutral[800] : neutral[200], opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Feather name="x" size={16} color={c.mutedForeground} />
        </Pressable>
      </View>

      {error && (
        <View style={[styles.errorContainer, { backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#FEE2E2' }]}>
          <Text style={[styles.errorText, { color: c.destructive }]}>{error}</Text>
        </View>
      )}

      {/* Text input */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: c.mutedForeground }]}>TEXT</Text>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: inputBg,
              borderColor: inputBorder,
              color: c.foreground,
            },
          ]}
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

      {/* Selected PDFs */}
      {selectedPDFs.length > 0 && (
        <View style={[styles.field, { marginTop: 12 }]}>
          <Text style={[styles.label, { color: c.mutedForeground }]}>SELECTED PDFS ({selectedPDFs.length})</Text>
          <View style={[styles.pdfList, { backgroundColor: inputBg, borderColor: inputBorder }]}>
            {selectedPDFs.map((pdf, index) => (
              <View
                key={index}
                style={[
                  styles.pdfItem,
                  {
                    backgroundColor: isDark ? neutral[900] : '#fff',
                    borderColor: inputBorder,
                  },
                ]}
              >
                <Feather name="file-text" size={16} color={c.primary} />
                <Text style={[styles.pdfName, { color: c.foreground }]} numberOfLines={1}>
                  {pdf.name}
                </Text>
                <Pressable
                  onPress={() => setSelectedPDFs(prev => prev.filter((_, i) => i !== index))}
                  style={({ pressed }) => [
                    styles.removePdfBtn,
                    {
                      backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#FEE2E2',
                      opacity: pressed ? 0.6 : 1,
                    },
                  ]}
                >
                  <Feather name="x" size={14} color={c.destructive} />
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <FullWidthButton
          onPress={handleImportPDF}
          disabled={loading}
          buttonText="Import PDF(s)"
          icon={<Feather name="file-text" size={18} color={c.foreground} style={{ marginRight: 8 }} />}
          backgroundColor={isDark ? neutral[800] : neutral[200]}
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
      <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.35)' }]}>
        <Pressable style={styles.backdrop} onPress={close} />
        <SafeAreaView style={{ flex: 1 }}>{inner}</SafeAreaView>
      </View>
    </Modal>
  );
};

export default UploadTextOrPDF;

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

  errorContainer: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { fontSize: 14, fontWeight: '600' },

  field: { marginBottom: 4 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 2,
    textTransform: 'uppercase',
  },

  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    textAlignVertical: 'top',
    minHeight: 120,
    fontSize: 15,
    lineHeight: 22,
  },

  pdfList: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
  },
  pdfItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 6,
    gap: 10,
  },
  pdfName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  removePdfBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  actions: { marginTop: 8 },
});
