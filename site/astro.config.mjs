import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeExternalLinks from 'rehype-external-links';
import { readdirSync, readFileSync } from 'node:fs';

const postsDir = new URL('./src/content/posts/', import.meta.url);
const draftSlugs = new Set(
  readdirSync(postsDir)
    .filter((file) => /\.(md|mdx)$/.test(file))
    .filter((file) => {
      const source = readFileSync(new URL(file, postsDir), 'utf8');
      const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      return Boolean(frontmatter?.[1] && /^draft:\s*true\s*$/m.test(frontmatter[1]));
    })
    .map((file) => file.replace(/\.(md|mdx)$/, ''))
);

export default defineConfig({
  site: 'https://jabrahamtech.com',
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => {
        // /terminal is noindex (an interactive easter egg, not content to rank),
        // so keep it out of the sitemap — listing a noindex URL is inconsistent.
        if (/\/terminal\/?$/.test(page)) return false;
        const m = page.match(/\/posts\/([^/]+)\/?$/);
        return !m || !draftSlugs.has(m[1]);
      },
    }),
  ],
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
