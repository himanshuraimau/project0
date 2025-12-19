/**
 * ListExtensions
 * Custom TipTap extensions for bullet and ordered lists.
 * 
 * Features:
 * - Bullet list: dot bullets (•), 24px indent, 8px spacing
 * - Ordered list: 1. 2. 3. format, 24px indent, 8px spacing
 * 
 * Requirements: 7.1, 7.2, 7.3
 */

import { Node, mergeAttributes } from '@tiptap/core';
import { LAYOUT } from '../constants';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    bulletList: {
      /**
       * Toggle a bullet list
       */
      toggleBulletList: () => ReturnType;
    };
    orderedList: {
      /**
       * Toggle an ordered list
       */
      toggleOrderedList: () => ReturnType;
    };
  }
}

export interface BulletListOptions {
  HTMLAttributes: Record<string, unknown>;
  itemTypeName: string;
}

export interface OrderedListOptions {
  HTMLAttributes: Record<string, unknown>;
  itemTypeName: string;
}

export interface ListItemOptions {
  HTMLAttributes: Record<string, unknown>;
}

/**
 * ListItem Extension
 * Shared list item node for both bullet and ordered lists.
 */
export const ListItemExtension = Node.create<ListItemOptions>({
  name: 'listItem',

  group: 'block',

  content: 'paragraph block*',

  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: 'li',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'li',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        style: `
          margin-bottom: ${LAYOUT.listItemSpacing}px;
        `.replace(/\s+/g, ' ').trim(),
      }),
      0,
    ];
  },
});

/**
 * BulletList Extension
 * Unordered list with dot bullets and proper indentation.
 */
export const BulletListExtension = Node.create<BulletListOptions>({
  name: 'bulletList',

  group: 'block',

  content: 'listItem+',

  addOptions() {
    return {
      HTMLAttributes: {},
      itemTypeName: 'listItem',
    };
  },

  parseHTML() {
    return [
      {
        tag: 'ul',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'ul',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        style: `
          list-style-type: disc;
          padding-left: ${LAYOUT.listIndent}px;
          margin: 0;
        `.replace(/\s+/g, ' ').trim(),
      }),
      0,
    ];
  },

  addCommands() {
    return {
      toggleBulletList:
        () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ commands, editor }: any) => {
          const { $from } = editor.state.selection;
          const node = $from.node($from.depth - 1);
          
          if (node?.type.name === 'bulletList') {
            // Exit bullet list - convert to paragraph
            return commands.liftListItem('listItem');
          }
          
          // Wrap in bullet list
          return commands.wrapInList('bulletList');
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      'Mod-Shift-8': () => (this.editor as any).commands.toggleBulletList(),
    };
  },
});

/**
 * OrderedList Extension
 * Numbered list with 1. 2. 3. format and proper indentation.
 */
export const OrderedListExtension = Node.create<OrderedListOptions>({
  name: 'orderedList',

  group: 'block',

  content: 'listItem+',

  addOptions() {
    return {
      HTMLAttributes: {},
      itemTypeName: 'listItem',
    };
  },

  addAttributes() {
    return {
      start: {
        default: 1,
        parseHTML: (element) => {
          return element.hasAttribute('start')
            ? parseInt(element.getAttribute('start') || '1', 10)
            : 1;
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'ol',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { start, ...rest } = HTMLAttributes;
    
    return [
      'ol',
      mergeAttributes(this.options.HTMLAttributes, rest, {
        start: start !== 1 ? start : undefined,
        style: `
          list-style-type: decimal;
          padding-left: ${LAYOUT.listIndent}px;
          margin: 0;
        `.replace(/\s+/g, ' ').trim(),
      }),
      0,
    ];
  },

  addCommands() {
    return {
      toggleOrderedList:
        () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ commands, editor }: any) => {
          const { $from } = editor.state.selection;
          const node = $from.node($from.depth - 1);
          
          if (node?.type.name === 'orderedList') {
            // Exit ordered list - convert to paragraph
            return commands.liftListItem('listItem');
          }
          
          // Wrap in ordered list
          return commands.wrapInList('orderedList');
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      'Mod-Shift-7': () => (this.editor as any).commands.toggleOrderedList(),
    };
  },
});

export default {
  ListItemExtension,
  BulletListExtension,
  OrderedListExtension,
};
