/**
 * EditView Component
 * Main container for the rich text editor with 4-layer fixed layout architecture.
 * Requirements: 1.1, 1.2, 1.3, 1.4, 2.4, 3.1, 9.3
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useKeyboard } from '@10play/tentap-editor';

import { notesApi } from '@/lib/api';
import type { Note } from '@/lib/api/types';
import { useAlert } from '@/lib/contexts/AlertContext';
import { COLORS, LAYOUT } from '@/lib/editor/constants';
import { markdownToTipTap } from '@/lib/editor/converters';
import type { BlockType, CursorPosition, EditorContent, TextAlignment } from '@/lib/editor/types';

import {
  EditorHeader,
  ContentEditor,
  RichTextToolbar,
  type ContentEditorRef,
} from './editor';

interface EditViewProps {
  noteId: string;
}

export default function EditView({ noteId }: EditViewProps) {
  const router = useRouter();
  const { showAlert } = useAlert();
  const editorRef = useRef<ContentEditorRef>(null);

  // Note state
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialContent, setInitialContent] = useState('');

  // Editor state
  const [currentBlockType, setCurrentBlockType] = useState<BlockType>('body');
  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({
    blockIndex: 0,
    blockType: 'body',
    offset: 0,
  });

  // Use TenTap's keyboard hook for proper WebView keyboard handling
  const { isKeyboardUp, keyboardHeight } = useKeyboard();
  const toolbarPosition = useRef(new Animated.Value(0)).current;

  // Formatting state (reactive from editor)
  const [isBoldActive, setIsBoldActive] = useState(false);
  const [isItalicActive, setIsItalicActive] = useState(false);
  const [isUnderlineActive, setIsUnderlineActive] = useState(false);
  const [isBulletListActive, setIsBulletListActive] = useState(false);
  const [isOrderedListActive, setIsOrderedListActive] = useState(false);
  const [currentAlignment, setCurrentAlignment] = useState<TextAlignment>('left');

  // Animate toolbar position when keyboard state changes
  useEffect(() => {
    Animated.timing(toolbarPosition, {
      toValue: keyboardHeight,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [keyboardHeight, toolbarPosition]);

  /**
   * Load note and convert markdown to HTML for editor
   * Requirements: 3.1 - Fetch note and convert markdown to TipTap JSON
   */
  useEffect(() => {
    const fetchNote = async () => {
      try {
        setLoading(true);
        const fetchedNote = await notesApi.getNoteById(noteId);
        setNote(fetchedNote);
        
        // Convert markdown to TipTap JSON, then to HTML for the editor
        const tipTapDoc = markdownToTipTap(fetchedNote.content || '');
        const htmlContent = tipTapDocToHTML(tipTapDoc);
        setInitialContent(htmlContent);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load note';
        console.error('Failed to fetch note:', err);
        showAlert('Error', errorMessage);
        router.back();
      } finally {
        setLoading(false);
      }
    };

    if (noteId) {
      fetchNote();
    }
  }, [noteId, showAlert, router]);

  /**
   * Convert TipTap JSON document to HTML for the editor
   * This bridges the gap between our markdown converter and the HTML-based editor
   */
  const tipTapDocToHTML = (doc: ReturnType<typeof markdownToTipTap>): string => {
    if (!doc.content || doc.content.length === 0) {
      return '<p></p>';
    }

    return doc.content.map((block) => {
      const content = blockContentToHTML(block.content);
      
      switch (block.type) {
        case 'title':
          // Title becomes h1 in HTML (first block)
          return `<h1>${content}</h1>`;
        case 'h1Boxed':
          // H1 boxed becomes h2 in HTML
          return `<h2>${content}</h2>`;
        case 'h2Plain':
          // H2 plain becomes h3 in HTML
          return `<h3>${content}</h3>`;
        case 'bulletList':
          return `<ul>${(block.content || []).map(item => {
            if (item.type === 'listItem' && item.content) {
              const paragraph = item.content.find(n => n.type === 'paragraph');
              const itemContent = paragraph ? blockContentToHTML(paragraph.content) : '';
              return `<li>${itemContent}</li>`;
            }
            return '';
          }).join('')}</ul>`;
        case 'orderedList':
          return `<ol>${(block.content || []).map(item => {
            if (item.type === 'listItem' && item.content) {
              const paragraph = item.content.find(n => n.type === 'paragraph');
              const itemContent = paragraph ? blockContentToHTML(paragraph.content) : '';
              return `<li>${itemContent}</li>`;
            }
            return '';
          }).join('')}</ol>`;
        case 'paragraph':
        default:
          return `<p>${content}</p>`;
      }
    }).join('');
  };

  /**
   * Convert TipTap block content (inline nodes) to HTML
   */
  const blockContentToHTML = (content?: Array<{ type: string; text?: string; marks?: Array<{ type: string }> }>): string => {
    if (!content) return '';
    
    return content.map(node => {
      if (node.type === 'text' && node.text) {
        let text = node.text;
        
        // Apply marks
        if (node.marks) {
          for (const mark of node.marks) {
            switch (mark.type) {
              case 'bold':
                text = `<strong>${text}</strong>`;
                break;
              case 'italic':
                text = `<em>${text}</em>`;
                break;
              case 'underline':
                text = `<u>${text}</u>`;
                break;
            }
          }
        }
        
        return text;
      }
      return '';
    }).join('');
  };

  /**
   * Convert HTML from editor to markdown for saving
   * Requirements: 2.4 - Convert TipTap JSON to markdown on save
   */
  const convertHTMLToMarkdown = (html: string): string => {
    let markdown = html;
    // Convert h1 (title) to # heading
    markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n');
    // Convert h2 (H1 boxed) to ## heading
    markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n');
    // Convert h3 (H2 plain) to ### heading
    markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n');
    // Convert strong/b to bold
    markdown = markdown.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
    markdown = markdown.replace(/<b>(.*?)<\/b>/gi, '**$1**');
    // Convert em/i to italic
    markdown = markdown.replace(/<em>(.*?)<\/em>/gi, '*$1*');
    markdown = markdown.replace(/<i>(.*?)<\/i>/gi, '*$1*');
    // Convert u to underline (non-standard markdown, using __)
    markdown = markdown.replace(/<u>(.*?)<\/u>/gi, '__$1__');
    // Convert unordered lists
    markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (_match, content) => {
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
    });
    // Convert ordered lists
    markdown = markdown.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (_match, content) => {
      let counter = 1;
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${counter++}. \n`);
    });
    // Convert blockquotes
    markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n');
    // Convert paragraphs
    markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
    // Convert line breaks
    markdown = markdown.replace(/<br\s*\/?>/gi, '\n');
    // Remove remaining HTML tags
    markdown = markdown.replace(/<[^>]*>/g, '');
    // Clean up excessive newlines
    markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();
    // Decode HTML entities
    markdown = markdown.replace(/&nbsp;/g, ' ');
    markdown = markdown.replace(/&amp;/g, '&');
    markdown = markdown.replace(/&lt;/g, '<');
    markdown = markdown.replace(/&gt;/g, '>');
    markdown = markdown.replace(/&quot;/g, '"');
    
    return markdown;
  };

  /**
   * Save note with content conversion
   * Requirements: 2.4 - Convert TipTap JSON to markdown on save, handle save errors with alerts
   */
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Get HTML content from editor
      const htmlContent = await editorRef.current?.getContent();
      if (!htmlContent) {
        showAlert('Error', 'Failed to get editor content. Please try again.');
        return;
      }
      
      // Convert HTML to markdown for storage
      const markdownContent = convertHTMLToMarkdown(htmlContent);
      
      // Extract title from the first line if it's a heading
      let title = note?.title || 'Untitled';
      const titleMatch = markdownContent.match(/^#\s+(.+)$/m);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }
      
      // Save to API
      await notesApi.updateNote(noteId, {
        title,
        content: markdownContent,
      });
      
      showAlert('Success', 'Note saved successfully');
      router.back();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save note';
      console.error('Failed to save note:', err);
      showAlert('Error', `Save failed: ${errorMessage}. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleContentChange = useCallback((_content: EditorContent) => {
    // Content managed internally by editor
  }, []);

  const handleBlockTypeChange = useCallback((blockType: BlockType) => {
    setCurrentBlockType(blockType);
    if (editorRef.current) {
      setIsBoldActive(editorRef.current.isBoldActive());
      setIsItalicActive(editorRef.current.isItalicActive());
      setIsUnderlineActive(editorRef.current.isUnderlineActive());
      setIsBulletListActive(editorRef.current.isBulletListActive());
      setIsOrderedListActive(editorRef.current.isOrderedListActive());
      setCurrentAlignment(editorRef.current.getCurrentAlignment());
    }
  }, []);

  const handleCursorChange = useCallback((position: CursorPosition) => {
    setCursorPosition(position);
  }, []);

  const handleToggleBold = useCallback(() => {
    editorRef.current?.toggleBold();
    setIsBoldActive(!isBoldActive);
  }, [isBoldActive]);

  const handleToggleItalic = useCallback(() => {
    editorRef.current?.toggleItalic();
    setIsItalicActive(!isItalicActive);
  }, [isItalicActive]);

  const handleToggleUnderline = useCallback(() => {
    editorRef.current?.toggleUnderline();
    setIsUnderlineActive(!isUnderlineActive);
  }, [isUnderlineActive]);

  const handleToggleBulletList = useCallback(() => {
    editorRef.current?.toggleBulletList();
    setIsBulletListActive(!isBulletListActive);
  }, [isBulletListActive]);

  const handleToggleOrderedList = useCallback(() => {
    editorRef.current?.toggleOrderedList();
    setIsOrderedListActive(!isOrderedListActive);
  }, [isOrderedListActive]);

  const handleSetAlignment = useCallback((align: TextAlignment) => {
    editorRef.current?.setAlignment(align);
    setCurrentAlignment(align);
  }, []);

  const handleBlockTypeSelect = useCallback((type: BlockType) => {
    editorRef.current?.setBlockType(type);
    setCurrentBlockType(type);
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.saveOrange} />
          <Text style={styles.loadingText}>Loading note...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate bottom padding for content area
  // SafeAreaView with edges=['top', 'bottom'] handles safe area insets
  const contentBottomPadding = keyboardHeight + LAYOUT.toolbarHeight;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      <EditorHeader onBack={handleBack} onSave={handleSave} saving={saving} />
      <View style={[styles.editorContainer, { paddingBottom: contentBottomPadding }]}>
        <ContentEditor
          ref={editorRef}
          initialContent={initialContent}
          onContentChange={handleContentChange}
          onBlockTypeChange={handleBlockTypeChange}
          onCursorChange={handleCursorChange}
        />
      </View>
      <Animated.View style={[
        styles.toolbarContainer, 
        { 
          bottom: toolbarPosition,
        }
      ]}>
        <RichTextToolbar
          currentBlockType={currentBlockType}
          isTitleBlock={cursorPosition.blockType === 'title'}
          keyboardHeight={0}
          onBlockTypeChange={handleBlockTypeSelect}
          onToggleBold={handleToggleBold}
          onToggleItalic={handleToggleItalic}
          onToggleUnderline={handleToggleUnderline}
          onToggleBulletList={handleToggleBulletList}
          onToggleOrderedList={handleToggleOrderedList}
          onSetAlignment={handleSetAlignment}
          isBoldActive={isBoldActive}
          isItalicActive={isItalicActive}
          isUnderlineActive={isUnderlineActive}
          isBulletListActive={isBulletListActive}
          isOrderedListActive={isOrderedListActive}
          currentAlignment={currentAlignment}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.darkGray,
  },
  editorContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  toolbarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
  },
});
