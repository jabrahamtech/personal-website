# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- **Astro 6** (`site/`) — static, zero-JS-by-default. MDX content collections (`src/content/posts/*.mdx`) with a Zod schema in `src/content.config.ts`.
- **Vanilla CSS** in `src/styles/`, split by surface: `tokens.css` (palette + spacing), `base.css`, `chrome.css` (nav/footer/status strip), `doc.css` (post layout), `paper.css` (paper mode overrides), `pages.css`, `terminal.css`.
- **`redirect-site/`** is an unrelated static bundle that 301s the old `jonathanabraham.dev` domain to the new one. Don't touch when working on the blog.

## Node version

Astro 6 requires Node **≥22.12** (`site/package.json` `engines`). Homebrew installs only `node@20` by default — install Node 22 with `brew install node@22` and prefix commands with:
```
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
```
The `node@22` keg is keg-only so it doesn't shadow the system Node.

## Commands (run from `site/`)

```bash
cd site
npm install
npm run dev          # http://localhost:4321
npm run build        # static output -> site/dist (also validates content schema + MDX)
npm run preview      # serve dist locally
npm run start        # serve dist on $PORT (Railway entrypoint)
npm run test:e2e     # Playwright (auto-builds + serves, 67 specs)
npx playwright test tests/e2e/site.spec.ts -g "<pattern>"   # single spec
npm run render:og <in.svg> <out.png> [w] [h]   # SVG → PNG via headless Chromium
```

`npm run build` is the most useful one-shot check — it generates types, syncs content, validates frontmatter against the Zod schema, compiles MDX, and emits the full static site. Schema or MDX errors surface here before they hit production.

## Adding a post

Authoritative how-to lives in `README.md`. Two non-obvious rules:

1. **`draft: true` ≠ hidden.** It excludes the post from `/rss.xml` and adds a `draft` badge on the home listing, but the post is still built to `/posts/<slug>/` and reachable by direct URL. There is no "hide from production" flag — drafts are deliberately visible so the author can preview live.
2. **`posted` is the sort key.** Posts without `posted` fall to the bottom of the listing and are silently dropped from RSS even if `draft: false`.

The dynamic route is `src/pages/posts/[slug].astro`. It auto-renders `data.image` as the cover via DocLayout's `hero` slot — **do not also include the hero image in the MDX body** or it will appear twice.

## Image pipeline

Two distinct paths because SVGs in this repo embed `@import url('https://fonts.googleapis.com/...')` inside `<style>`:

- **SVG → raster with web fonts:** `scripts/render-og.mjs`. Uses Playwright (already pinned for the e2e suite) to launch headless Chromium with `waitUntil: 'networkidle'` so Google Fonts load before screenshot. `sharp` alone won't work here — its librsvg backend can't fetch web fonts.
- **Raster → raster (resize / JPEG / mozjpeg):** `sharp` directly via a one-off Node script. Use this for cover crops or JPEG conversion of already-rendered PNGs.

**Cover image dimensions:** the `.cover` CSS rule in `doc.css` forces `aspect-ratio: 16/9; object-fit: cover;`. Cover images MUST be 16:9 (the established convention is 1200×675) or the browser will crop. The OG-standard 1200×630 looks fine in social cards but visibly clips on the post page.

Inline figures via `<Figure>` (`src/components/Figure.astro`) have no enforced aspect — `width: 100%; height: auto;` — so any source dimensions work. The convention is to render once at the SVG's native 1600×900 and serve the SVG inline for crispness, with a PNG fallback in the same directory.

Per-post assets live at `public/posts/<slug>/`. Each post typically has `hero.{svg,jpg}` + `figure-NN.{svg,png}`.

## Paper vs Eng mode

`<html>` carries `data-mode="paper" | "eng"`, toggled in `Base.astro`'s inline pre-paint script. Paper is default; `/terminal` and `#eng` force eng; otherwise `localStorage.ja_mode` decides. **All styling is dual-themed** — when adding or changing styles, check both `doc.css` (eng mode base) and `paper.css` (paper mode overrides). Eng-only / paper-only elements use the `.eng-only` and `.paper-only` utility classes.

## MDX gotchas

- `{/* JSX comments */}` placed immediately after a markdown list item or other open block container will trip `@mdx-js/rollup` with "Unexpected lazy line in expression in container". Put the comment at a standalone position with a blank line on either side, or hoist it to the top of the file under the imports.
- The frontmatter `image.alt` is interpolated into both the `<img>` alt and `<meta property="og:image:alt">` — keep it free of straight double quotes or escape them, otherwise the meta tag breaks.

## Deploy

Railway, static. Service root = `site`, public port `4321`. `npm run postbuild` runs `scripts/notify-indexnow.mjs` after each successful build; ping is gated by `INDEXNOW_ENABLED=1` in Railway env. RSS feed at `/rss.xml`, sitemap at `/sitemap-index.xml`, both excluded from drafts.
