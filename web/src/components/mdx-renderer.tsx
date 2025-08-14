'use client';

import React from 'react';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface MDXRendererProps {
  content: string;
  className?: string;
}

// Custom components for MDX rendering
const components = {
  h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="text-3xl font-bold text-foreground mt-8 mb-4 border-b border-border pb-3" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="text-2xl font-bold text-foreground mt-6 mb-3 border-b border-border pb-2" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="text-xl font-semibold text-foreground mt-4 mb-2" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4 className="text-lg font-semibold text-foreground mt-3 mb-2" {...props}>
      {children}
    </h4>
  ),
  h5: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h5 className="text-base font-semibold text-foreground mt-3 mb-2" {...props}>
      {children}
    </h5>
  ),
  h6: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h6 className="text-sm font-semibold text-foreground mt-3 mb-2" {...props}>
      {children}
    </h6>
  ),
  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mb-3 leading-relaxed text-foreground" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc ml-6 mb-4 space-y-1" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal ml-6 mb-4 space-y-1" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="mb-1 text-foreground" {...props}>
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote className="border-l-4 border-primary pl-4 py-2 mb-4 bg-muted/30 rounded-r-lg" {...props}>
      {children}
    </blockquote>
  ),
  code: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono text-foreground" {...props}>
      {children}
    </code>
  ),
  pre: ({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) => (
    <pre className="bg-muted p-4 rounded-lg mb-4 overflow-x-auto text-sm" {...props}>
      {children}
    </pre>
  ),
  strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-bold text-foreground" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <em className="italic text-foreground" {...props}>
      {children}
    </em>
  ),
  a: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a 
      href={href} 
      className="text-primary hover:underline transition-colors" 
      target="_blank" 
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
  table: ({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto mb-4">
      <table className="min-w-full border border-border rounded-lg" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="bg-muted" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <tbody {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr className="border-b border-border" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th className="px-4 py-2 text-left font-semibold text-foreground" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td className="px-4 py-2 text-foreground" {...props}>
      {children}
    </td>
  ),
  hr: ({ ...props }: React.HTMLAttributes<HTMLHRElement>) => (
    <hr className="my-6 border-border" {...props} />
  ),
  del: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <del className="line-through text-muted-foreground" {...props}>
      {children}
    </del>
  ),
};

export function MDXRenderer({ content, className = '' }: MDXRendererProps) {
  const [mdxSource, setMdxSource] = React.useState<MDXRemoteSerializeResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const processMDX = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Serialize the markdown content to MDX
        const serialized = await serialize(content, {
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [rehypeHighlight],
            development: process.env.NODE_ENV === 'development',
          },
        });
        
        setMdxSource(serialized);
      } catch (err) {
        console.error('Error processing MDX:', err);
        setError('Failed to process markdown content');
      } finally {
        setLoading(false);
      }
    };

    if (content) {
      processMDX();
    } else {
      setLoading(false);
    }
  }, [content]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Processing content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-destructive font-medium">Error processing content</p>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
      </div>
    );
  }

  if (!mdxSource) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-muted-foreground">No content available</p>
      </div>
    );
  }

  return (
    <div className={`prose max-w-none ${className}`}>
      <MDXRemote {...mdxSource} components={components} />
    </div>
  );
}

// Fallback renderer for when MDX processing fails
export function MarkdownRenderer({ content, className = '' }: MDXRendererProps) {
  if (!content) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-muted-foreground">No content available</p>
      </div>
    );
  }

  // Enhanced markdown processing with proper header support
  const processMarkdown = (text: string): string => {
    let processed = text
      // Headers - process from h6 to h1 to avoid conflicts
      .replace(/^######\s+(.+)$/gm, '<h6 class="text-sm font-semibold text-foreground mt-3 mb-2">$1</h6>')
      .replace(/^#####\s+(.+)$/gm, '<h5 class="text-base font-semibold text-foreground mt-3 mb-2">$1</h5>')
      .replace(/^####\s+(.+)$/gm, '<h4 class="text-lg font-semibold text-foreground mt-3 mb-2">$1</h4>')
      .replace(/^###\s+(.+)$/gm, '<h3 class="text-xl font-semibold text-foreground mt-4 mb-2">$1</h3>')
      .replace(/^##\s+(.+)$/gm, '<h2 class="text-2xl font-bold text-foreground mt-6 mb-3 border-b border-border pb-2">$1</h2>')
      .replace(/^#\s+(.+)$/gm, '<h1 class="text-3xl font-bold text-foreground mt-8 mb-4 border-b border-border pb-3">$1</h1>')
      
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-foreground">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-foreground">$1</em>')
      
      // Code
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono text-foreground">$1</code>')
      
      // Strikethrough
      .replace(/~~(.*?)~~/g, '<del class="line-through text-muted-foreground">$1</del>')
      
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline transition-colors" target="_blank" rel="noopener noreferrer">$1</a>')
      
      // Blockquotes
      .replace(/^>\s+(.+)$/gm, '<blockquote class="border-l-4 border-primary pl-4 py-2 mb-4 bg-muted/30 rounded-r-lg">$1</blockquote>')
      
      // Horizontal rules
      .replace(/^---$/gm, '<hr class="my-6 border-border" />')
      
      // Line breaks
      .replace(/\n\n/g, '</p>\n<p class="mb-3 leading-relaxed text-foreground">');

    // Split into lines for list processing
    const lines = processed.split('\n');
    const processedLines: string[] = [];
    let inList = false;
    let listType = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) {
        if (inList) {
          processedLines.push(`</${listType}>`);
          inList = false;
          listType = '';
        }
        processedLines.push('');
        continue;
      }
      
      // Numbered lists
      if (/^\d+\.\s+/.test(line)) {
        const content = line.replace(/^\d+\.\s+/, '');
        if (!inList || listType !== 'ol') {
          if (inList) processedLines.push(`</${listType}>`);
          processedLines.push('<ol class="list-decimal ml-6 mb-4 space-y-1">');
          inList = true;
          listType = 'ol';
        }
        processedLines.push(`<li class="mb-1 text-foreground">${content}</li>`);
      }
      // Bullet lists
      else if (/^[-•*]\s+/.test(line)) {
        const content = line.replace(/^[-•*]\s+/, '');
        if (!inList || listType !== 'ul') {
          if (inList) processedLines.push(`</${listType}>`);
          processedLines.push('<ul class="list-disc ml-6 mb-4 space-y-1">');
          inList = true;
          listType = 'ul';
        }
        processedLines.push(`<li class="mb-1 text-foreground">${content}</li>`);
      }
      // Regular content
      else {
        if (inList) {
          processedLines.push(`</${listType}>`);
          inList = false;
          listType = '';
        }
        
        // Don't wrap headers in paragraphs
        if (line.startsWith('<h') || line.startsWith('<blockquote') || line.startsWith('<hr')) {
          processedLines.push(line);
        } else {
          processedLines.push(`<p class="mb-3 leading-relaxed text-foreground">${line}</p>`);
        }
      }
    }
    
    // Close any remaining list
    if (inList) {
      processedLines.push(`</${listType}>`);
    }
    
    return processedLines.join('\n');
  };

  return (
    <div 
      className={`prose max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: processMarkdown(content) }}
    />
  );
}