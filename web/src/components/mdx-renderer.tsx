'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import type { Components } from 'react-markdown';

interface MDXRendererProps {
  content: string;
  className?: string;
}

// Custom components for react-markdown rendering
const components: Components = {
  h1: ({ children, ...props }) => (
    <h1
      className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mt-8 mb-5 pb-3 border-b-2 border-primary/20 first:mt-0 leading-tight"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2
      className="text-xl sm:text-2xl lg:text-[1.65rem] font-bold text-foreground mt-10 mb-4 pb-2 border-b border-border leading-snug"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3
      className="text-lg sm:text-xl lg:text-[1.35rem] font-semibold text-foreground mt-7 mb-3 leading-snug"
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4
      className="text-base sm:text-lg lg:text-xl font-semibold text-muted-foreground mt-5 mb-2"
      {...props}
    >
      {children}
    </h4>
  ),
  h5: ({ children, ...props }) => (
    <h5
      className="text-sm sm:text-base lg:text-lg font-semibold text-muted-foreground mt-4 mb-2"
      {...props}
    >
      {children}
    </h5>
  ),
  h6: ({ children, ...props }) => (
    <h6
      className="text-xs sm:text-sm lg:text-base font-semibold text-muted-foreground mt-4 mb-2"
      {...props}
    >
      {children}
    </h6>
  ),
  p: ({ children, ...props }) => (
    <p
      className="mb-4 leading-relaxed text-foreground text-[0.95rem] lg:text-base"
      {...props}
    >
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="list-disc ml-5 mb-5 space-y-2" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="list-decimal ml-5 mb-5 space-y-2" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li
      className="text-foreground leading-relaxed text-[0.95rem] lg:text-base pl-1"
      {...props}
    >
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-l-4 border-primary/40 pl-5 py-3 my-6 bg-primary/5 rounded-r-xl text-foreground/90 font-medium [&>p]:mb-1"
      {...props}
    >
      {children}
    </blockquote>
  ),
  code: ({ children, className, ...props }) => {
    // If it has a language class, it's a code block (inside <pre>)
    const isCodeBlock = className?.startsWith('language-');
    if (isCodeBlock) {
      return (
        <code className={`${className} text-sm`} {...props}>
          {children}
        </code>
      );
    }
    // Inline code
    return (
      <code
        className="bg-muted px-2 py-1 rounded-md text-sm font-mono text-foreground font-medium border border-border/40"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }) => (
    <div className="relative group my-6">
      <pre
        className="bg-muted p-5 rounded-xl overflow-x-auto text-sm border border-border/50 group-hover:border-border transition-colors"
        {...props}
      >
        {children}
      </pre>
      <button
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border rounded-lg px-3 py-1.5 text-xs hover:bg-muted font-medium"
        onClick={(e) => {
          const preElement = (e.currentTarget as HTMLButtonElement)
            .closest('.group')
            ?.querySelector('pre') as HTMLPreElement;
          const code = preElement?.textContent || '';
          navigator.clipboard.writeText(code);
          const btn = e.currentTarget;
          btn.textContent = 'Copied!';
          setTimeout(() => {
            btn.textContent = 'Copy';
          }, 2000);
        }}
      >
        Copy
      </button>
    </div>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-bold text-foreground" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="italic text-muted-foreground" {...props}>
      {children}
    </em>
  ),
  a: ({ children, href, ...props }) => (
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

  // Table components — beautifully styled with stripes and hover
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto my-6 rounded-xl border border-border">
      <table
        className="min-w-full divide-y divide-border text-[0.9rem]"
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-muted/70" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => (
    <tbody className="divide-y divide-border/60 bg-card" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }) => (
    <tr
      className="hover:bg-muted/40 transition-colors even:bg-muted/20"
      {...props}
    >
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th
      className="px-4 py-3 text-left font-semibold text-foreground text-[0.85rem] uppercase tracking-wider whitespace-nowrap"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="px-4 py-3 text-foreground" {...props}>
      {children}
    </td>
  ),

  hr: (props) => <hr className="my-10 border-border" {...props} />,
  del: ({ children, ...props }) => (
    <del
      className="line-through text-muted-foreground opacity-70"
      {...props}
    >
      {children}
    </del>
  ),

  // Images
  img: ({ src, alt, ...props }) => (
    <img
      src={src}
      alt={alt || ''}
      className="rounded-xl max-w-full h-auto my-6 border border-border/30"
      loading="lazy"
      {...props}
    />
  ),
};

/**
 * Primary markdown renderer using react-markdown.
 * Supports GFM tables, strikethrough, autolinks, task lists, and syntax highlighting.
 */
export function MDXRenderer({ content, className = '' }: MDXRendererProps) {
  if (!content) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-muted-foreground">No content available</p>
      </div>
    );
  }

  return (
    <div className={`max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/**
 * Lightweight markdown renderer — same as MDXRenderer.
 * Kept as an alias for backward compatibility with components
 * that import MarkdownRenderer.
 */
export function MarkdownRenderer({ content, className = '' }: MDXRendererProps) {
  return <MDXRenderer content={content} className={className} />;
}
