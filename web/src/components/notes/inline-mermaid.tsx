'use client';

import React, { useEffect, useRef, useState, useId } from 'react';

interface InlineMermaidProps {
  code: string;
}

/**
 * Sanitize AI-generated mermaid code that often contains invalid syntax.
 * Fixes: <br> tags, quotes around labels, emojis, special chars in labels.
 */
function sanitizeMermaid(raw: string): string {
  let code = raw.trim();

  // Remove <br> and <br/> tags — replace with space
  code = code.replace(/<br\s*\/?>/gi, ' ');

  // Fix double-quoted labels inside brackets: A["label"] → A[label]
  code = code.replace(
    /(\w+)\["([^"]+)"\]/g,
    (_, id, label) => `${id}[${cleanLabel(label)}]`,
  );

  // Fix double-quoted labels inside parens: A("label") → A(label)
  code = code.replace(
    /(\w+)\("([^"]+)"\)/g,
    (_, id, label) => `${id}(${cleanLabel(label)})`,
  );

  // Fix double-quoted labels inside curlies: A{"label"} → A{label}
  code = code.replace(
    /(\w+)\{"([^"]+)"\}/g,
    (_, id, label) => `${id}{${cleanLabel(label)}}`,
  );

  // Clean labels already in brackets/parens/curlies without quotes
  code = code.replace(
    /(\w+)\[([^\]]+)\]/g,
    (_, id, label) => `${id}[${cleanLabel(label)}]`,
  );
  code = code.replace(
    /(\w+)\(([^)]+)\)/g,
    (match, id, label) => {
      // Don't clean "url(#arrow)" or similar
      if (id === 'url' || id === 'marker') return match;
      return `${id}(${cleanLabel(label)})`;
    },
  );
  code = code.replace(
    /(\w+)\{([^}]+)\}/g,
    (_, id, label) => `${id}{${cleanLabel(label)}}`,
  );

  return code;
}

/** Remove characters that break mermaid node labels */
function cleanLabel(label: string): string {
  return label
    // Strip emojis (unicode emoji ranges)
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1FA00}-\u{1FAFF}\u{200D}\u{20E3}]/gu, '')
    // Strip quotes
    .replace(/[""''`]/g, '')
    // Replace colons/semicolons with dashes
    .replace(/[:;]/g, ' -')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

export function InlineMermaid({ code }: InlineMermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const uniqueId = useId().replace(/:/g, '-');

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import('mermaid')).default;

        const isDark =
          document.documentElement.classList.contains('dark') ||
          window.matchMedia('(prefers-color-scheme: dark)').matches;

        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'default',
          securityLevel: 'loose',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'basis',
            padding: 16,
            nodeSpacing: 60,
            rankSpacing: 50,
          },
          sequence: {
            useMaxWidth: true,
            actorMargin: 80,
            messageFontSize: 13,
          },
          themeVariables: isDark
            ? {
                primaryColor: '#7c3aed',
                primaryTextColor: '#f3f4f6',
                primaryBorderColor: '#6d28d9',
                lineColor: '#6b7280',
                secondaryColor: '#1e3a5f',
                tertiaryColor: '#1a2e1a',
                noteTextColor: '#f3f4f6',
                noteBkgColor: '#374151',
              }
            : {
                primaryColor: '#ede9fe',
                primaryTextColor: '#1f2937',
                primaryBorderColor: '#8b5cf6',
                lineColor: '#6b7280',
                secondaryColor: '#dbeafe',
                tertiaryColor: '#dcfce7',
                noteTextColor: '#1f2937',
                noteBkgColor: '#f3f4f6',
              },
        });

        const sanitized = sanitizeMermaid(code);
        const id = `mermaid-${uniqueId}-${Date.now()}`;
        const { svg: rendered } = await mermaid.render(id, sanitized);

        if (!cancelled) {
          setSvg(rendered);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('Mermaid render failed:', err);
          setError('Diagram could not be rendered');
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [code, uniqueId]);

  // On error, hide completely — don't show raw code to users
  if (error) return null;

  if (!svg) {
    return (
      <div className="my-5 flex h-32 items-center justify-center rounded-xl border border-border/30 bg-muted/20">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-6 flex justify-center overflow-x-auto rounded-xl border border-border/30 bg-card/50 p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
