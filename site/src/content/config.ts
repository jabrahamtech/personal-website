import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    status: z.string(),
    year: z.number(),
    role: z.string(),
    stack: z.string(),
    tags: z.array(z.string()),
    cardDescription: z.string(),
    cardCta: z.string().default('view_breakdown'),
    versionTag: z.string(),
    versionTagColor: z.enum(['green', 'cyan', 'purple']).default('green'),
    accentColor: z.enum(['green', 'cyan', 'purple']).default('green'),
    order: z.number(),
    contentsToc: z.array(z.string()).default(['overview', 'architecture', 'spec sheet']),
  }),
});

const writing = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    category: z.string(),
    readTime: z.string(),
    posted: z.string(),
    order: z.number(),
  }),
});

export const collections = { projects, writing };
