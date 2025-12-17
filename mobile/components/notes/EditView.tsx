import { notesApi } from '@/lib/api';
import type { Note } from '@/lib/api/types';
import { useAlert } from '@/lib/contexts/AlertContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { marked } from 'marked';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { SafeAreaView } from 'react-native-safe-area-context';

interface EditViewProps {
    noteId: string;
}

export default function EditView({ noteId }: EditViewProps) {
    const router = useRouter();
    const { showAlert } = useAlert();
    const richText = useRef<RichEditor>(null);

    const [note, setNote] = useState<Note | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Fetch note data
    useEffect(() => {
        const fetchNote = async () => {
            try {
                setLoading(true);
                const fetchedNote = await notesApi.getNoteById(noteId);
                setNote(fetchedNote);
                setTitle(fetchedNote.title);

                // Convert Markdown to HTML for the editor
                const htmlContent = convertMarkdownToHTML(fetchedNote.content);
                setContent(htmlContent);
            } catch (err: any) {
                console.error('Failed to fetch note:', err);
                showAlert('Error', err.message || 'Failed to load note');
                router.back();
            } finally {
                setLoading(false);
            }
        };

        if (noteId) {
            fetchNote();
        }
    }, [noteId]);

    // Convert Markdown to HTML and normalize heading levels
    const convertMarkdownToHTML = (markdown: string): string => {
        try {
            // Check if content is already HTML
            if (markdown.includes('<p>') || markdown.includes('<div>') || markdown.includes('<h')) {
                return normalizeHTMLHeadings(markdown);
            }

            // Convert Markdown to HTML
            let html = marked(markdown, {
                breaks: true,
                gfm: true,
            }) as string;

            // Normalize heading levels
            return normalizeHTMLHeadings(html);
        } catch (error) {
            console.error('Error converting markdown to HTML:', error);
            return markdown;
        }
    };

    // Normalize HTML headings: H1 -> H2, remove any H1
    const normalizeHTMLHeadings = (html: string): string => {
        // Replace all H1 tags (with or without attributes) with H2
        html = html.replace(/<h1(\s[^>]*)?\s*>/gi, '<h2$1>');
        html = html.replace(/<\/h1>/gi, '</h2>');

        // Extra safety: strip any remaining h1 tags that might have slipped through
        html = html.replace(/<h1[^>]*>.*?<\/h1>/gi, '');

        return html;
    };

    // Convert HTML back to Markdown for storage
    const convertHTMLToMarkdown = (html: string): string => {
        // Simple HTML to Markdown conversion
        let markdown = html;

        // Convert headings (H1 should not exist, but handle it just in case)
        markdown = markdown.replace(/<h1>(.*?)<\/h1>/gi, '# $1\n');
        markdown = markdown.replace(/<h2>(.*?)<\/h2>/gi, '# $1\n');
        markdown = markdown.replace(/<h3>(.*?)<\/h3>/gi, '## $1\n');

        // Convert bold
        markdown = markdown.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
        markdown = markdown.replace(/<b>(.*?)<\/b>/gi, '**$1**');

        // Convert italic
        markdown = markdown.replace(/<em>(.*?)<\/em>/gi, '*$1*');
        markdown = markdown.replace(/<i>(.*?)<\/i>/gi, '*$1*');

        // Convert underline (Markdown doesn't have native underline, keep as HTML)
        // markdown = markdown.replace(/<u>(.*?)<\/u>/gi, '<u>$1</u>');

        // Convert lists
        markdown = markdown.replace(/<ul>(.*?)<\/ul>/gis, (match, content) => {
            return content.replace(/<li>(.*?)<\/li>/gi, '* $1\n');
        });

        markdown = markdown.replace(/<ol>(.*?)<\/ol>/gis, (match, content) => {
            let counter = 1;
            return content.replace(/<li>(.*?)<\/li>/gi, () => `${counter++}. $1\n`);
        });

        // Convert blockquotes
        markdown = markdown.replace(/<blockquote>(.*?)<\/blockquote>/gi, '> $1\n');

        // Convert paragraphs
        markdown = markdown.replace(/<p>(.*?)<\/p>/gi, '$1\n\n');

        // Remove remaining HTML tags
        markdown = markdown.replace(/<[^>]*>/g, '');

        // Clean up extra newlines
        markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();

        return markdown;
    };

    // Handle save
    const handleSave = async () => {
        try {
            setSaving(true);

            // Get HTML content from editor
            const htmlContent = await richText.current?.getContentHtml();

            if (!htmlContent) {
                showAlert('Error', 'Failed to get editor content');
                return;
            }

            // Convert HTML back to Markdown for storage
            const markdownContent = convertHTMLToMarkdown(htmlContent);

            // Update note
            await notesApi.updateNote(noteId, {
                title: title.trim(),
                content: markdownContent,
            });

            showAlert('Success', 'Note saved successfully');
            router.back();
        } catch (err: any) {
            console.error('Failed to save note:', err);
            showAlert('Error', err.message || 'Failed to save note');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF6900" />
                    <Text style={styles.loadingText}>Loading note...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                    <Feather name="arrow-left" size={24} color="#111827" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Edit Note</Text>

                <TouchableOpacity
                    onPress={handleSave}
                    style={styles.headerButton}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color="#FF6900" />
                    ) : (
                        <Feather name="check" size={24} color="#FF6900" />
                    )}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
                keyboardVerticalOffset={0}
            >
                {/* Title Input - Outside Editor */}
                <View style={styles.titleContainer}>
                    <TextInput
                        style={styles.titleInput}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Note Title"
                        placeholderTextColor="#9CA3AF"
                        multiline
                    />
                </View>

                {/* Rich Text Editor */}
                <RichEditor
                    ref={richText}
                    style={styles.richEditor}
                    initialContentHTML={content}
                    placeholder="Start writing your note..."
                    onChange={(html) => setContent(html)}
                    editorStyle={{
                        backgroundColor: '#FFFFFF',
                        color: '#111827',
                        placeholderColor: '#9CA3AF',
                        contentCSSText: `
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              font-size: 16px;
              line-height: 26px;
              color: #111827;
              padding: 0 20px;
              padding-bottom: 100px;
            `,
                        cssText: `
              h1 {
                display: none !important;
              }
              h2 {
                font-size: 22px;
                font-weight: 600;
                color: #7C3AED;
                margin-top: 20px;
                margin-bottom: 12px;
                line-height: 30px;
              }
              h3 {
                font-size: 19px;
                font-weight: 600;
                color: #4B5563;
                margin-top: 16px;
                margin-bottom: 10px;
                line-height: 26px;
              }
              p {
                font-size: 16px;
                line-height: 26px;
                color: #111827;
                margin-bottom: 14px;
              }
              ul, ol {
                margin-bottom: 14px;
                padding-left: 24px;
              }
              li {
                margin-bottom: 8px;
                line-height: 26px;
              }
              blockquote {
                border-left: 4px solid #7C3AED;
                padding-left: 16px;
                margin: 16px 0;
                color: #4B5563;
                font-style: italic;
              }
              strong {
                font-weight: 700;
                color: #111827;
              }
              em {
                font-style: italic;
              }
              u {
                text-decoration: underline;
              }
            `,
                    }}
                    useContainer={false}
                    scrollEnabled={true}
                />

                {/* Rich Text Toolbar */}
                <RichToolbar
                    editor={richText}
                    actions={[
                        actions.heading3,
                        actions.setBold,
                        actions.setItalic,
                        actions.setUnderline,
                        actions.insertBulletsList,
                        actions.insertOrderedList,
                        actions.blockquote,
                    ]}
                    iconMap={{
                        [actions.heading3]: ({ tintColor }: any) => (
                            <Text style={[styles.toolbarIcon, { color: tintColor }]}>H3</Text>
                        ),
                    }}
                    style={styles.richToolbar}
                    selectedIconTint="#FF6900"
                    iconTint="#6B7280"
                    disabledIconTint="#D1D5DB"
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
    },
    headerButton: {
        padding: 8,
        width: 40,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#111827',
    },
    keyboardView: {
        flex: 1,
    },
    titleContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: '#FFFFFF',
    },
    titleInput: {
        fontSize: 28,
        fontWeight: '700',
        color: '#111827',
        lineHeight: 36,
        padding: 0,
        margin: 0,
    },
    richEditor: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    richToolbar: {
        backgroundColor: '#F9FAFB',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        height: 50,
        paddingHorizontal: 8,
    },
    toolbarIcon: {
        fontSize: 14,
        fontWeight: '700',
    },
});
