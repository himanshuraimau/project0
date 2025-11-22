import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    TextInput,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, List, ListOrdered, AlignLeft, Play, Bold, Italic, Underline, Type } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { notesApi } from '@/lib/api';
import type { Note } from '@/lib/api/types';
import BackButton from '@/components/ui/BackButton';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { marked } from 'marked';

interface EditViewProps {
    noteId: string;
}

export default function EditView({ noteId }: EditViewProps) {
    const router = useRouter();
    const richText = useRef<RichEditor>(null);
    const [note, setNote] = useState<Note | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showFontSizePicker, setShowFontSizePicker] = useState(false);
    const [showFontStylePicker, setShowFontStylePicker] = useState(false);

    useEffect(() => {
        fetchNote();
    }, [noteId]);

    const fetchNote = async () => {
        try {
            setLoading(true);
            setError(null);
            const fetchedNote = await notesApi.getNoteById(noteId);
            setNote(fetchedNote);
            setTitle(fetchedNote.title);

            // Convert Markdown to HTML if needed
            let contentToSet = fetchedNote.content;
            if (!contentToSet.includes('<p>') && !contentToSet.includes('<div>') && !contentToSet.includes('<h1>')) {
                // Content appears to be Markdown, convert it
                try {
                    contentToSet = marked(contentToSet, { breaks: true, gfm: true }) as string;
                } catch (e) {
                    console.error('Error converting markdown:', e);
                }
            }
            setContent(contentToSet);
        } catch (err: any) {
            console.error('Failed to fetch note:', err);
            setError(err.message || 'Failed to load note');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Title cannot be empty');
            return;
        }

        try {
            setSaving(true);
            // Get HTML content from editor
            const htmlContent = await richText.current?.getContentHtml();

            await notesApi.updateNote(noteId, {
                title,
                content: htmlContent || content,
            });
            router.back();
        } catch (err: any) {
            console.error('Failed to update note:', err);
            Alert.alert('Error', 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const handleFontSize = (size: number) => {
        // Inject JavaScript to wrap selected text with font size
        const script = `
            (function() {
                var selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    var range = selection.getRangeAt(0);
                    var selectedText = range.toString();
                    
                    if (selectedText) {
                        try {
                            // Extract the content
                            var fragment = range.extractContents();
                            
                            // Create wrapper span
                            var span = document.createElement('span');
                            span.style.fontSize = '${size}px';
                            span.appendChild(fragment);
                            
                            // Insert the wrapped content
                            range.insertNode(span);
                            
                            // Update selection
                            selection.removeAllRanges();
                            var newRange = document.createRange();
                            newRange.selectNodeContents(span);
                            selection.addRange(newRange);
                        } catch (e) {
                            console.log('Font size error:', e);
                        }
                    } else {
                        // Insert placeholder for typing
                        var span = document.createElement('span');
                        span.style.fontSize = '${size}px';
                        span.innerHTML = '&nbsp;';
                        range.insertNode(span);
                        
                        // Move cursor inside span
                        var newRange = document.createRange();
                        newRange.setStart(span.firstChild, 1);
                        newRange.collapse(true);
                        selection.removeAllRanges();
                        selection.addRange(newRange);
                    }
                }
            })();
        `;

        richText.current?.injectJavascript(script);
        setShowFontSizePicker(false);
    };

    const handleFontStyle = (fontFamily: string) => {
        // Inject JavaScript to wrap selected text with font family
        const script = `
            (function() {
                var selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    var range = selection.getRangeAt(0);
                    var selectedText = range.toString();
                    
                    if (selectedText) {
                        try {
                            // Extract the content
                            var fragment = range.extractContents();
                            
                            // Create wrapper span
                            var span = document.createElement('span');
                            span.style.fontFamily = '${fontFamily}';
                            span.appendChild(fragment);
                            
                            // Insert the wrapped content
                            range.insertNode(span);
                            
                            // Update selection
                            selection.removeAllRanges();
                            var newRange = document.createRange();
                            newRange.selectNodeContents(span);
                            selection.addRange(newRange);
                        } catch (e) {
                            console.log('Font style error:', e);
                        }
                    } else {
                        // Insert placeholder for typing
                        var span = document.createElement('span');
                        span.style.fontFamily = '${fontFamily}';
                        span.innerHTML = '&nbsp;';
                        range.insertNode(span);
                        
                        // Move cursor inside span
                        var newRange = document.createRange();
                        newRange.setStart(span.firstChild, 1);
                        newRange.collapse(true);
                        selection.removeAllRanges();
                        selection.addRange(newRange);
                    }
                }
            })();
        `;

        richText.current?.injectJavascript(script);
        setShowFontStylePicker(false);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7C3AED" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchNote}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <BackButton />
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>Edit Note</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.saveButton, saving && styles.disabledButton]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color="#7C3AED" />
                        ) : (
                            <Check color="#7C3AED" size={24} />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Body Content */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.body}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.bodyContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <TextInput
                            style={styles.titleInput}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Note Title"
                            placeholderTextColor="#9CA3AF"
                            multiline
                        />

                        <RichEditor
                            ref={richText}
                            initialContentHTML={content}
                            onChange={setContent}
                            placeholder="Start typing..."
                            editorStyle={{
                                backgroundColor: '#FFFFFF',
                                color: '#374151',
                                placeholderColor: '#9CA3AF',
                                contentCSSText: 'font-size: 16px; line-height: 24px;',
                            }}
                            style={styles.richEditor}
                        />

                        {/* Extra space for scrolling above toolbar */}
                        <View style={{ height: 80 }} />
                    </ScrollView>

                    {/* Bottom Toolbar */}
                    <View style={styles.toolbar}>
                        <RichToolbar
                            editor={richText}
                            actions={[
                                actions.heading1,
                                actions.insertBulletsList,
                                actions.insertOrderedList,
                                actions.alignLeft,
                                actions.indent,
                                actions.setBold,
                                actions.setItalic,
                                actions.setUnderline,
                            ]}
                            iconMap={{
                                [actions.heading1]: () => (
                                    <View style={styles.pillButton}>
                                        <Text style={styles.pillButtonText}>Header 1</Text>
                                    </View>
                                ),
                                [actions.insertBulletsList]: () => <List color="#333" size={20} />,
                                [actions.insertOrderedList]: () => <ListOrdered color="#333" size={20} />,
                                [actions.alignLeft]: () => <AlignLeft color="#333" size={20} />,
                                [actions.indent]: () => <Play color="#333" size={20} style={{ transform: [{ rotate: '90deg' }] }} />,
                                [actions.setBold]: () => <Bold color="#333" size={20} />,
                                [actions.setItalic]: () => <Italic color="#333" size={20} />,
                                [actions.setUnderline]: () => <Underline color="#333" size={20} />,
                            }}
                            style={styles.richToolbar}
                            selectedIconTint="#7C3AED"
                            iconTint="#333"
                        />

                        {/* Font Size Button */}
                        <TouchableOpacity
                            style={styles.fontSizeButton}
                            onPress={() => setShowFontSizePicker(!showFontSizePicker)}
                        >
                            <Type color="#333" size={20} />
                            <Text style={styles.fontSizeButtonText}>Size</Text>
                        </TouchableOpacity>

                        {/* Font Style Button */}
                        <TouchableOpacity
                            style={[styles.fontSizeButton, { right: 80 }]}
                            onPress={() => setShowFontStylePicker(!showFontStylePicker)}
                        >
                            <Text style={[styles.fontSizeButtonText, { fontSize: 16, fontWeight: '700' }]}>Aa</Text>
                            <Text style={styles.fontSizeButtonText}>Font</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Font Size Picker */}
                    {showFontSizePicker && (
                        <View style={styles.fontSizePicker}>
                            <Text style={styles.fontSizePickerTitle}>Font Size</Text>
                            <View style={styles.fontSizeOptions}>
                                {[12, 14, 16, 18, 20, 24, 28, 32].map((size) => (
                                    <TouchableOpacity
                                        key={size}
                                        style={styles.fontSizeOption}
                                        onPress={() => handleFontSize(size)}
                                    >
                                        <Text style={styles.fontSizeOptionText}>{size}px</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Font Style Picker */}
                    {showFontStylePicker && (
                        <View style={styles.fontSizePicker}>
                            <Text style={styles.fontSizePickerTitle}>Font Family</Text>
                            <View style={styles.fontSizeOptions}>
                                {[
                                    { name: 'Default', value: '-apple-system, BlinkMacSystemFont, sans-serif' },
                                    { name: 'Arial', value: 'Arial, sans-serif' },
                                    { name: 'Georgia', value: 'Georgia, serif' },
                                    { name: 'Times', value: 'Times New Roman, serif' },
                                    { name: 'Courier', value: 'Courier New, monospace' },
                                    { name: 'Verdana', value: 'Verdana, sans-serif' },
                                    { name: 'Helvetica', value: 'Helvetica, sans-serif' },
                                    { name: 'Comic Sans', value: 'Comic Sans MS, cursive' },
                                ].map((font) => (
                                    <TouchableOpacity
                                        key={font.name}
                                        style={styles.fontSizeOption}
                                        onPress={() => handleFontStyle(font.value)}
                                    >
                                        <Text style={[styles.fontSizeOptionText, { fontFamily: font.value }]}>
                                            {font.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                </KeyboardAvoidingView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    titleContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: -1,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    saveButton: {
        padding: 4,
    },
    disabledButton: {
        opacity: 0.5,
    },
    body: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    bodyContent: {
        padding: 20,
    },
    titleInput: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
    },
    richEditor: {
        minHeight: 200,
        flex: 1,
    },
    toolbar: {
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        backgroundColor: '#FFFFFF',
    },
    richToolbar: {
        backgroundColor: '#FFFFFF',
        height: 60,
    },
    toolbarContent: {
        paddingHorizontal: 16,
        alignItems: 'center',
        gap: 12,
    },
    pillButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#7C3AED',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        justifyContent: 'center',
        alignItems: 'center',
        height: 36,
    },
    pillButtonText: {
        color: '#7C3AED',
        fontWeight: '600',
        fontSize: 14,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#EF4444',
        marginBottom: 20,
        textAlign: 'center',
    },
    retryButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#7C3AED',
        borderRadius: 8,
        marginBottom: 10,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    backButton: {
        padding: 10,
    },
    backButtonText: {
        color: '#6B7280',
    },
    fontSizeButton: {
        position: 'absolute',
        right: 10,
        top: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
    },
    fontSizeButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
    },
    fontSizePicker: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        padding: 16,
    },
    fontSizePickerTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
    },
    fontSizeOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    fontSizeOption: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    fontSizeOptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
});
