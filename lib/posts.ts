// StunpreX blog — content layer helpers
// Reads MDX posts from /content/posts/. Only 'published' status posts appear publicly.
// All functions are server-only (filesystem access).

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import type { Post, PostCard, PostFrontmatter, Category, CategorySlug, AudienceLayer } from './types/post';
export type { Post, PostCard };
import { CATEGORY_SLUGS } from './types/post';

const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');

// ─── Internal helpers ──────────────────────────────────────────────────────────

function parsePost(slug: string, raw: string): Post {
  const { data, content } = matter(raw);
  const fm = data as PostFrontmatter;
  const rt = readingTime(content);
  return {
    frontmatter: {
      ...fm,
      slug,
      lastModified: fm.lastModified ?? fm.date,
      readingTime: Math.ceil(rt.minutes),
    },
    slug,
    readingTime: Math.ceil(rt.minutes),
    source: content,
  };
}

function parsePostCard(slug: string, raw: string): PostCard {
  const { data, content } = matter(raw);
  const fm = data as PostFrontmatter;
  const rt = readingTime(content);
  return {
    frontmatter: {
      ...fm,
      slug,
      lastModified: fm.lastModified ?? fm.date,
      readingTime: Math.ceil(rt.minutes),
    },
    slug,
    readingTime: Math.ceil(rt.minutes),
  };
}

// ─── Public API ────────────────────────────────────────────────────────────────

/** Returns all published posts as PostCards, sorted newest-first. */
export function getAllPostCards(): PostCard[] {
  if (!fs.existsSync(POSTS_DIR)) return [];

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.mdx'));
  const cards = files
    .map((file) => {
      const slug = file.replace(/\.mdx$/, '');
      const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
      return parsePostCard(slug, raw);
    })
    .filter((card) => card.frontmatter.status === 'published');

  return cards.sort(
    (a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime()
  );
}

/** Returns a single full post (with source) by slug. Returns null if not found or not published. */
export function getPostBySlug(slug: string): Post | null {
  const filePath = path.join(POSTS_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf8');
  const post = parsePost(slug, raw);

  if (post.frontmatter.status !== 'published') return null;
  return post;
}

/** Returns all published PostCards for a given category slug. Newest-first. */
export function getPostCardsByCategory(categorySlug: CategorySlug): PostCard[] {
  const all = getAllPostCards();
  return all.filter(
    (card) => CATEGORY_SLUGS[card.frontmatter.category] === categorySlug
  );
}

/** Returns all unique categories that have at least one published post. */
export function getPublishedCategories(): Category[] {
  const all = getAllPostCards();
  const set = new Set(all.map((c) => c.frontmatter.category));
  return Array.from(set);
}

/** Returns all slugs of published posts (for generateStaticParams). */
export function getAllPostSlugs(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.mdx'));
  return files
    .map((f) => {
      const slug = f.replace(/\.mdx$/, '');
      const raw = fs.readFileSync(path.join(POSTS_DIR, f), 'utf8');
      const { data } = matter(raw);
      return data.status === 'published' ? slug : null;
    })
    .filter(Boolean) as string[];
}

/** Build a flat search index payload — all published cards, minimal fields. */
export interface SearchIndexEntry {
  slug: string;
  title: string;
  description: string;
  category: string;
  audienceLayer: AudienceLayer;
  keywords: string;  // joined string for search
  body: string;      // raw MDX body (stripped of MDX syntax for indexing)
}

export function buildSearchIndex(): SearchIndexEntry[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.mdx'));

  return files
    .map((file) => {
      const slug = file.replace(/\.mdx$/, '');
      const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
      const { data, content } = matter(raw);
      const fm = data as PostFrontmatter;
      if (fm.status !== 'published') return null;

      // Strip MDX/Markdown syntax for plain-text indexing
      const plainBody = content
        .replace(/```[\s\S]*?```/g, '')   // code blocks
        .replace(/`[^`]+`/g, '')           // inline code
        .replace(/#{1,6}\s/g, '')          // headings
        .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
        .replace(/\*([^*]+)\*/g, '$1')     // italic
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
        .replace(/\n{2,}/g, ' ')
        .trim();

      return {
        slug,
        title: fm.title,
        description: fm.description,
        category: fm.category,
        audienceLayer: fm.audienceLayer,
        keywords: [
          fm.keywords?.primary ?? '',
          ...(fm.keywords?.secondary ?? []),
        ].join(' '),
        body: plainBody,
      };
    })
    .filter(Boolean) as SearchIndexEntry[];
}

/** Returns published PostCards whose codexAnchors capacities include the given family. */
export function getPostsByCapacity(family: string): PostCard[] {
  return getAllPostCards().filter((p) => {
    const { primary, secondary } = p.frontmatter.codexAnchors.capacities
    return primary === family || secondary === family
  })
}
