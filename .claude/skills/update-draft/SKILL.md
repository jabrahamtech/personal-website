---
name: update-draft
description: Use when the user wants to revise an existing post on the personal-website / jabrahamtech.com Astro site by pasting a new version of the body and/or a batch of images where some replace existing assets and some are new. Triggers on "update the draft", "here's a new version of X", "swap these images", "revise <slug> with this".
---

# Update an existing draft (jabrahamtech.com)

Replaces the body of an existing post with a pasted revision and reconciles a batch of pasted images — overwriting the assets that changed, adding the new ones — while keeping frontmatter intact and the file build-valid.

The project lives at `/Users/jonothanabraham/Documents/GitHub/personal-website`. Posts are `site/src/content/posts/<slug>.mdx`; assets are `site/public/posts/<slug>/`. Schema: `site/src/content.config.ts`.

**Node 22 is required** for any build/validate step:
```
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
```

## Steps

1. **Verify the working directory** (`pwd`). Stop if not in the repo.

2. **Identify the target.** Match the user's argument (slug/title/partial) against the posts. Prefer drafts (`grep -lE '^draft:\s*true' site/src/content/posts/*.mdx`), but this skill works on any post. If the target is **published** (`draft: false`), warn that edits go live on the next deploy, then proceed only on confirmation. If ambiguous, list candidates and confirm via `AskUserQuestion`. Read the chosen `.mdx` in full and `ls -la site/public/posts/<slug>/` to inventory current assets.

3. **Take the new body.** The user pastes the revised content as **text** in the chat (not an image). Decide what they gave you:
   - **Body only** (markdown/MDX, no frontmatter) → keep the existing frontmatter verbatim; replace everything after the closing `---`.
   - **Full file** (includes its own `---` frontmatter) → **do not blindly clobber frontmatter.** Diff it against the existing block and surface any changes to `title`/`summary`/`tags`/`posted`/`image`; apply only the ones the user intends. Never silently drop `pipelineStatus`, `image.width/height`, `contentTypes`, or `posted`.
   - **Foreign-schema frontmatter** (pasted from an external CMS/pipeline often uses different keys) → map onto this project's schema, don't copy verbatim: `description`→`summary`, `date`→`posted`, `type`→`contentTypes` **only if it's a valid Zod enum value** (else keep the existing one and flag), `slug` is the filename (ignore). Drop non-schema keys (`status`, etc.). Reject anything that would break the build: an `image.src` whose file doesn't exist (e.g. a `.svg` with no file — keep the real one), double quotes inside `alt` (keep the quote-safe existing alt), or missing required `image.width/height` (preserve existing).
   - Preserve `draft: true` unless the user explicitly asks to publish (that's `publish-post`'s job).

4. **Fix imports.** The body must import every component it uses. After swapping, ensure the top of the body has the right `import` lines (and only those used):
   - `Callout` → `import Callout from '../../components/Callout.astro';`
   - `Figure` → `import Figure from '../../components/Figure.astro';`
   - `CodeBlock` → `import CodeBlock from '../../components/CodeBlock.astro';`
   If the pasted body already includes imports, keep them; if it's bare markdown, add the imports for any `<Component>` it references.

5. **Reconcile pasted images.** Each pasted image is saved by Claude Code to `~/.claude/image-cache/<uuid>/<n>.png` and its path is surfaced inline as `[Image: source: <abs-path>]`. Copy from those paths.
   - **Build an explicit mapping table** for each pasted image: **replace** an existing file (which name?) or **add** a new one. State the mapping in your report. Only stop to *confirm* it first when the mapping is genuinely ambiguous (multiple images and it's unclear which replaces what). When it's unambiguous — e.g. a single pasted hero-shaped 16:9 card on a post that already has a `hero` — just apply it and report what you did; don't ask. Example table:

     | pasted | → destination | action |
     |---|---|---|
     | image 1 | `hero.png` | replace |
     | image 2 | `figure-02.png` | new |
     | image 3 | `figure-01.png` | replace |

     If which-is-which is unclear, ask the user to label each pasted image. New figures take the next free `figure-NN` (zero-padded), in paste order.
   - For each: `cp "<source>" site/public/posts/<slug>/<name>` → `chmod 644 <dest>` (cache files are mode 600) → `sips -g pixelWidth -g pixelHeight "<dest>"`.
   - **If the hero was replaced**, re-read its dimensions and update `image.width`/`image.height` in the frontmatter to match (and the `alt`, if the composition changed). The hero must stay **16:9** (1200×675 or 2000×1125) or `.cover` will crop — warn if not.
   - Don't delete assets that the new body no longer references unless the user asks; just report them as now-unreferenced.

6. **Sync body ↔ assets.** Make sure every `<Figure src="/posts/<slug>/figure-NN.png">` in the new body points at a file that now exists, and that new figures are actually referenced somewhere in the body. Never reference the hero in the body — the route auto-renders it. Flag any mismatch.

7. **Validate (recommended).** A body swap is the most likely place to introduce an MDX error (see the MDX gotchas in `CLAUDE.md` — e.g. JSX comments after list items, straight quotes in `alt`). Run a build to confirm it still compiles:
   ```
   export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
   cd site && npm run build
   ```
   This **does not publish anything** — while `draft: true` the post stays out of RSS/llms.txt/sitemap and noindex'd. If the build fails, report the error verbatim and fix before finishing. (If the user prefers, skip the build and let `publish-post` catch it later.)

8. **Report and stop.** Summarise: body replaced (rough before/after word count), the image mapping that was applied (with dimensions), any frontmatter fields changed, any now-unreferenced assets, and build/validate status. **Don't auto-commit.** Point them at `publish-post` when they're ready to ship.

## Don't

- Don't clobber frontmatter you weren't asked to change — preserve `pipelineStatus`, `posted`, `contentTypes`, `cluster`, `image.width/height`.
- Don't flip `draft` here — publishing is `publish-post`'s job.
- Don't overwrite an existing asset without confirming the mapping first.
- Don't put the hero in the body, and don't use an H1 (`#`) — start at `##`.
- Don't invent image dimensions — read them from the real file with `sips`.
- Don't auto-commit or push.
