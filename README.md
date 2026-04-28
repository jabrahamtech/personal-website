# jonathan_abraham.os

Personal website for **Jonathan Abraham** — AI systems engineer based in Melbourne, AU.

A retro terminal "operator command centre" with an interactive command line, boot sequence, live status HUD, and case-study sub-pages.

## Stack

- **Astro 4** (static, zero-JS-by-default with progressive enhancement)
- **Astro Content Collections** (MDX) for projects + writing
- **@astrojs/sitemap** for `sitemap-index.xml` / `sitemap-0.xml`
- Vanilla CSS with design tokens (`src/styles/global.css`)
- Google Fonts CDN (JetBrains Mono · Inter · VT323)

## Repo layout

```
design_handoff_personal_website/      # original HTML reference designs (kept for posterity)
site/                                 # Astro implementation (source of truth)
  src/
    layouts/
      Base.astro                      # head, nav, footer, sprite, HUD, boot
      DocLayout.astro                 # shared shell for project + article detail pages
    components/
      Nav · Footer · BootSequence · StatusHUD · Terminal
      PixelIcon · OsCard · Schematic
      ProjectVis · ProjectCard · ArticleCard
      sections/
        Hero · OperatingSystem · ProofOfWork
        Services · WritingSection · About · Contact
    content/
      config.ts                       # Zod schemas for projects + writing collections
      projects/*.mdx                  # one MDX file per case study
      writing/*.mdx                   # one MDX file per article
    pages/
      index.astro                     # composes the section components
      404.astro                       # kernel-panic page
      projects/[slug].astro           # dynamic route, getStaticPaths from collection
      writing/[slug].astro            # dynamic route, getStaticPaths from collection
    styles/global.css                 # design tokens + components
  public/
    robots.txt
  dist/                               # build output (gitignored)
```

## Develop

```bash
cd site
npm install
npm run dev      # http://localhost:4321
npm run build    # static output -> site/dist
npm run preview  # serve dist locally
```

## Add a project

Drop a new MDX file in `site/src/content/projects/<slug>.mdx` with the schema-required frontmatter (see `src/content/config.ts`). The card on the home page and the `/projects/<slug>` route both render automatically.

## Add a writing note

Drop a new MDX file in `site/src/content/writing/<slug>.mdx`. Same idea.

## Production TODO

- [ ] Replace lorem ipsum with real bios + case-study bodies + article bodies
- [ ] OG image at 1200×630 (`public/og.png`)
- [ ] Wire contact form to a real backend (currently posts to formsubmit.co)
- [ ] Add `apple-touch-icon` + `manifest.webmanifest`
- [ ] Self-host fonts via `@fontsource/jetbrains-mono` + `@fontsource/inter`
- [ ] Spam protection on the contact form (Cloudflare Turnstile)
- [ ] Analytics (Plausible / Umami)

## Design reference

See `design_handoff_personal_website/README.md` for the full design spec — tokens, components, motion, accessibility notes.
