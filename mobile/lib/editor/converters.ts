/**
 * Content Converters
 * Utilities for converting between Markdown and TipTap JSON format.
 * 
 * Conversion mapping:
 * - First # heading → title block
 * - ## headings → h1Boxed block
 * - ### headings → h2Plain block
 * - Regular text → paragraph block
 * - Bullet lists (- or *) → bulletList block
 * - Numbered lists (1. 2. 3.) → orderedList block
 * - **text** → bold mark
 * - *text* or _text_ → italic mark
 * - __text__ → underline mark (non-standard but supported)
 * 
 * Requirements: 3.1, 4.1, 5.1, 6.1
 */

import { EditorContent, EditorBlock, InlineContent, TextMark } from './types';
import { BLOCK_TYPE_NAMES } from './extensions/editorConfig';

/**
 * TipTap JSON node types used in the editor
 */
type TipTapNodeType = 'doc' | 'title' | 'h1Boxed' | 'h2Plain' | 'paragraph' | 'bulletList' | 'orderedList' | 'listItem' | 'text';

/**
 * TipTap JSON document structure
 */
interface TipTapDoc {
  type: 'doc';
  content: TipTapNode[];
}

/**
 * TipTap JSON node structure
 */
interface TipTapNode {
  type: TipTapNodeType;
  content?: TipTapNode[];
  text?: string;
  marks?: TipTapMark[];
  attrs?: Record<string, unknown>;
}

/**
 * TipTap JSON mark structure
 */
interface TipTapMark {
  type: 'bold' | 'italic' | 'underline';
}

/**
 * Parse inline markdown text and extract marks
 */
function parseInlineMarks(text: string): TipTapNode[] {
  const nodes: TipTapNode[] = [];
  
  // Regex patterns for inline marks
  // Order matters: check longer patterns first
  const patterns = [
    { regex: /\*\*(.+?)\*\*/g, mark: 'bold' as const },
    { regex: /__(.+?)__/g, mark: 'underline' as const },
    { regex: /\*(.+?)\*/g, mark: 'italic' as const },
    { regex: /_(.+?)_/g, mark: 'italic' as const },
  ];
  
  // Track processed ranges to avoid double-processing
  interface TextSegment {
    start: number;
    end: number;
    text: string;
    marks: TipTapMark[];
  }
  
  const segments: TextSegment[] = [];
  let lastIndex = 0;
  
  // Combined regex to find all marked text
  const combinedRegex = /(\*\*(.+?)\*\*)|(__(.+?)__)|(\*(.+?)\*)|(_(.+?)_)/g;
  let match;
  
  while ((match = combinedRegex.exec(text)) !== null) {
    // Add plain text before this match
    if (match.index > lastIndex) {
      segments.push({
        start: lastIndex,
        end: match.index,
        text: text.slice(lastIndex, match.index),
        marks: [],
      });
    }
    
    // Determine which pattern matched
    let innerText: string;
    let marks: TipTapMark[];
    
    if (match[1]) {
      // **bold**
      innerText = match[2];
      marks = [{ type: 'bold' }];
    } else if (match[3]) {
      // __underline__
      innerText = match[4];
      marks = [{ type: 'underline' }];
    } else if (match[5]) {
      // *italic*
      innerText = match[6];
      marks = [{ type: 'italic' }];
    } else if (match[7]) {
      // _italic_
      innerText = match[8];
      marks = [{ type: 'italic' }];
    } else {
      innerText = match[0];
      marks = [];
    }
    
    segments.push({
      start: match.index,
      end: match.index + match[0].length,
      text: innerText,
      marks,
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining plain text
  if (lastIndex < text.length) {
    segments.push({
      start: lastIndex,
      end: text.length,
      text: text.slice(lastIndex),
      marks: [],
    });
  }
  
  // Convert segments to nodes
  for (const segment of segments) {
    if (segment.text) {
      const node: TipTapNode = {
        type: 'text',
        text: segment.text,
      };
      if (segment.marks.length > 0) {
        node.marks = segment.marks;
      }
      nodes.push(node);
    }
  }
  
  // If no nodes were created, return a single text node
  if (nodes.length === 0 && text) {
    return [{ type: 'text', text }];
  }
  
  return nodes;
}

/**
 * Convert a line of markdown to a TipTap block node
 */
function lineToBlock(line: string, isFirstBlock: boolean): TipTapNode | null {
  const trimmedLine = line.trim();
  
  // Empty line
  if (!trimmedLine) {
    return null;
  }
  
  // Check for headings
  const h1Match = trimmedLine.match(/^#\s+(.+)$/);
  const h2Match = trimmedLine.match(/^##\s+(.+)$/);
  const h3Match = trimmedLine.match(/^###\s+(.+)$/);
  
  // First # heading becomes title
  if (h1Match && isFirstBlock) {
    return {
      type: 'title',
      content: parseInlineMarks(h1Match[1]),
    };
  }
  
  // ## becomes h1Boxed
  if (h2Match) {
    return {
      type: 'h1Boxed',
      content: parseInlineMarks(h2Match[1]),
    };
  }
  
  // ### becomes h2Plain
  if (h3Match) {
    return {
      type: 'h2Plain',
      content: parseInlineMarks(h3Match[1]),
    };
  }
  
  // # after first block becomes h1Boxed (not title)
  if (h1Match && !isFirstBlock) {
    return {
      type: 'h1Boxed',
      content: parseInlineMarks(h1Match[1]),
    };
  }
  
  // Regular paragraph
  return {
    type: 'paragraph',
    content: parseInlineMarks(trimmedLine),
  };
}

/**
 * Parse a list block from markdown lines
 */
function parseListBlock(
  lines: string[],
  startIndex: number,
  listType: 'bulletList' | 'orderedList'
): { block: TipTapNode; endIndex: number } {
  const items: TipTapNode[] = [];
  let i = startIndex;
  
  const bulletRegex = /^[-*]\s+(.+)$/;
  const orderedRegex = /^\d+\.\s+(.+)$/;
  const regex = listType === 'bulletList' ? bulletRegex : orderedRegex;
  
  while (i < lines.length) {
    const line = lines[i].trim();
    const match = line.match(regex);
    
    if (!match) {
      break;
    }
    
    items.push({
      type: 'listItem',
      content: [
        {
          type: 'paragraph',
          content: parseInlineMarks(match[1]),
        },
      ],
    });
    
    i++;
  }
  
  return {
    block: {
      type: listType,
      content: items,
    },
    endIndex: i - 1,
  };
}

/**
 * Check if a line is a list item
 */
function getListType(line: string): 'bulletList' | 'orderedList' | null {
  const trimmed = line.trim();
  if (/^[-*]\s+.+$/.test(trimmed)) {
    return 'bulletList';
  }
  if (/^\d+\.\s+.+$/.test(trimmed)) {
    return 'orderedList';
  }
  return null;
}

/**
 * Convert Markdown string to TipTap JSON document
 * 
 * @param markdown - The markdown string to convert
 * @returns TipTap JSON document structure
 */
export function markdownToTipTap(markdown: string): TipTapDoc {
  const lines = markdown.split('\n');
  const content: TipTapNode[] = [];
  let isFirstBlock = true;
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Skip empty lines
    if (!trimmedLine) {
      i++;
      continue;
    }
    
    // Check for list
    const listType = getListType(line);
    if (listType) {
      const { block, endIndex } = parseListBlock(lines, i, listType);
      content.push(block);
      i = endIndex + 1;
      isFirstBlock = false;
      continue;
    }
    
    // Parse regular block
    const block = lineToBlock(line, isFirstBlock);
    if (block) {
      content.push(block);
      isFirstBlock = false;
    }
    
    i++;
  }
  
  // Ensure document has at least a title block
  if (content.length === 0) {
    content.push({
      type: 'title',
      content: [{ type: 'text', text: '' }],
    });
  } else if (content[0].type !== 'title') {
    // If first block is not a title, convert it or add empty title
    const firstBlock = content[0];
    if (firstBlock.type === 'paragraph' || firstBlock.type === 'h1Boxed' || firstBlock.type === 'h2Plain') {
      // Convert first block to title
      content[0] = {
        type: 'title',
        content: firstBlock.content,
      };
    } else {
      // Insert empty title at beginning
      content.unshift({
        type: 'title',
        content: [{ type: 'text', text: '' }],
      });
    }
  }
  
  return {
    type: 'doc',
    content,
  };
}

/**
 * Convert inline marks to markdown syntax
 */
function marksToMarkdown(text: string, marks?: TipTapMark[]): string {
  if (!marks || marks.length === 0) {
    return text;
  }
  
  let result = text;
  
  // Apply marks in order: underline, italic, bold (innermost to outermost)
  for (const mark of marks) {
    switch (mark.type) {
      case 'underline':
        result = `__${result}__`;
        break;
      case 'italic':
        result = `*${result}*`;
        break;
      case 'bold':
        result = `**${result}**`;
        break;
    }
  }
  
  return result;
}

/**
 * Convert TipTap content nodes to markdown text
 */
function contentToMarkdown(content?: TipTapNode[]): string {
  if (!content) {
    return '';
  }
  
  return content
    .map((node) => {
      if (node.type === 'text' && node.text) {
        return marksToMarkdown(node.text, node.marks);
      }
      return '';
    })
    .join('');
}

/**
 * Convert a TipTap block node to markdown line(s)
 */
function blockToMarkdown(block: TipTapNode, isFirstBlock: boolean): string {
  const text = contentToMarkdown(block.content);
  
  switch (block.type) {
    case 'title':
      return `# ${text}`;
    
    case 'h1Boxed':
      return `## ${text}`;
    
    case 'h2Plain':
      return `### ${text}`;
    
    case 'paragraph':
      return text;
    
    case 'bulletList':
      return (block.content || [])
        .map((item) => {
          if (item.type === 'listItem' && item.content) {
            // Get text from the paragraph inside the list item
            const paragraph = item.content.find((n) => n.type === 'paragraph');
            const itemText = paragraph ? contentToMarkdown(paragraph.content) : '';
            return `- ${itemText}`;
          }
          return '';
        })
        .filter(Boolean)
        .join('\n');
    
    case 'orderedList':
      return (block.content || [])
        .map((item, index) => {
          if (item.type === 'listItem' && item.content) {
            // Get text from the paragraph inside the list item
            const paragraph = item.content.find((n) => n.type === 'paragraph');
            const itemText = paragraph ? contentToMarkdown(paragraph.content) : '';
            return `${index + 1}. ${itemText}`;
          }
          return '';
        })
        .filter(Boolean)
        .join('\n');
    
    default:
      return text;
  }
}

/**
 * Convert TipTap JSON document to Markdown string
 * 
 * @param doc - The TipTap JSON document to convert
 * @returns Markdown string
 */
export function tipTapToMarkdown(doc: TipTapDoc): string {
  if (!doc.content || doc.content.length === 0) {
    return '';
  }
  
  const lines: string[] = [];
  
  for (let i = 0; i < doc.content.length; i++) {
    const block = doc.content[i];
    const isFirstBlock = i === 0;
    const markdown = blockToMarkdown(block, isFirstBlock);
    
    if (markdown) {
      lines.push(markdown);
      
      // Add blank line after headings for better readability
      if (block.type === 'title' || block.type === 'h1Boxed' || block.type === 'h2Plain') {
        lines.push('');
      }
    }
  }
  
  return lines.join('\n').trim();
}

/**
 * Type guard to check if a value is a valid TipTap document
 */
export function isTipTapDoc(value: unknown): value is TipTapDoc {
  if (!value || typeof value !== 'object') {
    return false;
  }
  
  const doc = value as Record<string, unknown>;
  return doc.type === 'doc' && Array.isArray(doc.content);
}

/**
 * Safely parse a JSON string to TipTap document
 */
export function parseTipTapJson(json: string): TipTapDoc | null {
  try {
    const parsed = JSON.parse(json);
    if (isTipTapDoc(parsed)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export type { TipTapDoc, TipTapNode, TipTapMark };
