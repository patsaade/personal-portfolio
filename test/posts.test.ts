import { describe, it, expect } from 'vitest';
import { estimateReadTime, getRelatedPosts, type BlogPost } from '../src/utils/posts';

// Build a minimal blog entry shaped like a real CollectionEntry<'blog'>.
function post(id: string, category: string, tags: string[] = []): BlogPost {
  return { id, body: '', data: { category, tags } } as unknown as BlogPost;
}

describe('estimateReadTime', () => {
  it('uses the explicit fallback when provided', () => {
    expect(estimateReadTime('anything at all', 7)).toBe(7);
  });

  it('returns at least 1 minute for empty/undefined bodies', () => {
    expect(estimateReadTime(undefined)).toBe(1);
    expect(estimateReadTime('')).toBe(1);
  });

  it('estimates ~200 words per minute', () => {
    const body = Array(400).fill('word').join(' '); // 400 words
    expect(estimateReadTime(body)).toBe(2);
  });
});

describe('getRelatedPosts', () => {
  const current = post('a', 'Memory Forensics', ['volatility3', 'malware']);
  const sameCategory = post('b', 'Memory Forensics', []); // +3
  const sharedTag = post('c', 'Host Forensics', ['malware']); // +1
  const unrelated = post('d', 'Tools', ['career']); // 0 -> excluded
  const all = [current, sameCategory, sharedTag, unrelated];

  it('excludes the current post and zero-score posts', () => {
    const related = getRelatedPosts(current, all);
    const ids = related.map((p) => p.id);
    expect(ids).not.toContain('a');
    expect(ids).not.toContain('d');
  });

  it('ranks same-category above shared-tag', () => {
    const related = getRelatedPosts(current, all);
    expect(related.map((p) => p.id)).toEqual(['b', 'c']);
  });

  it('respects the limit', () => {
    const many = [
      current,
      post('b', 'Memory Forensics'),
      post('c', 'Memory Forensics'),
      post('e', 'Memory Forensics'),
    ];
    expect(getRelatedPosts(current, many, 2)).toHaveLength(2);
  });
});
