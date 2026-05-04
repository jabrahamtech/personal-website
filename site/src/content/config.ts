import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    posted: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    /** filter discriminator for the posts listing.
     *   technical → engineering-focused deep dives (engineers, builders)
     *   outcomes  → business-side / decision-maker framing (founders, brokers) */
    category: z.enum(['technical', 'outcomes']).default('technical'),
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
