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
    <h1 className="text-3xl lg:text-4xl font-bold text-foreground mt-8 mb-6 pb-3 border-b-2 border-border first:mt-0" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="text-2xl lg:text-3xl font-bold text-foreground mt-8 mb-4 pb-2 border-b border-border" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="text-xl lg:text-2xl font-semibold text-muted-foreground mt-6 mb-3" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4 className="text-lg lg:text-xl font-semibold text-muted-foreground mt-5 mb-3" {...props}>
      {children}
    </h4>
  ),
  h5: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h5 className="text-base lg:text-lg font-semibold text-muted-foreground mt-4 mb-2" {...props}>
      {children}
    </h5>
  ),
  h6: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h6 className="text-sm lg:text-base font-semibold text-muted-foreground mt-4 mb-2" {...props}>
      {children}
    </h6>
  ),
  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mb-6 leading-relaxed text-foreground text-base lg:text-lg" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc ml-6 mb-6 space-y-3" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal ml-6 mb-6 space-y-3" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="text-foreground leading-relaxed" {...props}>
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="border-l-4 border-accent pl-6 py-4 my-8 bg-accent/5 rounded-r-2xl italic text-muted-foreground font-medium"
      {...props}
    >
      {children}
    </blockquote>
  ),
  code: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <code
      className="bg-muted px-3 py-1.5 rounded-lg text-sm font-mono text-foreground font-medium border border-border/50"
      {...props}
    >
      {children}
    </code>
  ),
  pre: ({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) => (
    <div className="relative group my-8">
      <pre
        className="bg-muted p-6 rounded-2xl overflow-x-auto text-sm border border-border/50 group-hover:border-border transition-colors"
        {...props}
      >
        {children}
      </pre>
      <button
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border rounded-lg px-3 py-1.5 text-xs hover:bg-muted font-medium"
        onClick={(e) => {
          const preElement = e.currentTarget.previousElementSibling as HTMLPreElement;
          const code = preElement?.textContent || '';
          navigator.clipboard.writeText(code);
        }}
      >
        Copy
      </button>
    </div>
  ),
  strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-bold text-foreground" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <em className="italic text-muted-foreground" {...props}>
      {children}
    </em>
  ),
  a: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      href={href}
      className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors font-medium"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
  table: ({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto my-8">
      <table className="min-w-full border border-border rounded-2xl overflow-hidden" {...props}>
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
    <tr className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th className="px-6 py-4 text-left font-semibold text-foreground" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td className="px-6 py-4 text-foreground" {...props}>
      {children}
    </td>
  ),
  hr: ({ ...props }: React.HTMLAttributes<HTMLHRElement>) => (
    <hr className="my-12 border-border" {...props} />
  ),
  del: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <del className="line-through text-muted-foreground opacity-70" {...props}>
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

        // Sanitize content to prevent MDX compilation errors
        // Remove or escape problematic characters that MDX can't handle
        let sanitizedContent = content
          // Escape HTML-like tags that aren't valid JSX
          .replace(/<([^>]+)>/g, (match, tag) => {
            // Allow common markdown/HTML tags
            const allowedTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'strong', 'em', 'code', 'pre', 'a', 'ul', 'ol', 'li', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'div', 'span'];
            const tagName = tag.split(/\s/)[0].replace('/', '');
            if (!allowedTags.includes(tagName.toLowerCase())) {
              // Escape the tag
              return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            }
            return match;
          });

        // Serialize the markdown content to MDX
        const serialized = await serialize(sanitizedContent, {
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [rehypeHighlight],
            development: process.env.NODE_ENV === 'development',
          },
        });

        setMdxSource(serialized);
      } catch (err) {
        console.error('Error processing MDX:', err);
        // Instead of showing error, we'll fall back to the basic markdown renderer
        // by setting error state which will be handled in the render
        setError(err instanceof Error ? err.message : 'Failed to process markdown content');
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
    // Fall back to basic markdown renderer when MDX fails
    console.warn('MDX processing failed, falling back to basic markdown renderer:', error);
    return <MarkdownRenderer content={content} className={className} />;
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
    const processed = text
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