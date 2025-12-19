/**
 * H1BoxedExtension
 * Custom TipTap extension for H1 section headers with boxed styling.
 * 
 * Features:
 * - Lavender background (#F3EDFF)
 * - 8px border radius
 * - Purple text (#7A2EFF)
 * - 18px semibold font
 * - 16px top margin, 12px bottom margin
 * - Enter key exits to body block
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { Node, mergeAttributes } from '@tiptap/core';
import { COLORS, TYPOGRAPHY } from '../constants';

export interface H1BoxedOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    h1Boxed: {
      /**
       * Set a H1 boxed node
       */
      setH1Boxed: () => ReturnType;
      /**
       * Toggle H1 boxed node
       */
      toggleH1Boxed: () => ReturnType;
    };
  }
}

export const H1BoxedExtension = Node.create<H1BoxedOptions>({
  name: 'h1Boxed',

  // H1 is a block-level element
  group: 'block',

  // H1 can contain inline content (text with marks)
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
        tag: 'h2[data-type="h1-boxed"]',
      },
      {
        tag: 'div[data-type="h1-boxed"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'h1-boxed',
        style: `
          font-size: ${TYPOGRAPHY.h1.fontSize}px;
          font-weight: ${TYPOGRAPHY.h1.fontWeight};
          color: ${TYPOGRAPHY.h1.color};
          background-color: ${TYPOGRAPHY.h1.backgroundColor};
          border-radius: ${TYPOGRAPHY.h1.borderRadius}px;
          padding: ${TYPOGRAPHY.h1.paddingVertical}px ${TYPOGRAPHY.h1.paddingHorizontal}px;
          margin-top: ${TYPOGRAPHY.h1.marginTop}px;
          margin-bottom: ${TYPOGRAPHY.h1.marginBottom}px;
          line-height: 1.4;
        `.replace(/\s+/g, ' ').trim(),
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setH1Boxed:
        () =>
        ({ commands }) => {
          return commands.setNode(this.name);
        },
      toggleH1Boxed:
        () =>
        ({ commands, editor }) => {
          // Check if current node is h1Boxed
          const { $from } = editor.state.selection;
          const node = $from.node($from.depth);
          
          if (node.type.name === 'h1Boxed') {
            // Convert to paragraph
            return commands.setNode('paragraph');
          }
          
          // Convert to h1Boxed
          return commands.setNode(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      // When Enter is pressed in H1, exit to body block (paragraph)
      Enter: ({ editor }) => {
        const { $from } = editor.state.selection;
        const node = $from.node($from.depth);
        
        if (node.type.name === 'h1Boxed') {
          // Insert a new paragraph after the H1 block
          return editor.chain()
            .insertContentAt($from.end() + 1, { type: 'paragraph' })
            .focus()
            .run();
        }
        
        return false;
      },
    };
  },
});

export default H1BoxedExtension;
