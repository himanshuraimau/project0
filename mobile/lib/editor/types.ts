/**
 * Editor Types
 * Type definitions for the rich text editor based on the design specification.
 */

/**
 * Block types supported by the editor.
 * - title: First block, locked styling (24px bold black)
 * - h1: Boxed heading with purple text on lavender background
 * - h2: Plain heading with dark gray text
 * - body: Standard paragraph text
 */
export type BlockType = 'title' | 'h1' | 'h2' | 'body';

/**
 * Cursor position within the editor.
 */
export interface CursorPosition {
  blockIndex: number;
  blockType: BlockType;
  offset: number;
}

/**
 * Text marks that can be applied to inline content.
 */
export interface TextMark {
  type: 'bold' | 'italic' | 'underline';
}

/**
 * Inline content within a block.
 */
export interface InlineContent {
  type: 'text';
  text: string;
  marks?: TextMark[];
}

/**
 * Block attributes for headings and paragraphs.
 */
export interface BlockAttributes {
  level?: 1 | 2;
  textAlign?: 'left' | 'center' | 'right';
}

/**
 * A single block in the editor document.
 */
export interface EditorBlock {
  type: 'title' | 'heading' | 'paragraph' | 'bulletList' | 'orderedList';
  attrs?: BlockAttributes;
  content?: InlineContent[];
}

/**
 * The complete editor document structure.
 */
export interface EditorContent {
  type: 'doc';
  content: EditorBlock[];
}

/**
 * Toolbar button configuration.
 */
export interface ToolbarButton {
  id: string;
  icon: string | React.ReactNode;
  action: () => void;
  isActive: boolean;
  isDisabled: boolean;
}

/**
 * Header selector display labels.
 */
export type HeaderSelectorLabel = 'Header 1' | 'Header 2' | 'Body';

/**
 * Props for the EditorHeader component.
 */
export interface EditorHeaderProps {
  onBack: () => void;
  onSave: () => void;
  saving: boolean;
}

/**
 * Props for the ContentEditor component.
 */
export interface ContentEditorProps {
  initialContent: string;
  onContentChange: (content: EditorContent) => void;
  onBlockTypeChange: (blockType: BlockType) => void;
  onCursorChange: (position: CursorPosition) => void;
}

/**
 * Text alignment options.
 */
export type TextAlignment = 'left' | 'center' | 'right';

/**
 * Props for the RichTextToolbar component.
 */
export interface RichTextToolbarProps {
  currentBlockType: BlockType;
  isTitleBlock: boolean;
  keyboardHeight: number;
  onBlockTypeChange: (blockType: BlockType) => void;
  onToggleBold: () => void;
  onToggleItalic: () => void;
  onToggleUnderline: () => void;
  onToggleBulletList: () => void;
  onToggleOrderedList: () => void;
  onSetAlignment: (align: TextAlignment) => void;
  isBoldActive: boolean;
  isItalicActive: boolean;
  isUnderlineActive: boolean;
  isBulletListActive: boolean;
  isOrderedListActive: boolean;
  currentAlignment: TextAlignment;
}

/**
 * Props for the HeaderSelector component.
 */
export interface HeaderSelectorProps {
  currentType: HeaderSelectorLabel;
  onSelect: (type: BlockType) => void;
  disabled: boolean;
}
