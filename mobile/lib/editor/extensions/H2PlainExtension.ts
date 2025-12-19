/**
 * H2PlainExtension
 * Custom TipTap extension for H2 subsection headings with plain styling.
 * 
 * Features:
 * - Dark gray text (#555555)
 * - 16px semibold font
 * - 12px top margin, 8px bottom margin
 * - No background
 * 
 * Requirements: 5.1, 5.2, 5.3
 */

import { Node, mergeAttributes } from '@tiptap/core';
import { COLORS, TYPOGRAPHY } from '../constants';

export interface H2PlainOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    h2Plain: {
      /**
       * Set a H2 plain node
       */
      setH2Plain: () => ReturnType;
      /**
       * Toggle H2 plain node
       */
      toggleH2Plain: () => ReturnType;
    };
  }
}

export const H2PlainExtension = Node.create<H2PlainOptions>({
  name: 'h2Plain',

  // H2 is a block-level element
  group: 'block',

  // H2 can contain inline content (text with marks)
  content: 'inline*',

  // Defining means this node type is significant for the document structure
  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: 'h3[data-type="h2-plain"]',
      },
      {
        tag: 'div[data-type="h2-plain"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'h2-plain',
        style: `
          font-size: ${TYPOGRAPHY.h2.fontSize}px;
          font-weight: ${TYPOGRAPHY.h2.fontWeight};
          color: ${TYPOGRAPHY.h2.color};
          margin-top: ${TYPOGRAPHY.h2.marginTop}px;
          margin-bottom: ${TYPOGRAPHY.h2.marginBottom}px;
          line-height: 1.4;
        `.replace(/\s+/g, ' ').trim(),
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setH2Plain:
        () =>
        ({ commands }) => {
          return commands.setNode(this.name);
        },
      toggleH2Plain:
        () =>
        ({ commands, editor }) => {
          // Check if current node is h2Plain
          const { $from } = editor.state.selection;
          const node = $from.node($from.depth);
          
          if (node.type.name === 'h2Plain') {
            // Convert to paragraph
            return commands.setNode('paragraph');
          }
          
          // Convert to h2Plain
          return commands.setNode(this.name);
        },
    };
  },
});

export default H2PlainExtension;
