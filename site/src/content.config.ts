import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    posted: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    priority: z.number().int().positive().optional(),
    pipelineStatus: z.string().default('Prioritised'),
    contentTypes: z
      .array(
        z.enum([
          'Learning Journey Guide',
          'Technical Build Breakdown',
          'Business Outcome Case Study',
          'Decision / Comparison Guide',
          'Diagnostic / Failure Mode Guide',
          'Playbook / Checklist / SOP Guide',
          'POV / Strategic Opinion Post',
        ]),
      )
      .default(['POV / Strategic Opinion Post']),
    cluster: z.string().optional(),
    readTime: z.string().optional(),
    image: z
      .object({
        src: z.string(),
        alt: z.string(),
      })
      .optional(),
  }),
});

export const collections = { posts };
