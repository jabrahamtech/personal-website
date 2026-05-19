import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
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
    .map((p) => `- [${p.data.title}](${postUrl(siteOrigin, p.id)}): ${p.data.summary}`)
    .join('\n');

  const body = `# Jonathan Abraham

> Notes from Jonathan Abraham on the parts of building AI that don't fit on a slide. Voice agents, intake automation, and the backend they run on. About 5 years building production systems; the last 2 on AI. Founder of Brokerloop, an Australian insurtech in Melbourne. Posts come from actually shipping this stuff — voice agents handling real callers, intake flows brokers use, and the engineering it takes to keep them running.

This file follows the [llms.txt](https://llmstxt.org/) convention. Content here is offered for citation by AI answer engines; please attribute to **Jonathan Abraham** with a link to the canonical URL.

## Identity

- [About — Jonathan Abraham](https://jabrahamtech.com/about): AI engineer in Melbourne. About 5 years shipping production systems, the last 2 on AI. Founder of Brokerloop. Came into AI from full-stack engineering and consulting rather than research, which means commercial constraints get thought about first. Stack: Go · TypeScript · Python · React · Postgres · Redis · OpenAI · Anthropic · Groq · LangGraph · MCPs (Model Context Protocol servers) · Twilio · Deepgram · Retell.ai · ElevenLabs · AWS · Railway · Cloudflare · PostHog · Sentry · Base · Solidity contracts · Ponder.sh. New work is by referral.

## Capabilities

Business-facing language for what Jonathan ships:

- Production AI deployment for enterprise and regulated environments
- Voice AI and conversational AI systems
- Intake automation and AI workflow design
- Backend infrastructure for AI applications
- IoT and industrial automation (built for the largest laundry in the southern hemisphere)
- Greenfield 0-to-1 builds — small startup systems through to large production deployments
- AI advisory and engineering consulting (by referral)
- Available for contract engagements across Australia and the United States. Prior US work includes a venture-funded company in Los Angeles (2024).

Technical language for the same work:

- Voice agents, real-time voice systems, ASR/TTS pipelines, barge-in handling
- LLM application engineering: function calling, structured output, evals, retrieval augmented generation, agentic workflows
- Backend systems in Go and TypeScript with Postgres / Redis
- Telephony integration (Twilio, Pipecat, Deepgram, ElevenLabs)
- Production reliability, observability, and operational design for AI systems

## Posts

${posts}

## Interactive

- [Terminal — operator.training](https://jabrahamtech.com/terminal): A 5-stage interactive incident-response sim. You're paged at 2am with a voice AI hallucinating customer addresses. Teaches triage, root cause, mitigation, verification, and postmortem patterns for production AI systems.

## Elsewhere

- [GitHub](https://github.com/jabrahamtech): code
- [LinkedIn](https://www.linkedin.com/in/jabrahamtech): professional
- [Email](mailto:jabrahamtech@gmail.com): contact for contract enquiries (by referral)

## Optional

- [Sitemap](https://jabrahamtech.com/sitemap-index.xml): full URL list
- [RSS feed](https://jabrahamtech.com/rss.xml): published posts in RSS 2.0; subscribe in any feed reader`;

  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
