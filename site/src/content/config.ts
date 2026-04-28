import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    posted: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    readTime: z.string().optional(),
    image: z
      .object({
        src: z.string(),                // path under /public, e.g. /posts/voice-cover.svg
        alt: z.string(),
      })
      .optional(),
  }),
});

export const collections = { posts };
