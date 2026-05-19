import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeExternalLinks from 'rehype-external-links';

export default defineConfig({
  site: 'https://jabrahamtech.com',
  integrations: [mdx(), sitemap()],
  markdown: {
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'append',
          properties: {
            className: ['heading-anchor'],
            ariaLabel: 'permalink',
          },
          content: { type: 'text', value: '#' },
        },
      ],
      [
        rehypeExternalLinks,
        {
          // External links open in a new tab; internal links stay in-page so
          // browser history and the nav strip keep working as expected.
          target: '_blank',
          rel: ['noopener', 'noreferrer'],
        },
      ],
    ],
  },
});
