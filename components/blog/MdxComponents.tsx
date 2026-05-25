// MdxComponents — custom renderers for MDX content.
// Uses Noto Sans (font-forum) for long-form reading comfort. Enforces brand palette.
import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';

export const mdxComponents: MDXComponents = {
  // Headings — auto-id for TOC anchors (mirrors extractHeadings slug logic)
  h2: ({ children, ...props }) => {
    const text = String(children);
    const id = slugify(text);
    return (
      <h2
        id={id}
        className="mt-10 mb-4 text-2xl text-deepblue font-heading scroll-mt-24"
        {...props}
      >
        {children}
      </h2>
    );
  },
  h3: ({ children, ...props }) => {
    const text = String(children);
    const id = slugify(text);
    return (
      <h3
        id={id}
        className="mt-7 mb-3 text-xl text-deepblue font-heading scroll-mt-24"
        {...props}
      >
        {children}
      </h3>
    );
  },
  h4: ({ children, ...props }) => (
    <h4 className="mt-6 mb-2 text-lg text-deepblue font-heading" {...props}>
      {children}
    </h4>
  ),

  // Prose
  p: ({ children, ...props }) => (
    <p className="mb-5 leading-relaxed text-brown font-forum text-[1.0625rem]" {...props}>
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-brown">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-brown/80">{children}</em>
  ),

  // Links — internal (next/link) or external (with rel)
  a: ({ href = '', children, ...props }) => {
    const isExternal = href.startsWith('http');
    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-deepblue underline decoration-deepblue/30 underline-offset-2 hover:text-orange hover:decoration-orange/50 transition-colors"
          {...props}
        >
          {children}
        </a>
      );
    }
    return (
      <Link
        href={href}
        className="text-deepblue underline decoration-deepblue/30 underline-offset-2 hover:text-orange hover:decoration-orange/50 transition-colors"
        {...props}
      >
        {children}
      </Link>
    );
  },

  // Lists
  ul: ({ children, ...props }) => (
    <ul className="mb-5 ml-5 list-disc space-y-1.5 text-brown font-forum text-[1.0625rem]" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="mb-5 ml-5 list-decimal space-y-1.5 text-brown font-forum text-[1.0625rem]" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-relaxed pl-1" {...props}>
      {children}
    </li>
  ),

  // Block elements
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="my-6 border-l-4 border-orange/40 pl-5 italic text-brown/75 font-forum text-lg"
      {...props}
    >
      {children}
    </blockquote>
  ),
  hr: () => (
    <hr className="my-10 border-none h-px bg-gradient-to-r from-transparent via-deepblue/20 to-transparent" />
  ),

  // Code
  code: ({ children, ...props }) => (
    <code
      className="rounded bg-deepblue/8 px-1.5 py-0.5 text-sm font-mono text-brown/80"
      {...props}
    >
      {children}
    </code>
  ),
  pre: ({ children, ...props }) => (
    <pre
      className="my-6 overflow-x-auto rounded-lg bg-deepblue/[0.06] p-5 text-sm leading-relaxed"
      {...props}
    >
      {children}
    </pre>
  ),
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
