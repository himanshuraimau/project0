/**
 * TitleExtension
 * Custom TipTap extension for the document title (first block).
 * 
 * Features:
 * - 24px bold black styling
 * - Locked to first block position
 * - Prevents heading changes
 * - Enter key creates body block
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

import { Node, mergeAttributes } from '@tiptap/core';
import { COLORS, TYPOGRAPHY } from '../constants';

export interface TitleOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    title: {
      /**
       * Set a title node
       */
      setTitle: () => ReturnType;
    };
  }
}

export const TitleExtension = Node.create<TitleOptions>({
  name: 'title',

  // Title is a block-level element
  group: 'block',

  // Title can contain inline content (text with marks)
  content: 'inline*',

  // Title should be the first element in the document
  defining: true,

  // Prevent title from being deleted or merged
  isolating: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: 'h1[data-type="title"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'h1',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'title',
        style: `
          font-size: ${TYPOGRAPHY.title.fontSize}px;
          font-weight: ${TYPOGRAPHY.title.fontWeight};
          color: ${TYPOGRAPHY.title.color};
          padding-bottom: ${TYPOGRAPHY.title.paddingBottom}px;
          margin: 0;
          line-height: 1.3;
        `.replace(/\s+/g, ' ').trim(),
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setTitle:
        () =>
        ({ commands }) => {
          return commands.setNode(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      // When Enter is pressed in title, create a new paragraph (body block)
      Enter: ({ editor }) => {
        // Check if we're in a title block
        const { $from } = editor.state.selection;
        const node = $from.node($from.depth);
        
        if (node.type.name === 'title') {
          // Insert a new paragraph after the title
          return editor.chain()
            .insertContentAt($from.end() + 1, { type: 'paragraph' })
            .focus()
            .run();
        }
        
        return false;
      },
      // Prevent backspace from deleting the title block entirely
      Backspace: ({ editor }) => {
        const { $from, empty } = editor.state.selection;
        const node = $from.node($from.depth);
        
        // If we're at the start of the title and it's empty, prevent deletion
        if (node.type.name === 'title' && empty && $from.parentOffset === 0) {
          // Don't delete the title block, just prevent the action
          if (node.content.size === 0) {
            return true;
          }
        }
        
        return false;
      },
    };
  },
});

export default TitleExtension;
