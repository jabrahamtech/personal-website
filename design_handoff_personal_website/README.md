# Handoff: Personal Website — jonathan_abraham.os

## Overview

A single-page personal website for **Jonathan Abraham**, an AI systems engineer / software operator focused on AI workflow automation, voice AI, blockchain/Web3 ops, and technical deal-making.

The site's core idea is a **retro terminal "operator command centre"** aesthetic — premium, readable, and professional enough for founders, CTOs, and funders, while still feeling distinct and memorable.

Primary goals:
- Build trust with US startups, founders, CTOs, funders, AI/Web3 teams
- Drive conversions to: book a call, view projects, read writing, contact for contracting

## About the Design Files

The HTML/CSS/JS files in this bundle are **design references** — interactive prototypes showing the intended look, motion, and information architecture. They are **not production code to ship directly**.

The implementation task is to **recreate these designs in a real codebase** using established patterns. If no codebase exists yet, the recommended target is:

- **Astro + Tailwind CSS + MDX** (writing pages) + **Resend** (contact form) — fast, content-friendly, deploys to Vercel/Cloudflare in one command.
- Alternates: Next.js (App Router) if SSR/server actions are needed, or plain Vite + React for a SPA.

## Fidelity

**High-fidelity.** Final colors, typography, spacing, motion, and interaction patterns are all defined. Recreate pixel-perfectly using the target stack's idioms.

## Files in this bundle

```
Personal Website.html              ← main single-page site (hero, all 7 sections)
assets/site.css                    ← shared design tokens + components for sub-pages
projects/
  voice-ai-intake.html             ← project case-study template
  insurance-workflow.html          ← project case-study template
  web3-ops-agent.html              ← project case-study template
writing/
  voice-ai-after-demo.html         ← article template
  insurance-intake-design.html     ← article template
  ai-automation-operationalise.html ← article template
404.html                           ← terminal-style error page
```

All copy currently uses **lorem ipsum filler** for body content. Real bio, real case studies, and real article drafts must be written by Jonathan and pasted in.

---

## Design Tokens

### Colors (exact hex)

```
--bg:        #0b0e0c   /* deep charcoal background */
--bg-2:      #0f1411
--panel:     #10150f   /* card surface */
--panel-2:   #131a13
--line:      #1d2820   /* hairline border */
--line-2:    #2a3a2d   /* primary border */
--ink:       #ecebe4   /* primary text */
--ink-dim:   #c7c6bc   /* secondary text */
--ink-mute:  #8b9286   /* tertiary / labels */
--green:     #7dff8a   /* primary accent — neon */
--green-2:   #46c463   /* primary accent — muted */
--cyan:      #6ee7ff   /* secondary accent */
--amber:     #f5b860   /* highlight */
--purple:    #c79bff   /* tertiary highlight (web3 contexts) */
--red:       #ff7a7a   /* error / destructive */
```

Keep saturation low on greys (warm-charcoal, not pure neutral). Accents are intentionally bright for the CRT feel; never use them for body text.

### Typography

- **Headings + UI mono**: `JetBrains Mono` (400, 500, 700). Loaded from Google Fonts.
- **Body**: `Inter` (400, 500, 600, 700). Used for prose (article body, sub-copy).
- **Display pixel** (optional, for boot screen / future flourish): `VT323`.

Type scale (matches CSS):
```
h1 hero:    clamp(34px, 5.2vw, 58px) / 1.06 / -0.01em / 700 / mono
h1 doc:     clamp(30px, 4.4vw, 46px) / 1.08 / -0.01em / 700 / mono
h2:         clamp(28px, 3.4vw, 40px) / 1.10 / 700 / mono
h3:         18px / 1.3 / 600 / mono
body sans:  15-16px / 1.55-1.7 / 400 / sans
body mono:  13-14px / 1.55 / 400 / mono
small/labels: 11-12px / mono / often --ink-mute, letter-spacing .04-.06em
```

### Spacing

Standard scale: 4 / 6 / 8 / 10 / 12 / 14 / 18 / 22 / 28 / 32 / 36 / 48 / 60 / 88 px. Sections use `padding: 88px 0 24px`. Cards typically `padding: 22px` or `24px`.

### Borders / radii

**No rounded corners anywhere.** All cards, buttons, inputs are sharp-cornered to maintain the pixel/terminal feel.

### Shadows (the "pixel-card" look)

Cards use a stepped offset shadow (not gaussian blur):
```
box-shadow:
  0 0 0 1px var(--bg) inset,
  4px 4px 0 0 rgba(0,0,0,0.45),
  4px 4px 0 1px var(--line);
```
On hover, offset increases to `6px 6px` and the second border switches to `--green-2`.

CTA primary glow on hover:
```
0 0 24px rgba(125,255,138,0.35)
```

### Backgrounds (global)

Two fixed pseudo-elements over the body:
1. `body::before` — horizontal scanlines: `repeating-linear-gradient(to bottom, rgba(255,255,255,0.012) 0 1px, transparent 1px 3px)`, `mix-blend-mode: overlay`.
2. `body::after` — pixel grid: 48px × 48px, `rgba(125,255,138,0.05)` lines, masked to a center radial gradient, 60s slow drift animation.

Plus two soft radial gradients on `body` (top-right green, mid-left cyan) at 0.04 / 0.035 opacity.

---

## Information Architecture

### Sections (single page, anchor-navigated)

1. **Hero** (`#home`) — headline + interactive terminal
2. **Operating System** (`#operating-system`) — 4 capability pillars
3. **Proof-of-work** (`#proof-of-work`) — 3 featured projects
4. **Services** (`#services`) — 4 ways to engage
5. **Writing** (`#writing`) — 3 articles + category filter
6. **About** (`#about`) — bio + credibility bullets
7. **Contact** (`#contact`) — form + direct channels

### Sub-routes

- `/projects/{slug}` — project case-study detail page
- `/writing/{slug}` — article detail page
- `/404` — error page

---

## Components

### 1. Sticky top nav

- Height 62px, `backdrop-filter: blur(10px)`, semi-transparent bg, 1px bottom border `--line`.
- **Brand**: 7×3px pixel-grid logo + text `jonathan_abraham.os` (`.os` is `--green`).
- **Links**: mono 13px, `--ink-dim`, with `./` prefix on hover/render.
- **CTA**: `▸ start_a_project` — green pixel-button.
- **Mobile (<780px)**: collapses to hamburger; menu drops down absolutely positioned full-width.

### 2. Boot sequence (first visit only)

- Full-screen overlay, fixed.
- Dark green-tinted background, scanlines, vignette.
- ~14 lines of POST output type in sequentially with 60-300ms delays, each `.boot-flash` (0.35s fade-in + scale).
- Skip via `[esc]`, `[enter]`, or click button bottom-right.
- Persists `sessionStorage.boot_seen = '1'` so it only shows once per session.

### 3. Hero

- Two-column grid: 1.05fr text / 0.95fr terminal. Stacks below 920px.
- **Left**: badge row (3 status badges with colored dots), large mono headline, sub-paragraph, two CTAs (primary green + ghost), trust line of mono fragments separated by `·`.
- **Right**: interactive terminal card (see below).

### 4. Interactive Terminal (hero feature)

A real working command line, not a typing animation:

- Window chrome: traffic lights (red/yellow/green squares, not circles), title `operator://jonathan ~ session 0x42`.
- Body shows initial boot output, then a live input row with `$` prompt + blinking cursor.
- Commands implemented:
  - `help` / `?` — list commands
  - `whoami` — operator profile
  - `ls /modules` / `ls` — capability list
  - `projects` — links to proof-of-work
  - `services` — links to services
  - `writing` — links to articles
  - `stack` — runtime / ai / voice / web3 / ops tools
  - `contact` — direct channels
  - `book` — smooth-scrolls to contact
  - `status` — availability
  - `clear` / `cls`
- Tab-completion (matches first command starting with input).
- Up/Down arrow command history.
- Footer bar: connection status, CPU bars, mem indicator.

### 5. Live Status HUD

Fixed bottom-left widget, always visible (hidden < 560px):

- Bar with green pulsing dot + `SYSTEM_LIVE` label, `[ – ]` toggle to collapse.
- Rows:
  - `local_time` — Melbourne clock, ticking every second (UTC+10 approx)
  - `location` — melbourne · au
  - `uptime` — days + years since `2022-03-01`
  - `shipped_q` — `07 systems` (placeholder)
  - `response_sla` — `< 24h`
  - `load` — 8-pixel bar graph, 5 lit
  - `status` — `accepting_briefs` (green)

### 6. Pixel Card (`.pcard`)

Universal container component. Sharp corners, layered shadow, optional `.corner` decorations (4 small green squares at corners). Hover: lifts 2px, second shadow swaps to green.

### 7. Operating System cards (4)

- 4-column grid (collapses 2 / 1 at breakpoints).
- Each card: 5×5 pixel-art icon (custom per pillar, themed color), `/01-/04` index, mono title, dimmed body, tag chips at bottom.
- Pillars: AI Workflow Automation, Voice AI Systems, Web3/Blockchain Ops, Technical Deal-Making.

### 8. Project cards (3)

- 3-column grid, image-on-top layout.
- Visualisation area: 16:10, dark with grid overlay, custom inline SVG architecture diagram per project (nodes + edges, themed accent color).
- Body: title (mono), pipe-separated tag list (mono, muted), short description, `view_breakdown →` CTA in green mono.
- Tagged version label bottom-right (e.g. `v0.4.2 · ok`).

### 9. Service cards (4)

- 2-column grid.
- Topline: title + price/structure pill (`10 business days` is the only "priced" one, others say `scoped engagement`, `monthly retainer`, `advisory`).
- Description + bulleted include list with `▸` markers in green mono.

### 10. Writing

- Category filter row (mono buttons, active state in green with subtle bg tint).
- 3-column article cards: meta row (`[category]` + read time), mono title, summary, `read_note →`.

### 11. About

- 2-column: prose paragraph block (sans, dimmed) / `operator_log` credibility list (mono, `[x]` markers in green).

### 12. Contact

- 2-column grid:
  - **Form**: pcard, name/email row, company/budget row, two textareas (what are you building / what help). All inputs: mono, dark `#0a0e0b` bg, 1px border, focus ring `0 0 0 2px rgba(125,255,138,0.12)`, no border radius. Submit button shows "▸ message_queued ✓" on submit (currently fake — wire to real backend).
  - **Channels**: pcard, list of `email / linkedin / github / twitter` rows with mono glyphs and hover state. Plus availability box at bottom.

### 13. Pixel Sprite

Tiny 14×14 green square fixed to bottom-right, 14s walk loop animation. Pure decorative.

### 14. Article / Project detail pages

- Same nav + footer as main page.
- Breadcrumb row: `~ / writing / <slug>` (mono, muted).
- Prompt label `> ./writing/<slug>`.
- Mono headline.
- Meta row: category, read time, posted date (or status / year / role / stack for projects).
- For projects: tag chips + inline SVG schematic (`.schem` block — terminal-styled SVG with title bar).
- Prose: Inter, 16px / 1.7, max 680px wide. `<h2>` prefixed with `> ` in green. `<blockquote>` styled as design-note callout.
- `<table class="spec">` for spec sheets — mono, dashed dividers.
- Prev/Next pcard pair at the bottom.
- Optional sticky TOC sidebar on `>920px` viewports.

### 15. 404

Standalone, no nav. Centered "kernel panic" layout: red error banner, huge green `404`, fake stack trace in mono with green blinking cursor, two action buttons. Pressing `Esc` returns home.

---

## Interactions & Motion

- All hover transitions: `transform .12s ease, box-shadow .12s ease`.
- Cards lift `translate(-2px, -2px)` and grow shadow on hover.
- Buttons: arrow `→` translates 3px right on hover.
- Section content fades + slides up 8px when scrolled into view (IntersectionObserver, `.reveal.in` class).
- Brand logo pulse: `pulse 1.6s ease-in-out infinite` (opacity 1 ↔ .45).
- Cursor blink: `blink 1s steps(2, start) infinite`.
- Background grid drifts slowly: `gridShift 60s linear infinite`.
- Sprite walk: `spriteWalk 14s linear infinite`.

**Reduce-motion**: not yet implemented — add `@media (prefers-reduced-motion: reduce)` to disable boot sequence auto-play, sprite walk, grid drift, and reveal slides in production.

---

## State Management

Site is mostly static. State the implementation needs:

- **Mobile nav open/closed** — boolean.
- **Boot screen seen** — sessionStorage flag.
- **Status HUD collapsed** — local component state.
- **Terminal**:
  - Output buffer (array of lines).
  - Input value (controlled).
  - Command history array + pointer.
- **Writing category filter** — active category string.
- **Contact form** — standard form state + submission status.

---

## What needs to be built / wired in production

The HTML demos these — production must wire them properly:

1. **Contact form backend**. Currently fakes submission. Recommended: **Resend** + a serverless function (`/api/contact`) that emails Jonathan + sends an autoresponder.
2. **Article CMS**. Move article bodies to MDX files in `src/content/writing/`. Each frontmatter: `title, slug, category, summary, readTime, posted`. Render via Astro Content Collections or Next MDX.
3. **Project CMS**. Same — `src/content/projects/{slug}.mdx` with `title, slug, status, year, role, stack, tags, summary` and the inline SVG schematic embedded in the MDX.
4. **OG image**. Static `og.png` at 1200×630 — render the boot screen at hero state (charcoal bg, green/cyan title, scanlines).
5. **Real favicon set** (current is inline SVG — fine, but add `apple-touch-icon` + `manifest.webmanifest` for installability).
6. **Sitemap + robots.txt** — Astro/Next plugins handle this.
7. **RSS feed** for `/writing` — Astro has a first-party integration.
8. **Analytics** — recommend **Plausible** or **Umami** (lightweight, privacy-friendly, matches the aesthetic better than GA).
9. **Smooth-scroll polyfill** isn't needed for modern browsers; current `window.scrollTo({behavior: 'smooth'})` is fine.
10. **`prefers-reduced-motion`** — gate boot sequence + sprite + grid animation behind this.
11. **Form rate-limiting / spam protection** — Cloudflare Turnstile or hCaptcha (invisible) on the contact endpoint.

---

## Content Status

All copy is **placeholder / lorem ipsum** for body sections. The structural copy (headlines, CTAs, section titles, navigation, microcopy) is final and brand-correct.

Real content needed from Jonathan:
- Bio (3 paragraphs, About section)
- 3 project case-study bodies + spec sheets
- 3 article bodies
- Real contact links (email, LinkedIn, GitHub, X)
- Confirm `shipped_q` count + uptime start date for status HUD
- Confirm Melbourne timezone handling (currently approximated as UTC+10; should use real `Intl.DateTimeFormat` with `Australia/Melbourne` to handle DST)

---

## Implementation Notes

- **No CSS framework was used** in the prototype — translate the design tokens into Tailwind config (`theme.extend.colors / fontFamily / boxShadow`) for a Tailwind target, or to CSS custom properties for vanilla.
- **Fonts** are loaded from Google Fonts CDN. In production, self-host via `@fontsource/jetbrains-mono` and `@fontsource/inter` for performance and offline-friendliness.
- **Inline SVGs** in project cards are bespoke per project; treat them as components that take `nodes[]` and `edges[]` as props if you want to systematise.
- **Accessibility**:
  - Skip link is present.
  - All interactive elements have hover + focus states.
  - **Add focus-visible outlines** explicitly in production (currently relies on browser defaults; should be customised in green to match aesthetic).
  - Boot sequence auto-skips on Esc/Enter — good. Should also auto-skip if `prefers-reduced-motion`.
  - Verify color contrast: `--ink-dim #c7c6bc` on `--bg #0b0e0c` is ~12:1 ✓; `--ink-mute #8b9286` on bg is ~6.5:1 ✓; green on dark is ~13:1 ✓.

---

## Recommended target stack

```
Astro 4
└─ @astrojs/tailwind
└─ @astrojs/mdx                 ← writing + projects content collections
└─ @astrojs/sitemap
└─ @astrojs/rss

Resend                          ← contact form email
Cloudflare Turnstile            ← spam protection
Plausible                       ← analytics

Deploy: Vercel or Cloudflare Pages
Domain: jonathanabraham.dev (placeholder used in OG meta)
```

Project structure suggestion:

```
src/
  layouts/
    Base.astro                  ← <head>, nav, footer, scanlines, sprite
  components/
    Terminal.astro              ← interactive command line
    StatusHUD.astro             ← live clock + uptime widget
    BootSequence.astro          ← first-visit-only overlay
    PixelCard.astro             ← shared card primitive with corner deco
    Schematic.astro             ← project arch SVG wrapper
  content/
    writing/*.mdx
    projects/*.mdx
  pages/
    index.astro
    writing/[...slug].astro
    projects/[...slug].astro
    404.astro
  styles/
    tokens.css                  ← CSS custom props
```
