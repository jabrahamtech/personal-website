import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const all = await getCollection('posts');
  const posts = all
    .filter((p) => !p.data.draft)
    .sort((a, b) => (b.data.posted?.getTime() ?? 0) - (a.data.posted?.getTime() ?? 0));

  return rss({
    title: 'Jonathan Abraham',
    description: 'Notes on production AI, voice AI, and backend systems — Jonathan Abraham, founder of Brokerloop.',
    site: context.site ?? 'https://jonathanabraham.dev',
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.posted ?? new Date(),
      description: post.data.summary,
      link: `/posts/${post.slug}`,
      categories: post.data.tags,
    })),
    customData: '<language>en-au</language>',
  });
}
