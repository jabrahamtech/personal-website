# jonathan_abraham.os

Personal website for **Jonathan Abraham** — AI systems engineer based in Melbourne, AU.

A retro terminal "operator command centre" with an interactive command line, boot sequence, live status HUD, and case-study sub-pages.

## Stack

- **Astro 4** (static, zero-JS-by-default with progressive enhancement)
- Vanilla CSS with design tokens (`src/styles/global.css`)
- Self-hosted Google Fonts (JetBrains Mono · Inter · VT323)
- Deploys to any static host (Vercel, Cloudflare Pages, Netlify, GitHub Pages)

## Repo layout

```
design_handoff_personal_website/  # original HTML/CSS reference designs
site/                             # Astro implementation (source of truth)
  src/
    layouts/Base.astro            # head + nav + footer + sprite + HUD + boot
    components/                   # Nav, Footer, StatusHUD, BootSequence, Terminal
    pages/                        # index, 404, projects/*, writing/*
    styles/global.css             # design tokens + components
  public/                         # robots.txt, og.png (TODO), favicon (inline SVG)
  dist/                           # build output
```

## Develop

```bash
cd site
npm install
npm run dev      # http://localhost:4321
npm run build    # static output -> site/dist
npm run preview  # serve dist locally
```

## Production TODO

- [ ] Real bio + project case-study bodies + article bodies (currently lorem)
- [ ] OG image at 1200×630 (`public/og.png`)
- [ ] Wire contact form to a real backend (currently posts to formsubmit.co)
- [ ] Add `apple-touch-icon` + `manifest.webmanifest` for installability
- [ ] Sitemap + RSS via `@astrojs/sitemap` + `@astrojs/rss`
- [ ] Self-host fonts via `@fontsource/jetbrains-mono` + `@fontsource/inter`
- [ ] Spam protection on the contact form (Cloudflare Turnstile)
- [ ] Analytics (Plausible / Umami)

## Design reference

See `design_handoff_personal_website/README.md` for the full design spec — design tokens, components, motion, accessibility notes.
