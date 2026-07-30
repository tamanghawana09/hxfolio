import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    readTime: z.string(),
    category: z.string(),
    tags: z.array(z.string()),
    featured: z.boolean().default(false),
    accent: z.enum(['yellow', 'blue', 'coral', 'mint', 'violet']).default('yellow'),
  }),
});

export const collections = { blog };
