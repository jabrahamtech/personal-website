# jonathan_abraham.dev

Personal site / blog for **Jonathan Abraham** — founder, [Brokerloop](https://brokerloop.com.au) (insurtech, Melbourne AU); senior engineer working on production voice AI and backend AI infrastructure.

This is a writing-first site, in the spirit of [smcleod.net](https://smcleod.net/). Notes on production AI, voice AI, backend systems in Go, and the operational shape of running an insurtech.

## Stack

- **Astro 4** (static, zero-JS-by-default)
- **Astro Content Collections** (MDX) for posts
- **@astrojs/rss** for `/rss.xml`
- **@astrojs/sitemap** for `/sitemap-index.xml`
- Vanilla CSS with operator-terminal design tokens (`src/styles/global.css`)

## Repo layout

```
design_handoff_personal_website/  # original handoff (kept for posterity)
site/                             # Astro implementation
  src/
    layouts/
      Base.astro                  # head + nav + footer
      DocLayout.astro             # post detail shell
    components/
      Nav · Footer
    content/
      config.ts                   # posts collection schema (Zod)
      posts/*.mdx                 # one MDX file per post
    pages/
      index.astro                 # posts list
      about.astro                 # bio
      404.astro                   # kernel-panic 404
      posts/[slug].astro          # dynamic route, getStaticPaths from collection
      rss.xml.ts                  # RSS feed (drafts excluded)
    styles/global.css
  tests/e2e/site.spec.ts          # Playwright suite
  public/robots.txt
```

## Develop

```bash
cd site
npm install
npm run dev          # http://localhost:4321
npm run build        # static output -> site/dist
npm run start        # serve dist on $PORT (Railway entrypoint)
npm run test:e2e     # Playwright (auto-builds + serves)
```

## Add a post

Drop a new MDX file in `site/src/content/posts/<slug>.mdx`:

```mdx
---
title: 'My new post'
summary: 'Short one-line description.'
posted: 2026-05-01           # omit to keep it as a draft
draft: false                  # set true to exclude from list + RSS
tags: ['voice-ai']
readTime: '~ 5 min'
---

Body in markdown / MDX.
```

The post appears in the home list and the RSS feed automatically; the dynamic route `/posts/<slug>` renders it via the shared DocLayout.

## Deploy (Railway)

- Service Root Directory = `site`
- Service Public Networking → port `4321`
- `npm start` runs `serve dist --listen tcp://0.0.0.0:${PORT:-4321}`
- Custom domain: jabrahamtech.com (old: jonathanabraham.dev — see `redirect-site/`)

## Production TODO

- [ ] Write the three drafts (currently stubbed with one-sentence theses)
- [ ] OG image at 1200×630 (`public/og.png`)
- [ ] Self-host fonts (`@fontsource/jetbrains-mono` + `@fontsource/inter`)
- [ ] Analytics (Plausible / Umami)
