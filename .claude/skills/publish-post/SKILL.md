---
name: publish-post
description: Use when the user asks to publish, ship, or take a specific draft post live on the personal-website / jabrahamtech.com Astro site — and to optimise it for SEO/AEO (RSS, llms.txt, sitemap, OG card, JSON-LD) on the way out. Triggers on "publish the draft", "publish <slug>", "ship this post", "take X live", "go live with Y".
---

# Publish a draft (jabrahamtech.com)

Takes one specified draft, runs the SEO/AEO optimisation + quality pass, flips it to published, rebuilds, and **proves** the post propagated into every generated public surface.

## The one mental model that matters

There is **nothing to hand-edit in RSS, the sitemap, or the generated *Posts* list in llms.txt.** Every public *post* index is generated at build time from the content collection, filtering `!draft && posted`:

| Surface | Source | Gate |
|---|---|---|
| `/rss.xml` | `src/pages/rss.xml.ts` | `!draft && posted` |
| `/llms.txt` | `src/pages/llms.txt.ts` | `!draft && posted` |
| `/llms-full.txt` (full body) | `src/pages/llms-full.txt.ts` | `!draft && posted` |
| `/sitemap-index.xml` (+ `sitemap-0.xml`) | `@astrojs/sitemap` + `astro.config.mjs` draft filter | excludes `draft: true` slugs |
| OG card + `BlogPosting` JSON-LD + `robots` | `src/layouts/Base.astro` via `posts/[slug].astro` | `noindex` while `draft`; `BlogPosting` only when `posted` set |
| IndexNow ping | `scripts/notify-indexnow.mjs` (postbuild) | only when `INDEXNOW_ENABLED=1` (Railway only) |

> **llms.txt is only partly generated.** Just its `## Posts` section comes from the collection (gated `!draft && posted`). The `## Identity` (About **and the `/services` page**), `## Capabilities`, `## Interactive`, and `## Elsewhere` sections are hand-written prose in `llms.txt.ts` — publishing a post never touches them, so don't assume the whole file regenerates (and don't "tidy away" those static pointers).

So **publishing = make the post correct → flip frontmatter → `npm run build` (regenerates all of the above) → verify it landed in each one.** The skill's real job is the optimisation pass and the propagation proof, not editing feeds by hand.

Two flips do the heavy lifting:
- `draft: true → false` removes `<meta name="robots" ... noindex>` (drafts are noindex'd) and adds the post to RSS / llms.txt / llms-full.txt / sitemap.
- A present `posted` date is what emits the `BlogPosting` JSON-LD (Google requires `datePublished`) and lets the post appear in RSS / llms.txt at all.

The project lives at `/Users/jonothanabraham/Documents/GitHub/personal-website`. Posts are `site/src/content/posts/<slug>.mdx`. Per-post assets live at `site/public/posts/<slug>/`.

**Node 22 is required** (Astro 6). Prefix every npm/astro command with:
```
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
```

## Steps

1. **Verify the working directory.** Run `pwd`. If not inside the repo, stop and tell the user.

2. **Identify the target draft.** List candidates and match the user's argument (slug, title, or partial) against them:
   ```bash
   cd site && grep -lE '^draft:\s*true' src/content/posts/*.mdx
   ```
   - If the user named one and it matches exactly → use it.
   - If ambiguous or unspecified → list the drafts (slug + title) and confirm via `AskUserQuestion` before touching anything.
   Then Read the chosen `.mdx` file in full.

3. **Run the SEO/AEO + quality pre-flight.** Inspect frontmatter and body; collect every issue into one list before changing anything. The schema is at `site/src/content.config.ts`.

   **Frontmatter**
   - `posted` — present and `YYYY-MM-DD`. **If missing, get today's date via `date +%Y-%m-%d` and propose it**, explaining it's the RSS/llms sort key and the JSON-LD `datePublished`; without it the post is silently dropped from RSS, llms.txt, and the sitemap and gets no `BlogPosting` schema. Backdating is fine if the user wants a specific date — ask.
   - `title` — present.
   - `summary` — present, 1–2 sentences. This single string is reused as the meta description, `og:description`, the RSS `<description>`, the llms.txt bullet, and the JSON-LD `description`. Aim ~70–160 chars; flag if it's a stub, truncated, or >300 chars.
   - `tags` — lowercase-hyphen slugs (e.g. `voice-ai`). They become RSS `<category>` entries and JSON-LD `keywords`. Suggest reusing existing tags — `grep -h '^tags:' src/content/posts/*.mdx | tr ',' '\n'` to see what's in use — rather than minting near-duplicates.
   - `contentTypes` — one or more of the Zod enum (**Learning Guides · Technical Builds · Case Studies · Decision/Diagnostic Guides · Playbooks**). `cluster` — set to a real topic cluster (see other posts). Both feed RSS categories + JSON-LD `keywords`/`articleSection`. (If the build rejects a value, re-check `site/src/content.config.ts` — the enum is the source of truth.)
   - `image` (the cover **and** OG card — strongly expected for a published post):
     - `src` resolves to a real file: check `test -f "public<src>"`.
     - Format is **PNG or JPG, not SVG** — Facebook/LinkedIn/iMessage scrapers don't render SVG cards. If `src` ends `.svg`, flag it and offer `npm run render:og <in.svg> public/posts/<slug>/hero.png 1200 675`.
     - `width`/`height` present **and matching the real file** — read with `sips -g pixelWidth -g pixelHeight "public<src>"` and compare. The schema requires them; lying about them breaks `og:image:width/height`.
     - Aspect ratio is **16:9** (1200×675 is the convention; 2000×1125 is also fine). The `.cover` CSS forces `aspect-ratio:16/9; object-fit:cover`, so anything else visibly crops on the post page.
     - `alt` present, descriptive, and **free of straight double quotes** — `alt` is interpolated into `og:image:alt`, and a `"` breaks that meta tag.

   **Body**
   - No `#` H1 — H1 is reserved for the title (rendered by `DocLayout`). Headings start at `##`.
   - The cover image is **not** repeated in the body — `posts/[slug].astro` auto-renders `image.src` into the `hero` slot, so an in-body copy double-renders it.
   - Every `<Figure src="...">` path resolves on disk (`test -f public<src>`).

4. **Show the diagnosis, then apply.** Present the issue list. Mechanical, unambiguous flips can be applied directly; content rewrites (summary, alt, date choice) confirm with the user first. The publish flips, via `Edit`:
   - `draft: true` → `draft: false`
   - `pipelineStatus:` → `"Published"`
   - ensure `posted:` is set
   - any agreed SEO fixes
   Remind the user this is what removes the `noindex` and switches on the `BlogPosting` JSON-LD.

5. **Build — this regenerates every surface and validates the schema.**
   ```bash
   export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
   cd site && npm run build
   ```
   `npm run build` syncs content, validates frontmatter against Zod, compiles MDX, and emits `dist/`. If it fails, report the error verbatim and stop — do not proceed to verification.
   The `postbuild` IndexNow ping logs `skipped (INDEXNOW_ENABLED != 1)` locally — that's expected; the real ping fires on the Railway deploy.

6. **Prove propagation** against `site/dist/` (the post is published only if it shows up everywhere it should):
   ```bash
   cd site
   SLUG=<slug>
   test -f "dist/posts/$SLUG/index.html"      && echo "page: ok"
   grep -q "/posts/$SLUG/" dist/rss.xml         && echo "rss: ok"
   grep -q "/posts/$SLUG/" dist/llms.txt        && echo "llms.txt: ok"
   grep -q "/posts/$SLUG/" dist/llms-full.txt   && echo "llms-full: ok"
   grep -q "/posts/$SLUG/" dist/sitemap-0.xml   && echo "sitemap: ok"
   ```
   Then spot-check the built page head (`dist/posts/<slug>/index.html`):
   - `<link rel="canonical" href="https://jabrahamtech.com/posts/<slug>/">` present.
   - `og:image` is an **absolute** `https://jabrahamtech.com/...` URL pointing at the cover.
   - meta `description` equals the summary.
   - an `application/ld+json` block contains `"@type":"BlogPosting"` with `datePublished`.
   - **no** `noindex` (grep should find none).
   Report results as a checklist; any miss means the frontmatter gate (`draft`/`posted`) wasn't satisfied — go back to step 4.

7. **Report and hand off.** Summarise: what changed in frontmatter, build status, the propagation checklist, and that the post goes live + gets its IndexNow ping when the commit is pushed and Railway redeploys. **Do not auto-commit or push** — offer to (`git add` the post + assets, commit, push), and let the user decide.

## Don't

- Don't hand-edit the **post lists** in `rss.xml.ts`, `llms.txt.ts`, `llms-full.txt.ts`, or the sitemap — they regenerate from the collection. If a post isn't appearing, the cause is always `draft`/`posted`, not the feed code. (The non-post sections of `llms.txt.ts` — Identity/Services/Capabilities/etc. — *are* hand-maintained, but that's page positioning, unrelated to publishing a post.)
- Don't add an `updated` / `dateModified` frontmatter field — the schema doesn't support it and `dateModified` deliberately mirrors `posted`.
- Don't set `readTime` — it's auto-computed at 230 wpm from the body.
- Don't skip the build's error output — schema and MDX failures surface there and nowhere else.
- Don't commit or push unless the user asks.
