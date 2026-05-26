/**
 * MarkdownBody — renders user-supplied markdown safely.
 * Uses react-markdown + remark-gfm + rehype-sanitize.
 *
 * Whitelist (COO Q4):
 *   ALLOW: bold, italic, blockquote, inline code, lists, links, line breaks
 *   BLOCK: raw HTML, images in body (posts can use image_url field), scripts,
 *          iframes, style attrs, javascript: URIs
 *
 * Image URLs in post bodies: blocked here. Post images use the image_url field
 * on the PostRow and are rendered by PostDetail directly.
 */
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import { defaultSchema } from 'hast-util-sanitize'
import type { Schema } from 'hast-util-sanitize'

// Strict allowlist — expand only with COO sign-off
const sanitizeSchema: Schema = {
  ...defaultSchema,
  tagNames: [
    'p', 'br',
    'strong', 'em',
    'blockquote',
    'code', 'pre',
    'ul', 'ol', 'li',
    'a',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Explicitly NOT: img, iframe, script, style, form, input, button, video, audio
  ],
  attributes: {
    ...defaultSchema.attributes,
    a: [
      ['href', /^https?:\/\//],   // Only HTTPS/HTTP links — blocks javascript: URIs
      'rel',
      'target',
    ],
    code: ['className'],           // For syntax highlighting classes (remark-gfm)
    // No style attributes on any element
  },
  strip: ['script', 'style', 'iframe', 'form', 'input', 'button', 'img', 'video', 'audio'],
}

interface MarkdownBodyProps {
  content: string
  /** Additional Tailwind classes on the prose container */
  className?: string
}

export default function MarkdownBody({ content, className = '' }: MarkdownBodyProps) {
  return (
    <div
      className={`
        font-body text-brown leading-relaxed
        prose prose-sm max-w-none
        prose-headings:font-display prose-headings:text-deepblue
        prose-a:text-deepblue prose-a:underline prose-a:underline-offset-2
        prose-blockquote:border-l-deepblue/30 prose-blockquote:text-brown/65
        prose-code:bg-deepblue/5 prose-code:rounded prose-code:px-1 prose-code:text-brown
        prose-pre:bg-deepblue/5 prose-pre:rounded
        ${className}
      `}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
        components={{
          // Force all links to open in new tab with safe rel attributes
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded"
            >
              {children}
            </a>
          ),
          // No images in body — strip silently
          img: () => null,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
