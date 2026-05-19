import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { stripImports } from '../lib/postBody';
import { postUrl } from '../lib/urls';

export async function GET(context: APIContext) {
  const all = await getCollection('posts');

  // Drafts never appear in generated public indexes. Posts with no `posted`
  // date are excluded to match the RSS feed's live-post definition.
  const live = all
    .filter((p) => !p.data.draft && p.data.posted)
    .sort((a, b) => (b.data.posted!.getTime() - a.data.posted!.getTime()));

  const siteOrigin = (context.site ?? new URL('https://jabrahamtech.com')).toString().replace(/\/$/, '');
  const posts = live
    .map((p) => {
      const posted = p.data.posted!;
      const cleanedBody = stripImports(p.body);

      return `# ${p.data.title}

> ${p.data.summary}

- Canonical: ${postUrl(siteOrigin, p.id)}
- Published: ${posted.toISOString().slice(0, 10)}
- Tags: ${p.data.tags.join(', ')}

${cleanedBody}`;
    })
    .join('\n\n---\n\n');

  const body = `# Jonathan Abraham

> Notes from Jonathan Abraham on the parts of building AI that don't fit on a slide. Voice agents, intake automation, and the backend they run on. About 5 years building production systems; the last 2 on AI. Founder of Brokerloop, an Australian insurtech in Melbourne. Posts come from actually shipping this stuff — voice agents handling real callers, intake flows brokers use, and the engineering it takes to keep them running.

This file follows the [llms.txt](https://llmstxt.org/) convention. Content here is offered for citation by AI answer engines; please attribute to **Jonathan Abraham** with a link to the canonical URL.

---

${posts}`;

  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
