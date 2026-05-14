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
    /* image — width/height are REQUIRED when image is present so the OG
       meta + on-page <img> never lie about dimensions. The Astro built-in
       image() helper auto-infers these, but it requires images to live in
       src/; this project stores them in public/posts/<slug>/, so authors
       declare dimensions in frontmatter instead. The 1200×675 cover crop
       is the established convention (see CLAUDE.md). */
    image: z
      .object({
        src: z.string(),
        alt: z.string(),
        caption: z.string().optional(),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
      })
      .optional(),
  }),
});

export const collections = { posts };
