/**
 * ContentEditor Component
 * TipTap-based rich text editor with custom extensions.
 * Requirements: 9.1, 9.2
 */

import React, { useCallback, useEffect, useImperativeHandle, forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  RichText,
  useEditorBridge,
  TenTapStartKit,
  CoreBridge,
  useBridgeState,
} from '@10play/tentap-editor';
import { COLORS, LAYOUT } from '@/lib/editor/constants';
import { getEditorStyles } from '@/lib/editor/extensions';
import type { BlockType, ContentEditorProps, CursorPosition } from '@/lib/editor/types';

/**
 * Editor bridge reference type for external access
 */
export interface ContentEditorRef {
  getContent: () => Promise<string>;
  setContent: (html: string) => void;
  focus: () => void;
  blur: () => void;
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleUnderline: () => void;
  toggleBulletList: () => void;
  toggleOrderedList: () => void;
  setBlockType: (type: BlockType) => void;
  setAlignment: (align: 'left' | 'center' | 'right') => void;
  isBoldActive: () => boolean;
  isItalicActive: () => boolean;
  isUnderlineActive: () => boolean;
  isBulletListActive: () => boolean;
  isOrderedListActive: () => boolean;
  getCurrentAlignment: () => 'left' | 'center' | 'right';
}

/**
 * Custom CSS for the editor content area
 */
const getCustomCSS = () => `
  ${getEditorStyles()}
  
  /* Editor container with bottom padding for toolbar clearance (Requirement 9.2) */
  .ProseMirror {
    outline: none;
    padding: 16px;
    padding-bottom: ${LAYOUT.editorBottomPadding}px;
    min-height: 100%;
  }
  
  /* Ensure proper line spacing (Requirement 9.4) */
  .ProseMirror > * + * {
    margin-top: 0.75em;
  }
  
  /* Selection styling */
  .ProseMirror ::selection {
    background: rgba(122, 46, 255, 0.2);
  }
  
  /* Placeholder styling */
  .ProseMirror p.is-empty::before {
    color: #adb5bd;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }
`;

// Note: mapNodeTypeToBlockType is available for future use when we need to map
// TipTap node types to our BlockType enum. Currently, we use headingLevel from
// editor state directly.

/**
 * ContentEditor provides a TipTap-based rich text editing experience.
 * - Scrolls independently between header and toolbar (Requirement 9.1)
 * - 80px bottom padding for toolbar clearance (Requirement 9.2)
 * - Auto-scrolls to keep cursor visible (Requirement 9.3)
 * - Adequate line spacing (Requirement 9.4)
 */
const ContentEditor = forwardRef<ContentEditorRef, ContentEditorProps>(
  function ContentEditor(
    {
      initialContent,
      onContentChange,
      onBlockTypeChange,
      onCursorChange,
    },
    ref
  ) {
    // Initialize the TipTap editor bridge
    const editor = useEditorBridge({
      autofocus: false,
      avoidIosKeyboard: true,
      initialContent: initialContent || '<p></p>',
      bridgeExtensions: [
        ...TenTapStartKit,
        CoreBridge.configureCSS(getCustomCSS()),
      ],
    });

    // Get editor state for reactive updates
    const editorState = useBridgeState(editor);

    /**
     * Determine current block type based on cursor position
     */
    const getCurrentBlockType = useCallback((): BlockType => {
      if (!editorState) return 'body';
      
      // Check heading level from editor state
      // headingLevel is undefined when not in a heading
      const headingLevel = editorState.headingLevel;
      if (headingLevel === 1) {
        return 'h1';
      }
      if (headingLevel === 2) {
        return 'h2';
      }
      
      return 'body';
    }, [editorState]);

    // Note: Content change handling is done via the ref's getContent method
    // The onContentChange callback is available for future use if we need
    // real-time content updates

    /**
     * Handle cursor position changes
     */
    const handleCursorChange = useCallback(() => {
      const blockType = getCurrentBlockType();
      const isFirstBlock = blockType === 'title';
      
      onBlockTypeChange(blockType);
      
      const position: CursorPosition = {
        blockIndex: isFirstBlock ? 0 : 1,
        blockType,
        offset: 0,
      };
      onCursorChange(position);
    }, [getCurrentBlockType, onBlockTypeChange, onCursorChange]);

    /**
     * Update block type and cursor position when editor state changes
     */
    useEffect(() => {
      if (editorState) {
        handleCursorChange();
      }
    }, [editorState, handleCursorChange]);

    /**
     * Expose editor methods via ref
     */
    useImperativeHandle(ref, () => ({
      getContent: async () => {
        try {
          return await editor.getHTML();
        } catch {
          return '';
        }
      },
      setContent: (html: string) => {
        editor.setContent(html);
      },
      focus: () => {
        editor.focus();
      },
      blur: () => {
        editor.blur();
      },
      toggleBold: () => {
        editor.toggleBold();
      },
      toggleItalic: () => {
        editor.toggleItalic();
      },
      toggleUnderline: () => {
        editor.toggleUnderline();
      },
      toggleBulletList: () => {
        editor.toggleBulletList();
      },
      toggleOrderedList: () => {
        editor.toggleOrderedList();
      },
      setBlockType: (type: BlockType) => {
        // Use toggleHeading to set heading levels
        // toggleHeading will toggle the heading on/off, so we need to handle this carefully
        switch (type) {
          case 'h1':
            editor.toggleHeading(1);
            break;
          case 'h2':
            editor.toggleHeading(2);
            break;
          case 'body':
          default:
            // To convert to body/paragraph, toggle off any active heading
            // If currently in a heading, toggling it will convert to paragraph
            const currentLevel = editorState?.headingLevel;
            if (currentLevel) {
              editor.toggleHeading(currentLevel as 1 | 2 | 3 | 4 | 5 | 6);
            }
            break;
        }
      },
      setAlignment: (_align: 'left' | 'center' | 'right') => {
        // Text alignment is not directly supported by the base TenTapStartKit
        // This would require a custom TextAlign bridge extension
        // For now, this is a no-op
        console.warn('Text alignment not supported in current editor configuration');
      },
      isBoldActive: () => editorState?.isBoldActive ?? false,
      isItalicActive: () => editorState?.isItalicActive ?? false,
      isUnderlineActive: () => editorState?.isUnderlineActive ?? false,
      isBulletListActive: () => editorState?.isBulletListActive ?? false,
      isOrderedListActive: () => editorState?.isOrderedListActive ?? false,
      getCurrentAlignment: () => {
        // Text alignment state is not available in base TenTapStartKit
        // Would require a custom TextAlign bridge extension
        return 'left';
      },
    }), [editor, editorState]);

    return (
      <View style={styles.container}>
        <RichText
          editor={editor}
          style={styles.editor}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  /**
   * Container for the editor
   * - Fills available space (flex: 1)
   * - Scrolls independently (Requirement 9.1)
   */
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  /**
   * Editor component
   * - Full width and height
   * - White background
   */
  editor: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
});

export default ContentEditor;
