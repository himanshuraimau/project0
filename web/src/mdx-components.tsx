import type { MDXComponents } from "mdx/types";
import Link from "next/link";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://flinote.ai";

function isInternal(href: string) {
  if (!href || typeof href !== "string") return false;
  return href.startsWith("/") && !href.startsWith("//");
}

export function useMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    wrapper: ({ children }) => (
      <article className="prose prose-neutral dark:prose-invert prose-headings:font-semibold prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-a:text-primary max-w-none">
        {children}
      </article>
    ),
    a: ({ href, children, ...props }) => {
      if (isInternal(href ?? "")) {
        return (
          <Link href={href!} {...props}>
            {children}
          </Link>
        );
      }
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline underline-offset-2"
          {...props}
        >
          {children}
        </a>
      );
    },
    code: ({ className, children, ...props }) => {
      const isBlock = className?.startsWith("language-");
      if (isBlock) {
        return (
          <code
            className={`${className ?? ""} text-sm bg-muted px-1 py-0.5 rounded border border-border`}
            {...props}
          >
            {children}
          </code>
        );
      }
      return (
        <code
          className="bg-muted px-2 py-1 rounded-md text-sm font-mono text-foreground border border-border/40"
          {...props}
        >
          {children}
        </code>
      );
    },
    pre: ({ children, ...props }) => (
      <pre
        className="bg-muted p-5 rounded-xl overflow-x-auto text-sm border border-border/50 my-6"
        {...props}
      >
        {children}
      </pre>
    ),
    hr: () => <hr className="border-border my-8" />,
    ...components,
  };
}
