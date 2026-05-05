import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
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
        src: z.string(),                // path under /public, e.g. /posts/voice-cover.svg
        alt: z.string(),
      })
      .optional(),
  }),
});

export const collections = { posts };
