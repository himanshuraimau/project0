/**
 * Editor Configuration
 * Pre-configured extension set for the rich text editor.
 * 
 * This file provides a ready-to-use configuration that includes:
 * - Title extension (locked first block)
 * - H1 boxed extension (purple boxed style)
 * - H2 plain extension (gray subsection style)
 * - Body text extension (paragraph styling)
 * - List extensions (bullet and ordered lists)
 * - Standard marks (bold, italic, underline)
 */

import { TitleExtension } from './TitleExtension';
import { H1BoxedExtension } from './H1BoxedExtension';
import { H2PlainExtension } from './H2PlainExtension';
import { BodyTextExtension } from './BodyTextExtension';
import { ListItemExtension, BulletListExtension, OrderedListExtension } from './ListExtensions';

/**
 * Get all custom block extensions for the editor.
 * These define the document structure and block types.
 */
export const getBlockExtensions = () => [
  TitleExtension,
  H1BoxedExtension,
  H2PlainExtension,
  BodyTextExtension,
  ListItemExtension,
  BulletListExtension,
  OrderedListExtension,
];

/**
 * CSS styles for the editor content area.
 * These styles are applied to the WebView that renders the editor.
 */
export const getEditorStyles = () => `
  /* Title styling */
  h1[data-type="title"] {
    font-size: 24px;
    font-weight: 700;
    color: #000000;
    padding-bottom: 16px;
    margin: 0;
    line-height: 1.3;
  }

  /* H1 Boxed styling */
  div[data-type="h1-boxed"] {
    font-size: 18px;
    font-weight: 600;
    color: #7A2EFF;
    background-color: #F3EDFF;
    border-radius: 8px;
    padding: 8px 12px;
    margin-top: 16px;
    margin-bottom: 12px;
    line-height: 1.4;
  }

  /* H2 Plain styling */
  div[data-type="h2-plain"] {
    font-size: 16px;
    font-weight: 600;
    color: #555555;
    margin-top: 12px;
    margin-bottom: 8px;
    line-height: 1.4;
  }

  /* Body text styling */
  p {
    font-size: 15px;
    font-weight: 400;
    color: #000000;
    line-height: 24px;
    margin: 0;
    padding: 0;
  }

  /* Bullet list styling */
  ul {
    list-style-type: disc;
    padding-left: 24px;
    margin: 0;
  }

  /* Ordered list styling */
  ol {
    list-style-type: decimal;
    padding-left: 24px;
    margin: 0;
  }

  /* List item styling */
  li {
    margin-bottom: 8px;
  }

  /* Bold mark */
  strong {
    font-weight: 700;
  }

  /* Italic mark */
  em {
    font-style: italic;
  }

  /* Underline mark */
  u {
    text-decoration: underline;
  }

  /* Editor container */
  .ProseMirror {
    outline: none;
    padding: 16px;
    min-height: 100%;
  }

  /* Placeholder styling */
  .ProseMirror p.is-editor-empty:first-child::before {
    color: #adb5bd;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }
`;

/**
 * Block type names used in the editor.
 */
export const BLOCK_TYPE_NAMES = {
  TITLE: 'title',
  H1_BOXED: 'h1Boxed',
  H2_PLAIN: 'h2Plain',
  PARAGRAPH: 'paragraph',
  BULLET_LIST: 'bulletList',
  ORDERED_LIST: 'orderedList',
  LIST_ITEM: 'listItem',
} as const;

/** Heading block type names */
const HEADING_TYPES: readonly string[] = [
  BLOCK_TYPE_NAMES.TITLE,
  BLOCK_TYPE_NAMES.H1_BOXED,
  BLOCK_TYPE_NAMES.H2_PLAIN,
];

/** List block type names */
const LIST_TYPES: readonly string[] = [
  BLOCK_TYPE_NAMES.BULLET_LIST,
  BLOCK_TYPE_NAMES.ORDERED_LIST,
];

/**
 * Check if a block type is a heading type.
 */
export const isHeadingType = (blockType: string): boolean => {
  return HEADING_TYPES.includes(blockType);
};

/**
 * Check if a block type is the title block.
 */
export const isTitleBlock = (blockType: string): boolean => {
  return blockType === BLOCK_TYPE_NAMES.TITLE;
};

/**
 * Check if a block type is a list type.
 */
export const isListType = (blockType: string): boolean => {
  return LIST_TYPES.includes(blockType);
};

export default {
  getBlockExtensions,
  getEditorStyles,
  BLOCK_TYPE_NAMES,
  isHeadingType,
  isTitleBlock,
  isListType,
};
