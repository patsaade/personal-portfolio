import { getCollection, type CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;
export type Lab = CollectionEntry<'labs'>;

const isProd = import.meta.env.PROD;

/** All non-draft blog posts, newest first. */
export async function getSortedPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('blog', ({ data }) => !isProd || !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** All non-draft labs, newest first. */
export async function getSortedLabs(): Promise<Lab[]> {
  const labs = await getCollection('labs', ({ data }) => !isProd || !data.draft);
  return labs.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** URL-safe slug for a tag (e.g. "Memory Analysis" -> "memory-analysis"). */
export function tagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export type TagCount = { tag: string; slug: string; count: number };

/** Aggregate tags from a list of posts into slug+count, sorted by count then name. */
export function collectTags(posts: BlogPost[]): TagCount[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.data.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, slug: tagSlug(tag), count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** All tags across non-draft posts, with slug + count, sorted by count then name. */
export async function getTags(): Promise<TagCount[]> {
  return collectTags(await getSortedPosts());
}

/** Estimate reading time from rendered body length (~200 wpm). */
export function estimateReadTime(body: string | undefined, fallback?: number): number {
  if (fallback) return fallback;
  if (!body) return 1;
  const words = body.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

/**
 * Find posts related to the given one — same category first, then shared tags.
 */
export function getRelatedPosts(
  current: BlogPost,
  all: BlogPost[],
  limit = 3,
): BlogPost[] {
  const others = all.filter((p) => p.id !== current.id);
  const scored = others.map((p) => {
    let score = 0;
    if (p.data.category === current.data.category) score += 3;
    const shared = p.data.tags.filter((t) => current.data.tags.includes(t));
    score += shared.length;
    return { post: p, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.post);
}
