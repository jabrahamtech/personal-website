# redirect-site

Tiny static bundle that 301s every request from `jonathanabraham.dev` (the
old canonical) to `https://jabrahamtech.com/<same-path>` (the new one).

## Why this exists

Domain migration loses every backlink and ranking signal earned by the old
domain unless every URL on the old domain redirects (preferably with HTTP
301) to the corresponding URL on the new domain. Google + Bing transfer
authority across 301s, but they need the redirect to actually exist.

This bundle is the code-level fallback if you don't want to handle the
redirect at Cloudflare or another DNS-layer service.

## Deployment options (pick one)

### Option A — Cloudflare Pages (recommended; gives real HTTP 301)

1. New project → Pages → connect this repo → set the build directory to
   `redirect-site/` and leave the build command empty.
2. Add `jonathanabraham.dev` as a custom domain on the Pages project.
3. Cloudflare Pages reads the `_redirects` file natively and emits real
   HTTP 301 responses for every path. Done.

### Option B — Netlify (also gives real HTTP 301)

1. Drag-and-drop `redirect-site/` to Netlify → site is live.
2. Add `jonathanabraham.dev` as a custom domain.
3. Netlify reads `_redirects` natively. Done.

### Option C — Railway (meta-refresh fallback, not as strong)

If you'd rather keep everything on Railway:

1. Create a new Railway service named `personal-website-redirect`.
2. Point its build directory at `redirect-site/`.
3. Use the same `serve` package the main site uses:
   ```
   npm i serve && serve -s redirect-site -l ${PORT:-4321}
   ```
4. Bind `jonathanabraham.dev` to that service.

The `index.html` file in this directory uses `<meta http-equiv="refresh">`
plus an inline JS `location.replace` to redirect. Google + Bing both
honour this as a 301-equivalent provided the canonical link agrees with
the redirect target, which it does. Slightly weaker SEO signal than a real
HTTP 301, but functional, and identical from the user's perspective.

### Option D — Cloudflare bulk redirect (zero hosting; pure DNS)

If `jonathanabraham.dev` is on Cloudflare DNS, you don't need this bundle
at all. Use:

  Cloudflare → Rules → Redirect Rules → Create rule
  When: hostname equals jonathanabraham.dev
  Then: Dynamic redirect → 301 →
        concat("https://jabrahamtech.com", http.request.uri.path)
  Preserve query string: yes

This is the simplest + cheapest + strongest option and you can delete this
bundle entirely if you go that route.

## Verifying the redirect after deploy

```bash
# Should return 301 with Location: https://jabrahamtech.com/
curl -I https://jonathanabraham.dev/

# Path preservation — should return 301 with
# Location: https://jabrahamtech.com/posts/voice-ai-after-demo
curl -I https://jonathanabraham.dev/posts/voice-ai-after-demo
```

If the Location header is correct and the status is 301 (or 302 for the
meta-refresh path), the redirect is working. After verifying, register
the change in Google Search Console:

  GSC (old property: jonathanabraham.dev) → Settings → Change of Address
  → select new property → run wizard.

That's the single most important SEO step in a domain move; it tells
Google to migrate ranking signals over the next 2-4 weeks.
