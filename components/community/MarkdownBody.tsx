/**
 * MarkdownBody — renders user-supplied markdown safely.
 * Uses react-markdown + remark-gfm + rehype-sanitize.
 *
 * Two modes:
 *   Default (allowImages=false): blocks images — for comments.
 *   allowImages=true: permits img from HTTPS + domain whitelist — for questions/answers.
 *
 * All links open in new tab with noopener; javascript: URIs blocked.
 */
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import { defaultSchema } from 'hast-util-sanitize'
import type { Schema } from 'hast-util-sanitize'

const BASE_TAG_NAMES = [
  'p', 'br',
  'strong', 'em',
  'blockquote',
  'code', 'pre',
  'ul', 'ol', 'li',
  'a',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
] as const

const BASE_ATTRIBUTES: Schema['attributes'] = {
  ...defaultSchema.attributes,
  a: [
    ['href', /^https?:\/\//],
    'rel',
    'target',
  ],
  code: ['className'],
}

/** Strict schema — no images. Used for comments. */
const sanitizeSchema: Schema = {
  ...defaultSchema,
  tagNames: [...BASE_TAG_NAMES],
  attributes: BASE_ATTRIBUTES,
  strip: ['script', 'style', 'iframe', 'form', 'input', 'button', 'img', 'video', 'audio'],
}

/** Permissive schema — allows img from domain whitelist. Used for questions/answers. */
const sanitizeSchemaWithImages: Schema = {
  ...defaultSchema,
  tagNames: [...BASE_TAG_NAMES, 'img'],
  attributes: {
    ...BASE_ATTRIBUTES,
    img: [
      [
        'src',
        /^https:\/\/(i\.imgur\.com|imgur\.com|unsplash\.com|images\.unsplash\.com|wikimedia\.org|upload\.wikimedia\.org|stunprex\.com)\//,
      ],
      'alt',
      'width',
      'height',
    ],
  },
  strip: ['script', 'style', 'iframe', 'form', 'input', 'button', 'video', 'audio'],
}

interface MarkdownBodyProps {
  content: string
  /** Allow images from the HTTPS domain whitelist (questions/answers). Default false. */
  allowImages?: boolean
  /** Additional Tailwind classes on the prose container */
  className?: string
}

export default function MarkdownBody({
  content,
  allowImages = false,
  className = '',
}: MarkdownBodyProps) {
  const schema = allowImages ? sanitizeSchemaWithImages : sanitizeSchema

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
        prose-img:rounded prose-img:max-w-full
        ${className}
      `}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, schema]]}
        components={{
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
          // When images not allowed, strip silently
          img: allowImages
            ? undefined
            : () => null,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
