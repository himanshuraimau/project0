/**
 * BodyTextExtension
 * Custom TipTap extension for body text (paragraph) styling.
 * 
 * Features:
 * - Black text (#000000)
 * - 15px font size
 * - Regular (400) weight
 * - 1.6 line height (24px)
 * 
 * Requirements: 6.1, 6.2
 */

import { Node, mergeAttributes } from '@tiptap/core';
import { COLORS, TYPOGRAPHY } from '../constants';

export interface BodyTextOptions {
  HTMLAttributes: Record<string, unknown>;
}

export const BodyTextExtension = Node.create<BodyTextOptions>({
  name: 'paragraph',

  // Paragraph is a block-level element
  group: 'block',

  // Paragraph can contain inline content (text with marks)
  content: 'inline*',

  // Priority to override default paragraph
  priority: 1000,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: 'p',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'p',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        style: `
          font-size: ${TYPOGRAPHY.body.fontSize}px;
          font-weight: ${TYPOGRAPHY.body.fontWeight};
          color: ${TYPOGRAPHY.body.color};
          line-height: ${TYPOGRAPHY.body.lineHeight}px;
          margin: 0;
          padding: 0;
        `.replace(/\s+/g, ' ').trim(),
      }),
      0,
    ];
  },
});

export default BodyTextExtension;
