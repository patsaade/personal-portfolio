import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    author: z.string().default('Patrick Saade'),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    category: z.enum([
      'Memory Forensics',
      'Host Forensics',
      'EDR Analysis',
      'Labs',
      'Tools',
      'Notes',
    ]),
    tags: z.array(z.string()).default([]),
    excerpt: z.string(),
    readTime: z.number().optional(),
    difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Hard']).optional(),
    tools: z.array(z.string()).default([]),
    heroImage: z.string().optional(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
  }),
});

const labs = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/labs' }),
  schema: z.object({
    title: z.string(),
    author: z.string().default('Patrick Saade'),
    date: z.coerce.date(),
    type: z.literal('lab').default('lab'),
    difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Hard']),
    source: z.string(), // CyberDefenders, 13Cubed, Magnet, BTLO, Home Lab...
    sourceUrl: z.string().url().optional(),
    timeSpent: z.string().optional(),
    excerpt: z.string(),
    tags: z.array(z.string()).default([]),
    tools: z.array(z.string()).default([]),
    iocCount: z.number().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog, labs };
