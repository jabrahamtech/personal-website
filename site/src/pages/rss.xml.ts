import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const all = await getCollection('posts');

  // Drafts never appear in feeds. Posts with no `posted` date are also
  // excluded — RSS without a pubDate is a footgun for feed readers (some
  // de-duplicate by date and silently drop the item).
  const live = all
    .filter((p) => !p.data.draft && p.data.posted)
    .sort((a, b) => (b.data.posted!.getTime() - a.data.posted!.getTime()));

  const site = (context.site ?? new URL('https://jabrahamtech.com')).toString().replace(/\/$/, '');
  const feedUrl = `${site}/rss.xml`;

  return rss({
    // Channel metadata.
    title: 'Jonathan Abraham — posts',
    description: 'Notes on shipping AI that has to actually work. Voice agents, intake automation, and the backend they run on.',
    site,

    // Stylesheet so the raw .xml is readable in a browser. Best-practice on
    // engineer feeds: humans who hit the URL get a styled view, not XML soup.
    stylesheet: '/rss/styles.xsl',

    // Channel-level extras the RSS 2.0 spec recommends and most validators
    // (W3C Feed Validator, FeedValidator.org) flag if missing.
    customData: [
      `<language>en-au</language>`,
      `<copyright>© ${new Date().getFullYear()} Jonathan Abraham. All rights reserved.</copyright>`,
      `<managingEditor>jabrahamtech@gmail.com (Jonathan Abraham)</managingEditor>`,
      `<webMaster>jabrahamtech@gmail.com (Jonathan Abraham)</webMaster>`,
      `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
      // atom:link self-reference is required by the RSS Best Practices Profile
      // and by the W3C feed validator.
      `<atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />`,
      // Image / channel logo. Feed readers display this beside the channel.
      // <image><link> must match the channel <link> verbatim per the
      // W3C feed validator. @astrojs/rss derives <channel><link> from
      // `site` with no trailing slash, so this stays bare too.
      `<image>`,
      `  <url>${site}/og/default.png</url>`,
      `  <title>Jonathan Abraham — posts</title>`,
      `  <link>${site}</link>`,
      `</image>`,
    ].join(''),

    // xmlns extensions: atom (for self-link), content (for content:encoded
    // if we ever ship full-text), dc (for dc:creator).
    xmlns: {
      atom: 'http://www.w3.org/2005/Atom',
      content: 'http://purl.org/rss/1.0/modules/content/',
      dc: 'http://purl.org/dc/elements/1.1/',
    },

    items: live.map((p) => ({
      title: p.data.title,
      description: p.data.summary,
      link: `${site}/posts/${p.slug}`,
      pubDate: p.data.posted!,
      categories: p.data.tags,
      author: 'jabrahamtech@gmail.com (Jonathan Abraham)',
      // Stable per-item GUID. Using the canonical post URL is the standard
      // pattern; isPermaLink="true" tells readers it's also a real URL.
      customData: `<dc:creator>Jonathan Abraham</dc:creator>${p.data.image ? `<enclosure url="${new URL(p.data.image.src, site + '/').toString()}" type="image/png" length="0" />` : ''}`,
    })),

    // Trim the trailing newline difference that some validators flag.
    trailingSlash: false,
  });
}
