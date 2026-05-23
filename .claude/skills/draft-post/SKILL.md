---
name: draft-post
description: Use when the user asks to scaffold, draft, start, or create a new blog post on the personal-website / jabrahamtech.com Astro site, especially when they will paste in cover/figure images. Triggers on "new post", "scaffold a post", "start a post about X", "draft a post on Y", "create a draft with images".
---

# Draft a new post + images (jabrahamtech.com)

Scaffolds a new MDX post as a **draft** and ingests the images the user pastes into the chat, placed under the per-post asset convention with correct names and dimensions. Produces a build-valid file the user can keep editing.

The project lives at `/Users/jonothanabraham/Documents/GitHub/personal-website`. Posts go in `site/src/content/posts/<slug>.mdx`. Per-post assets go in `site/public/posts/<slug>/`. The Zod schema is `site/src/content.config.ts`. Always get the date by shelling out (`date +%Y-%m-%d`); never trust a model-cutoff guess.

## Steps

1. **Verify the working directory.** Run `pwd`. If not inside the repo (or a subdirectory), stop and tell the user — don't create files in the wrong repo.

2. **Ask the essentials in one `AskUserQuestion` batch:**
   - `title` — free text. Drives the slug + H1.
   - `summary` — free text, 1–2 sentence hook. Reused as the meta description, OG/RSS description, llms.txt bullet, and JSON-LD `description`.
   - `tags` — free text, comma-separated, slug-style (`voice-ai, production`). Suggest reusing existing tags (`grep -h '^tags:' site/src/content/posts/*.mdx`).
   - `content type` — single-select from the Zod enum: **Learning Guides · Technical Builds · Case Studies · Decision/Diagnostic Guides · Playbooks**. Default to **Decision/Diagnostic Guides** (the schema default). The enum is defined in `site/src/content.config.ts` — if these ever drift, that file wins.

   Don't ask about `draft`, `posted`, `readTime`, or `cluster` — defaults/omission handle them. (`cluster` is optional; mention afterward they can add one to join a topic-cluster grouping.)

3. **Compute the slug.** Lowercase the title, replace runs of non-alphanumerics with a single hyphen, trim. **The author often hand-shortens slugs** (e.g. "Judgement before product-market fit" → `judgement-before-pmf`), so if the slugified title is long (>5 words / >40 chars), propose it and offer a shorter alternative for the user to confirm. If the user pasted their own `slug:` (common when re-pasting from an external draft), use it.
   - **If `site/src/content/posts/<slug>.mdx` already exists, this is almost certainly an update, not a new post** — the user is re-pasting an existing post. Switch to the `update-draft` flow (reconcile body + images against the existing file) rather than scaffolding. Only append `-2`/`-3` and create a fresh file if the user explicitly says they want a separate new post at a colliding title.

4. **Get today's date** via `date +%Y-%m-%d`. Use it as `posted:`.

5. **Ingest pasted images.** Create `site/public/posts/<slug>/` first (`mkdir -p`).
   - When the user pastes an image, Claude Code saves it to `~/.claude/image-cache/<uuid>/<n>.png` and surfaces the path inline in the message as `[Image: source: <abs-path>]`. **Copy from that path** — do not try to reconstruct the bytes from the rendered image (hand-drawn scans aren't reproducible).
   - **Naming convention:** the cover is `hero.png` (or `hero.jpg`); inline diagrams are `figure-01.png`, `figure-02.png`, … (zero-padded). The cover is the wide 16:9 title card; figures are everything else.
   - If more than one image is pasted, **state your proposed mapping** (which is the hero, which become figure-NN, in paste order) and confirm before placing. If only one is pasted, treat it as the hero unless the user says otherwise.
   - For each image: `cp "<source>" site/public/posts/<slug>/<name>` then `chmod 644 <dest>` (cache files are mode 600), then read dimensions: `sips -g pixelWidth -g pixelHeight "<dest>"`.
   - **The hero must be 16:9** (1200×675 or 2000×1125 are the established sizes). If `sips` reports a non-16:9 ratio, warn the user — the `.cover` CSS forces `aspect-ratio:16/9; object-fit:cover`, so it will crop on the post page. Figures have no aspect constraint.
   - If the user pastes **no** images, omit the `image:` block entirely (the post falls back to the default OG card) and skip the in-body `<Figure>`.

6. **Write the file** at `site/src/content/posts/<slug>.mdx`. Substitute `<TITLE>`, `<SUMMARY>`, `<DATE>`, the tags as a YAML list `[tag1, tag2]`, `<CONTENT_TYPE>`, the real hero `width`/`height` from `sips`, and a real `alt` describing the hero. Reference any pasted figures in the body; **never** put the hero in the body (the route auto-renders it).

~~~mdx
---
title: "<TITLE>"
summary: "<SUMMARY>"
posted: <DATE>
draft: true
pipelineStatus: "Draft"
contentTypes:
  - "<CONTENT_TYPE>"
tags: [<tag1>, <tag2>]
image:
  src: "/posts/<slug>/hero.png"
  alt: "<describe the hero — no straight double quotes>"
  width: <HERO_W>
  height: <HERO_H>
---

import Callout from '../../components/Callout.astro';
import Figure from '../../components/Figure.astro';
import CodeBlock from '../../components/CodeBlock.astro';

<Callout type="note">
  Drafting. Replace this with the hook — one or two sentences that earn the click.
</Callout>

## First section

Body text. Inline `code` works. *Italics* render cyan, **bold** warm white.

<Figure
  src="/posts/<slug>/figure-01.png"
  alt="Replace with a real alt description."
  caption="Fig. 1 — caption text."
/>

## Closing thoughts

Final paragraph.
~~~

   - Only keep the `image:` block, the `<Figure>`, and the `import` lines that are actually used. If there are no figures, drop the `<Figure>` and the `Figure` import.
   - The closing frontmatter `---` is the only `---` in the file. Do **not** end the file with a stray `---` (that's a horizontal rule).
   - `alt` must contain **no straight double quotes** — it's interpolated into `og:image:alt`.

7. **Report and stop.** Tell the user:
   - File created at `site/src/content/posts/<slug>.mdx`; assets in `site/public/posts/<slug>/` (list what landed + dimensions).
   - It's `draft: true` → noindex, excluded from RSS/llms.txt/sitemap, shown on home with a "draft" badge. Direct URL `/posts/<slug>/` still works for preview.
   - `readTime` is auto-computed (230 wpm) — don't set it.
   - Optional: add a `cluster:` line to group it in a topic cluster.
   - To preview: `export PATH="/opt/homebrew/opt/node@22/bin:$PATH"; cd site && npm run dev`, open `http://localhost:4321/posts/<slug>/`.
   - When ready, run `publish-post` to optimise + ship it; use `update-draft` to paste a revised body or swap images.

## Don't

- Don't run `npm run build` or Playwright — it's a draft the user is about to edit. (The schema only validates on build; if you want to be sure the frontmatter is valid, that's the user's call at publish time.)
- Don't auto-commit. The user drafts first.
- Don't put the hero/cover image in the body — it double-renders.
- Don't use an H1 (`#`) in the body — H1 is the title, rendered by `DocLayout`. Start at `##`.
- Don't invent `image.width/height` — read them from the real file with `sips`. They're required by the schema when `image` is present.
- Don't add an `updated`/`dateModified` field — the schema rejects it.

## Component cheat sheet

- `<Callout type="note|warn|tip|info">body</Callout>` — terminal `[!] LABEL` boxes (`warn` carries `role="alert"`).
- `<Figure src alt caption [width] [height] />` — bordered image + mono caption, for inline diagrams.
- `<CodeBlock filename="..." lang="...">` then a fenced block then `</CodeBlock>` — code block with a traffic-light filename header.
