# jabrahamtech.com

Personal site / blog for **Jonathan Abraham** — founder, [Brokerloop](https://brokerloop.com.au) (insurtech, Melbourne AU); senior engineer working on production voice AI and backend AI infrastructure.

## Stack

- **Astro 6** (static, zero-JS-by-default)
- **Astro Content Collections** (MDX) for posts, with a Zod schema
- **rehype-slug + rehype-autolink-headings** for `#`-anchored headings
- **@astrojs/rss** for `/rss.xml` (XSL-styled human view, drafts excluded)
- **@astrojs/sitemap** for `/sitemap-index.xml`
- **IndexNow** ping on every Railway deploy (`scripts/notify-indexnow.mjs`)
- Vanilla CSS with operator-terminal design tokens (`src/styles/global.css`)
- **Playwright** e2e suite (67 specs)

## Repo layout

```
site/
  src/
    layouts/
      Base.astro                 # head + JSON-LD spine + page-loader
      DocLayout.astro            # post detail shell + TOC + progress bar
    components/
      Nav · Footer · StatusStrip · BootSequence · Terminal
      Callout · Figure · CodeBlock     # MDX authoring components
    content/
      config.ts                  # posts collection schema (Zod)
      posts/*.mdx                # one MDX file per post
    lib/
      readTime.ts                # shared 230 wpm reader-time util
    pages/
      index.astro                # posts list (auto-computed read time + word count)
      about.astro                # bio
      404.astro                  # kernel-panic 404
      terminal.astro             # interactive operator.training terminal
      posts/[slug].astro         # dynamic route, getStaticPaths from collection
      rss.xml.ts                 # RSS feed (drafts excluded)
    styles/global.css            # all CSS, terminal palette + tokens
  public/
    favicon.svg + favicon.png + apple-touch-icon.png
    og/default.{svg,png}         # default OG card
    posts/<slug>-cover.{svg,png} # per-post covers
    social/x-banner.{svg,png}    # X profile banner
    rss/styles.xsl               # human-readable RSS view
  scripts/
    render-og.mjs                # SVG → PNG via headless Chromium (any size)
    notify-indexnow.mjs          # postbuild IndexNow ping
  tests/e2e/site.spec.ts         # Playwright suite
redirect-site/                   # static bundle for the old jonathanabraham.dev domain
```

## Develop

```bash
cd site
npm install
npm run dev          # http://localhost:4321
npm run build        # static output -> site/dist
npm run start        # serve dist on $PORT (Railway entrypoint)
npm run test:e2e     # Playwright (auto-builds + serves)
npm run render:og    # rebuild the default OG card from /public/og/default.svg
```

`npm run render:og <input.svg> <output.png> [<width>] [<height>]` works for any SVG → PNG render — same pipeline used for the X banner and per-post covers.

## Add a post

```mdx
---
title: 'My new post'
summary: 'Short one-line description.'
posted: 2026-05-01           # omit to keep it as a draft
draft: false                  # true → excluded from RSS, shown on home with "draft" badge
tags: ['voice-ai']
priority: 1                   # optional — lower numbers sort first in the draft pipeline
pipelineStatus: Prioritised
contentTypes:
  - Learning Journey Guide
cluster: Adaptive AI / Voice AI
image:                        # optional — falls back to /og/default.png
  src: /posts/my-cover.png
  alt: 'Alt text.'
---

import Callout from '../../components/Callout.astro';
import Figure from '../../components/Figure.astro';
import CodeBlock from '../../components/CodeBlock.astro';

Body in markdown / MDX.

<Callout type="warn">Use these for asides; type can be note | warn | tip | info.</Callout>

<CodeBlock filename="src/foo.ts" lang="ts">
\`\`\`ts
const x = 1;
\`\`\`
</CodeBlock>

<Figure src="/posts/diagram.png" alt="..." caption="Fig. 1 — caption text" />
```

`readTime` is auto-computed at build time (230 wpm, strips code/JSX before counting). The post appears in the home list and the RSS feed automatically; the dynamic route `/posts/<slug>` renders it via `DocLayout`, which adds a hex post ID, autolinked headings, a sticky right-rail TOC on wide viewports, a `[copy]` button on every `<pre>`, an `[EOF — 0xNN]` marker, and an "edit on GitHub" link.

## Deploy (Railway)

- Service Root Directory = `site`
- Service Public Networking → port `4321`
- `npm start` runs `serve dist --listen tcp://0.0.0.0:${PORT:-4321}`
- Custom domain: `jabrahamtech.com` (old: `jonathanabraham.dev` — see `redirect-site/`)
- Set `INDEXNOW_ENABLED=1` in Railway env to ping IndexNow after each deploy

## Open improvements

- [ ] Self-host fonts (`@fontsource/jetbrains-mono` + `@fontsource/inter`) — removes the only third-party network dependency
- [ ] Analytics (Plausible / Umami / PostHog)
- [ ] Per-tag pages so the existing tag pills click through
- [ ] Security response headers at the Fastly edge (CSP, HSTS, X-Frame-Options, etc.)

## License

[MIT](LICENSE) for the code. Post bodies, illustrations, OG cards, and the X banner are © 2026 Jonathan Abraham — short attributed excerpts welcome, please don't republish in full.
