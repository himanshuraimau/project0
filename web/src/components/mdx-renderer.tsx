'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import type { Components } from 'react-markdown';
import { InlineMermaid } from '@/components/notes/inline-mermaid';

// --- Callout block parser ---
type CalloutType = 'tip' | 'note' | 'warning' | 'important' | 'caution';

interface CalloutConfig {
  icon: string;
  label: string;
  border: string;
  bg: string;
  labelColor: string;
}

const CALLOUT_STYLES: Record<CalloutType, CalloutConfig> = {
  tip: {
    icon: '💡',
    label: 'Tip',
    border: 'border-emerald-400/50 dark:border-emerald-500/40',
    bg: 'bg-emerald-50/60 dark:bg-emerald-950/20',
    labelColor: 'text-emerald-700 dark:text-emerald-400',
  },
  note: {
    icon: '📝',
    label: 'Note',
    border: 'border-blue-400/50 dark:border-blue-500/40',
    bg: 'bg-blue-50/60 dark:bg-blue-950/20',
    labelColor: 'text-blue-700 dark:text-blue-400',
  },
  warning: {
    icon: '⚠️',
    label: 'Warning',
    border: 'border-amber-400/50 dark:border-amber-500/40',
    bg: 'bg-amber-50/60 dark:bg-amber-950/20',
    labelColor: 'text-amber-700 dark:text-amber-400',
  },
  important: {
    icon: '🔑',
    label: 'Important',
    border: 'border-purple-400/50 dark:border-purple-500/40',
    bg: 'bg-purple-50/60 dark:bg-purple-950/20',
    labelColor: 'text-purple-700 dark:text-purple-400',
  },
  caution: {
    icon: '🚨',
    label: 'Caution',
    border: 'border-red-400/50 dark:border-red-500/40',
    bg: 'bg-red-50/60 dark:bg-red-950/20',
    labelColor: 'text-red-700 dark:text-red-400',
  },
};

function getTextContent(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (!React.isValidElement(node)) return '';
  const children = (node.props as { children?: React.ReactNode }).children;
  if (!children) return '';
  return React.Children.toArray(children).map(getTextContent).join('');
}

function detectCalloutType(
  children: React.ReactNode,
): { type: CalloutType; content: React.ReactNode } | null {
  const childArray = React.Children.toArray(children);
  if (childArray.length === 0) return null;

  const first = childArray[0];
  if (!React.isValidElement(first)) return null;

  const firstText = getTextContent(first);

  // GitHub-style: [!TIP], [!NOTE], [!WARNING], [!IMPORTANT], [!CAUTION]
  const ghMatch = firstText.match(
    /^\[!(TIP|NOTE|WARNING|IMPORTANT|CAUTION)\]\s*/i,
  );
  if (ghMatch) {
    const type = ghMatch[1].toLowerCase() as CalloutType;
    const restText = firstText.replace(ghMatch[0], '');
    const restChildren =
      restText.trim() || childArray.length > 1
        ? [
            restText.trim() ? (
              <p key="callout-first">{restText.trim()}</p>
            ) : null,
            ...childArray.slice(1),
          ].filter(Boolean)
        : childArray.slice(1);
    return { type, content: restChildren };
  }

  // Keyword-style: > **Key formula:** or > **Definition:** etc.
  const keywordMap: Record<string, CalloutType> = {
    tip: 'tip',
    note: 'note',
    warning: 'warning',
    important: 'important',
    caution: 'caution',
    'key point': 'important',
    'key formula': 'important',
    'key concept': 'important',
    'key insight': 'important',
    definition: 'note',
    remember: 'important',
    example: 'tip',
  };

  const keywordMatch = firstText.match(
    /^(?:\*\*)?[^\w\s]?\s*(tip|note|warning|important|caution|key point|key formula|key concept|key insight|definition|remember|example)\s*[:：]\s*/i,
  );
  if (keywordMatch) {
    const matched = keywordMatch[1].toLowerCase();
    const type = keywordMap[matched] || 'note';
    return { type, content: children };
  }

  return null;
}

interface MDXRendererProps {
  content: string;
  className?: string;
}

/**
 * Extract inline <svg>…</svg> blocks from markdown and replace them with
 * placeholder tokens so react-markdown never tries to parse SVG child elements
 * (which it renders as raw text). The SVGs are rendered separately via
 * dangerouslySetInnerHTML in the InlineSVG component below.
 */
function extractSVGs(markdown: string): { cleaned: string; svgs: string[] } {
  const svgs: string[] = [];
  const cleaned = markdown.replace(
    /<svg[\s\S]*?<\/svg>/gi,
    (match) => {
      const index = svgs.length;
      svgs.push(match);
      return `\n\n<div data-inline-svg="${index}"></div>\n\n`;
    },
  );
  return { cleaned, svgs };
}

function InlineSVG({ svg }: { svg: string }) {
  return (
    <div
      className="my-6 flex justify-center overflow-x-auto [&>svg]:max-w-full [&>svg]:h-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

const components: Components = {
  // --- Typography ---
  h1: ({ children, ...props }) => (
    <h1
      className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mt-8 mb-5 pb-3 border-b-2 border-primary/20 first:mt-0 leading-tight tracking-tight"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2
      className="text-xl sm:text-2xl lg:text-[1.65rem] font-semibold text-foreground mt-10 mb-4 pb-2 border-b border-border/60 leading-snug tracking-tight"
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
      className="text-base sm:text-lg font-medium text-foreground/80 mt-5 mb-2"
      {...props}
    >
      {children}
    </h4>
  ),
  h5: ({ children, ...props }) => (
    <h5
      className="text-sm sm:text-base font-medium text-foreground/70 mt-4 mb-2"
      {...props}
    >
      {children}
    </h5>
  ),
  h6: ({ children, ...props }) => (
    <h6
      className="text-xs sm:text-sm font-medium text-foreground/60 mt-4 mb-2 uppercase tracking-wide"
      {...props}
    >
      {children}
    </h6>
  ),
  p: ({ children, ...props }) => (
    <p
      className="mb-4 leading-[1.75] text-foreground/90 text-[0.938rem]"
      {...props}
    >
      {children}
    </p>
  ),

  // --- Lists ---
  ul: ({ children, ...props }) => (
    <ul className="ml-1 mb-5 space-y-1.5 list-none" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="ml-1 mb-5 space-y-1.5 list-none counter-reset-item" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li
      className="relative pl-5 text-foreground/90 leading-[1.75] text-[0.938rem] before:content-['•'] before:absolute before:left-0 before:text-primary/50 before:font-bold"
      {...props}
    >
      {children}
    </li>
  ),

  // --- Blockquote / Callouts ---
  blockquote: ({ children }) => {
    const callout = detectCalloutType(children);

    if (callout) {
      const style = CALLOUT_STYLES[callout.type];
      return (
        <div
          className={`my-6 rounded-lg border-l-[3px] ${style.border} ${style.bg} px-4 py-3.5 [&>p]:mb-1 [&>p:last-child]:mb-0`}
        >
          <div className={`mb-1.5 flex items-center gap-2 text-[0.8rem] font-semibold uppercase tracking-wide ${style.labelColor}`}>
            <span className="text-sm">{style.icon}</span>
            <span>{style.label}</span>
          </div>
          <div className="text-foreground/85 text-[0.9rem] leading-relaxed [&>p]:mb-1">
            {callout.content}
          </div>
        </div>
      );
    }

    return (
      <blockquote className="border-l-[3px] border-primary/30 pl-4 py-2.5 my-6 bg-primary/[0.03] rounded-r-lg text-foreground/80 [&>p]:mb-1">
        {children}
      </blockquote>
    );
  },

  // --- Code / Mermaid ---
  code: ({ children, className, ...props }) => {
    const isCodeBlock = className?.startsWith('language-');
    const lang = className?.replace('language-', '');

    if (isCodeBlock && lang === 'mermaid') {
      const code = String(children).replace(/\n$/, '');
      return <InlineMermaid code={code} />;
    }

    if (isCodeBlock) {
      return (
        <code className={`${className} text-sm`} {...props}>
          {children}
        </code>
      );
    }

    return (
      <code
        className="bg-muted/70 px-1.5 py-0.5 rounded text-[0.85rem] font-mono text-foreground/90 border border-border/30"
        {...props}
      >
        {children}
      </code>
    );
  },

  pre: ({ children, ...props }) => {
    const child = React.Children.only(children);
    if (React.isValidElement(child) && child.type === InlineMermaid) {
      return <>{children}</>;
    }

    return (
      <div className="relative group my-6">
        <pre
          className="bg-muted/50 p-5 rounded-lg overflow-x-auto text-sm border border-border/40 group-hover:border-border/60 transition-colors"
          {...props}
        >
          {children}
        </pre>
        <button
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 backdrop-blur-sm border border-border/50 rounded-md px-2.5 py-1 text-xs hover:bg-muted font-medium text-muted-foreground"
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
    );
  },

  // --- Inline ---
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-foreground" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="italic text-foreground/70" {...props}>
      {children}
    </em>
  ),
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      className="text-primary hover:text-primary/80 underline underline-offset-2 decoration-primary/30 hover:decoration-primary/60 transition-colors font-medium"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),

  // --- Tables ---
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto my-6 rounded-lg border border-border/50">
      <table
        className="min-w-full divide-y divide-border/50 text-[0.875rem]"
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-muted/50" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => (
    <tbody className="divide-y divide-border/30 bg-card/50" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }) => (
    <tr
      className="hover:bg-muted/30 transition-colors"
      {...props}
    >
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th
      className="px-4 py-2.5 text-left font-semibold text-foreground/80 text-[0.8rem] uppercase tracking-wider whitespace-nowrap"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="px-4 py-2.5 text-foreground/85" {...props}>
      {children}
    </td>
  ),

  // --- Misc ---
  hr: (props) => (
    <hr className="my-10 border-none h-px bg-gradient-to-r from-transparent via-border to-transparent" {...props} />
  ),
  del: ({ children, ...props }) => (
    <del className="line-through text-muted-foreground/60" {...props}>
      {children}
    </del>
  ),
  img: ({ src, alt, ...props }) => (
    <img
      src={src}
      alt={alt || ''}
      className="rounded-lg max-w-full h-auto my-6 border border-border/20"
      loading="lazy"
      {...props}
    />
  ),

  // SVG elements are now handled by extractSVGs() preprocessing — see InlineSVG component
};

/**
 * Primary markdown renderer.
 * Supports GFM, syntax highlighting, inline SVG, Mermaid diagrams, and callout blocks.
 */
export function MDXRenderer({ content, className = '' }: MDXRendererProps) {
  if (!content) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-muted-foreground">No content available</p>
      </div>
    );
  }

  const { cleaned, svgs } = extractSVGs(content);

  const componentsWithSVG: Components = {
    ...components,
    div: ({ children, ...props }) => {
      const svgIndex = (props as Record<string, unknown>)['data-inline-svg'];
      if (svgIndex !== undefined) {
        const idx = Number(svgIndex);
        if (svgs[idx]) {
          return <InlineSVG svg={svgs[idx]} />;
        }
      }
      return <div {...props}>{children}</div>;
    },
  };

  return (
    <div className={`max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={componentsWithSVG}
      >
        {cleaned}
      </ReactMarkdown>
    </div>
  );
}

/**
 * Alias for backward compatibility.
 */
export function MarkdownRenderer({
  content,
  className = '',
}: MDXRendererProps) {
  return <MDXRenderer content={content} className={className} />;
}
