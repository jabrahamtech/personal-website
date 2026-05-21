import { test, expect } from '@playwright/test';

/* Every post in home-page render order. comparePosts (index.astro) sorts
   all live posts ahead of drafts, then by `posted` desc, ties broken by
   title. Drafts are built + listed on the home page, but excluded from
   RSS, the sitemap, llms.txt, and the homepage Blog JSON-LD. */
const liveSlugs = [
  'polymarket-bot-event-driven',
  'most-hitl-is-escalation-done-badly',
  'when-to-force-the-llm-and-when-to-use-a-button',
];
const draftSlugs = [
  'rpa-already-solved-this',
  'agent-governance-au-insurtech',
  'boring-infrastructure-stack-for-startups',
  'from-mvc-to-vertical-slice',
  'judgement-before-pmf',
];
const allPostSlugs = [...liveSlugs, ...draftSlugs];

/* examplePost is the shared fixture for the rich-content tests (TOC,
   callouts, figures, JSON-LD). when-to-force has multiple h2 headings,
   a callout-tip, three figures, and a stable URL — the best fit. */
const examplePost = '/posts/when-to-force-the-llm-and-when-to-use-a-button';

test.describe('home (posts list)', () => {
  test('renders only the ./posts prompt and the post list', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/^Jonathan Abraham/);
    await expect(page.locator('.page-head .prompt')).toHaveText('./posts');

    // The prompt now IS the h1 — exactly one h1 in page-head, with the path text
    await expect(page.locator('.page-head h1')).toHaveCount(1);
    await expect(page.locator('.page-head h1')).toHaveText('./posts');
    await expect(page.locator('.page-head .tagline')).toHaveCount(0);
    await expect(page.locator('.links-row')).toHaveCount(0);

    const rows = page.locator('.post-list .post-row');
    await expect(rows).toHaveCount(allPostSlugs.length);
    const hrefs = await rows.evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).getAttribute('href')));
    expect(hrefs).toEqual(allPostSlugs.map((slug) => `/posts/${slug}`));

    await expect(page.locator('.post-list .draft')).toHaveCount(draftSlugs.length);
    await expect(rows.first()).toContainText('What Polymarket taught me about event-driven');
    await expect(page.locator('main')).not.toContainText('Building this site with Astro');
  });

  test('filters narrow by content type and surface a status line', async ({ page }) => {
    await page.goto('/');

    /* Posts now span three clusters, so the cluster select is shown
       alongside type + sort (clusterFilters.length > 1 in index.astro). */
    await expect(page.locator('#post-filters .filter-select')).toHaveCount(3);
    await expect(page.locator('#post-filters .chip')).toHaveCount(0);
    /* Content-type counts across the collection. Case Studies has zero
       posts, so it is filtered out of the dropdown. */
    await expect(page.locator('#filter-type option')).toHaveText([
      'all types (8)',
      'Learning Guides (1)',
      'Technical Builds (1)',
      'Decision/Diagnostic Guides (4)',
      'Playbooks (2)',
    ]);

    // Technical Builds has exactly one post (polymarket) — a clean
    // single-result filter to assert against.
    await page.locator('#filter-type').selectOption({ label: 'Technical Builds (1)' });
    await expect(page.locator('.post-list li:not([hidden]) .post-row')).toHaveCount(1);
    await expect(page.locator('.post-list li:not([hidden]) h2')).toHaveText(
      'What Polymarket taught me about event-driven',
    );
    // Status line appears whenever a non-all filter is active.
    await expect(page.locator('#post-status')).toBeVisible();
    await expect(page.locator('#post-status')).toContainText('Technical Builds');
    await expect(page.locator('#post-status')).toContainText('1 of 8');

    await page.locator('#filter-type').selectOption('all');
    await expect(page.locator('.post-list li:not([hidden]) .post-row')).toHaveCount(allPostSlugs.length);
    // Status line is hidden when no filter is active.
    await expect(page.locator('#post-status')).toBeHidden();
  });

  test('sorts newest first by default and can switch to oldest first', async ({ page }) => {
    await page.goto('/');

    // Assert order by slug (stable) rather than by title (brittle).
    const rowHrefs = () =>
      page.locator('.post-list li:not([hidden]) .post-row').evaluateAll(
        (els) => els.map((e) => (e as HTMLAnchorElement).getAttribute('href')),
      );

    await expect(page.locator('#filter-order')).toHaveValue('desc');
    expect(await rowHrefs()).toEqual(allPostSlugs.map((slug) => `/posts/${slug}`));

    // Oldest-first reverses each group but keeps drafts after live posts.
    const ascSlugs = [...[...liveSlugs].reverse(), ...[...draftSlugs].reverse()];
    await page.locator('#filter-order').selectOption('asc');
    await expect.poll(rowHrefs).toEqual(ascSlugs.map((slug) => `/posts/${slug}`));
  });

  test('post cards render type tag and keep meta uncluttered', async ({ page }) => {
    await page.goto('/');
    const first = page.locator('.post-list .post-row').first();
    // DOM order: h2 → p (summary) → .meta
    const order = await first.evaluate((row) => {
      const kids = Array.from(row.children).map((c) => c.tagName.toLowerCase() + (c.className ? '.' + c.className : ''));
      return kids;
    });
    expect(order[0]).toMatch(/^h2/);
    expect(order[1]).toMatch(/^p/);
    expect(order[2]).toMatch(/^div\.meta/);

    const meta = first.locator('.meta');
    // The newest post (polymarket) is live in the "Agents and Workflows"
    // cluster with a single content-type tag (Technical Builds). No draft badge.
    await expect(meta).not.toContainText('draft');
    await expect(meta).toContainText('Agents and Workflows');
    await expect(meta.locator('.tag-cat')).toHaveText(['Technical Builds']);

    const visibleListText = (await page.locator('.post-list').textContent()) || '';
    for (const noisy of [
      'Prioritised',
      'unpublished',
      'words',
      '~ ',
      'adaptive-ai',
      'personalisation',
    ]) {
      expect(visibleListText).not.toContain(noisy);
    }
  });

  test('the old "Notes / Working notes…" intro is gone', async ({ page }) => {
    await page.goto('/');
    // Check visible text only — JSON-LD/meta may legitimately use these phrases.
    const visible = (await page.locator('main').textContent()) || '';
    expect(visible).not.toContain('Working notes on production AI');
    expect(await page.locator('main .intro').count()).toBe(0);
    // The page-head h1 IS the prompt now (path-as-heading)
    await expect(page.locator('.page-head h1.prompt')).toHaveCount(1);
  });

  test('no pitch-surface artifacts remain on home', async ({ page }) => {
    await page.goto('/');
    const html = await page.content();
    for (const needle of [
      'status-hud', 'sprite',
      'Production Readiness Sprint', 'Operating system',
      'Founder-engineer building',
    ]) {
      expect(html, `unexpected leftover: ${needle}`).not.toContain(needle);
    }
  });

  test('nav has posts, terminal, about (no rss link)', async ({ page }) => {
    await page.goto('/');
    const linkTexts = await page.locator('nav.top .nav-links a').allTextContents();
    expect(linkTexts).toEqual(['posts', 'terminal', 'about']);
  });

  test('footer surfaces email, github, linkedin', async ({ page }) => {
    await page.goto('/');
    const foot = page.locator('footer .links');
    await expect(foot.locator('a[href^="mailto:"]')).toHaveText('email');
    await expect(foot.locator('a[href*="github.com/jabrahamtech"]')).toHaveText('github');
    await expect(foot.locator('a[href*="linkedin.com/in/jabrahamtech"]')).toHaveText('linkedin');
  });
});

test.describe('about page', () => {
  test('renders bio + stack + elsewhere', async ({ page }) => {
    await page.goto('/about');
    await expect(page).toHaveTitle(/About — Jonathan Abraham/);
    await expect(page.locator('.page-head h1')).toHaveText('./about');
    await expect(page.locator('.prose')).toContainText('Brokerloop');
    // Author softened "New work is by referral" → "is usually by referral" —
    // match the current bio copy.
    await expect(page.locator('.prose')).toContainText('usually by referral');
    await expect(page.locator('.prose a[href^="mailto:jabrahamtech@gmail.com"]').first()).toBeVisible();
    /* The paper bio-head and the elsewhere-list both link GitHub; .first()
       avoids the strict-mode duplicate violation while still proving the
       page exposes at least one GitHub link. */
    await expect(page.locator('.prose a[href*="github.com/jabrahamtech"]').first()).toBeVisible();
  });

  test('about link is marked current', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('nav.top .nav-links a[aria-current="page"]')).toHaveText('about');
  });

  test('about renders the avatar and the avatar file is served', async ({ page }) => {
    await page.goto('/about');
    const img = page.locator('figure.avatar img');
    await expect(img).toBeVisible();
    const src = await img.getAttribute('src');
    expect(src).toBeTruthy();
    const r = await page.request.get(src!);
    expect(r.status()).toBe(200);
  });
});

test.describe('post pages', () => {
  /* Per-post smoke test: h1 + prompt-path render. Iterates the full
     collection so adding/removing a post automatically expands or
     contracts the suite. */
  for (const slug of allPostSlugs) {
    test(`/posts/${slug} renders the post shell with h1 + prompt path`, async ({ page }) => {
      const response = await page.goto(`/posts/${slug}`);
      expect(response?.status()).toBe(200);
      await expect(page.locator('.doc h1')).toBeVisible();
      // Crumbs were removed in favour of the prompt-style path.
      await expect(page.locator('.doc .crumbs')).toHaveCount(0);
      await expect(page.locator('.doc .post-prompt')).toContainText(slug);
    });
  }

  test('prev/next links land on neighbouring posts', async ({ page }) => {
    await page.goto(`/posts/${allPostSlugs[0]}`);
    const pn = page.locator('.pn a[href^="/posts/"]');
    await expect(pn.first()).toBeVisible();
    const hrefs = await pn.evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).getAttribute('href')));
    for (const href of hrefs) expect(href).toMatch(/^\/posts\//);
  });

  test('every live post emits a BlogPosting JSON-LD with a valid datePublished', async ({ page }) => {
    for (const slug of liveSlugs) {
      await page.goto(`/posts/${slug}`);
      const blocks = await page.$$eval('script[type="application/ld+json"]', (els) =>
        els.map((e) => JSON.parse(e.textContent || 'null')),
      );
      const post = blocks.find((b) => b && b['@type'] === 'BlogPosting');
      expect(post, `${slug} must emit a BlogPosting`).toBeTruthy();
      expect(post.datePublished, `${slug} datePublished must be a real ISO date, never undefined`).toMatch(
        /^\d{4}-\d{2}-\d{2}/,
      );
    }
  });
});

test.describe('mode-state controller', () => {
  test('theme toggle flips aria-pressed, aria-label, and title with state', async ({ page }) => {
    // Start fresh in paper mode.
    await page.addInitScript(() => localStorage.setItem('ja_mode', 'paper'));
    await page.goto('/');
    const toggle = page.locator('#theme-toggle');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(toggle).toHaveAttribute('aria-label', /engineer/i);
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(toggle).toHaveAttribute('aria-label', /paper/i);
    await expect(toggle).toHaveAttribute('title', /paper/i);
  });

  test('theme-color meta tracks the current mode', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('ja_mode', 'paper'));
    await page.goto('/');
    const meta = page.locator('meta[name="theme-color"]');
    // Paper bg colour.
    await expect(meta).toHaveAttribute('content', '#f4ede0');
    await page.locator('#theme-toggle').click();
    // Engineer bg colour.
    await expect(meta).toHaveAttribute('content', '#0b0e0c');
  });

  test('nav-sheet ESC close keeps the kebab aria-expanded in sync', async ({ page }) => {
    // The kebab is only visible at narrow widths.
    await page.setViewportSize({ width: 400, height: 800 });
    await page.goto('/');
    const kebab = page.locator('#nav-kebab');
    await kebab.click();
    await expect(kebab).toHaveAttribute('aria-expanded', 'true');
    // Native <dialog> ESC handler fires close on the dialog without
    // calling our shut() — the wired-in `close` event listener bridges it.
    await page.keyboard.press('Escape');
    await expect(kebab).toHaveAttribute('aria-expanded', 'false');
  });
});

test.describe('rss enclosure', () => {
  test('enclosure MIME type matches the file extension on the cover image', async ({ page }) => {
    const r = await page.request.get('/rss.xml');
    const body = await r.text();
    // The live post ships a .jpg cover. Previous behaviour hardcoded
    // type="image/png" regardless of file extension — that's the bug
    // this test guards against.
    const jpgEnclosureRe = /<enclosure\b[^>]*url="[^"]*\.jpg[^"]*"[^>]*type="image\/jpeg"/;
    const jpgAsPngRe = /<enclosure\b[^>]*url="[^"]*\.jpg[^"]*"[^>]*type="image\/png"/;
    expect(jpgAsPngRe.test(body), 'feed must not advertise a JPG cover as image/png').toBe(false);
    expect(jpgEnclosureRe.test(body), 'live post enclosure should declare image/jpeg').toBe(true);
  });
});

test.describe('infrastructure', () => {
  test('rss.xml is served as RSS 2.0 with the right meta', async ({ page }) => {
    const r = await page.request.get('/rss.xml');
    expect(r.status()).toBe(200);
    const ct = r.headers()['content-type'] || '';
    expect(ct).toMatch(/xml/);
    const body = await r.text();
    // Channel-level requirements per RSS 2.0 + RSS Best Practices.
    expect(body).toContain('<rss version="2.0"');
    expect(body).toContain('<title>Jonathan Abraham — posts</title>');
    expect(body).toContain('<atom:link');
    expect(body).toContain('rel="self"');
    expect(body).toContain('<language>en-au</language>');
    // Stylesheet so humans hitting the URL get a styled page, not raw XML.
    expect(body).toContain('xml-stylesheet');
  });

  test('every page advertises the RSS feed via <link rel=alternate>', async ({ page }) => {
    for (const path of ['/', '/about', '/terminal', examplePost]) {
      await page.goto(path);
      const link = page.locator('head link[rel="alternate"][type="application/rss+xml"]');
      await expect(link, `missing rss <link> on ${path}`).toHaveCount(1);
      await expect(link).toHaveAttribute('href', '/rss.xml');
    }
  });

  test('footer surfaces an rss link', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('footer .links a[href="/rss.xml"]')).toHaveText('rss');
  });

  test('sitemap-index.xml + sitemap-0.xml include posts and about', async ({ page }) => {
    const idx = await page.request.get('/sitemap-index.xml');
    expect(idx.status()).toBe(200);
    expect(await idx.text()).toContain('sitemap-0.xml');

    const r = await page.request.get('/sitemap-0.xml');
    expect(r.status()).toBe(200);
    const body = await r.text();
    // Live posts are in the sitemap; drafts are excluded.
    for (const slug of liveSlugs) {
      expect(body, `${slug} missing from sitemap`).toContain(`/posts/${slug}`);
    }
    for (const slug of draftSlugs) {
      expect(body, `draft ${slug} must NOT be in the sitemap`).not.toContain(`/posts/${slug}`);
    }
    expect(body).toContain('/about');
    // Old route shape must not be present
    expect(body).not.toContain('/projects/');
    expect(body).not.toContain('/writing/');
  });

  test('robots.txt is served', async ({ page }) => {
    const r = await page.request.get('/robots.txt');
    expect(r.status()).toBe(200);
    expect(await r.text()).toContain('Sitemap:');
  });

  test('404 page renders kernel-panic shell', async ({ page }) => {
    const response = await page.goto('/this-route-does-not-exist');
    expect(response?.status()).toBe(404);
    await expect(page.locator('.panic')).toContainText('404');
    await expect(page.locator('.panic')).toContainText(/SIGNAL_NOT_FOUND|This page doesn't exist/);
  });

  test('old project routes 404', async ({ page }) => {
    const r = await page.goto('/projects/voice-ai-intake');
    expect(r?.status()).toBe(404);
  });

  test('old writing routes 404', async ({ page }) => {
    const r = await page.goto('/writing/voice-ai-after-demo');
    expect(r?.status()).toBe(404);
  });
});

test.describe('boot sequence', () => {
  test('renders for fresh sessions and is removed after boot_seen flag is set', async ({ page, context }) => {
    // Fresh session: boot wrapper should be in the DOM (it removes itself once done)
    await context.clearCookies();
    await page.addInitScript(() => localStorage.setItem('ja_mode', 'eng'));
    await page.goto('/');
    // Either still mounted, or already removed (very fast machines) — but the script must have set the flag.
    const seen = await page.evaluate(() => sessionStorage.getItem('boot_seen'));
    // Wait briefly for the sequence to finish; total ≈ 1.6s
    await page.waitForFunction(() => sessionStorage.getItem('boot_seen') === '1', null, { timeout: 5000 });
    expect(seen === '1' || seen === null).toBe(true);

    // Subsequent reload with the flag set should NOT mount the boot overlay
    await page.reload();
    await expect(page.locator('#boot')).toHaveCount(0);
  });
});

test.describe('terminal page', () => {
  test('renders the terminal widget and HUD defaults', async ({ page }) => {
    const r = await page.goto('/terminal');
    expect(r?.status()).toBe(200);
    await expect(page).toHaveTitle(/^operator\.training/);
    await expect(page.locator('.page-head h1')).toHaveText('> ./operator.training');
    await expect(page.locator('.term .term-bar')).toBeVisible();
    await expect(page.locator('#term-input')).toBeVisible();
    await expect(page.locator('#hud-stage')).toHaveText('0/5');
    await expect(page.locator('#hud-score')).toHaveText('0');
  });

  test('terminal link is marked current on /terminal', async ({ page }) => {
    await page.goto('/terminal');
    await expect(page.locator('nav.top .nav-links a[aria-current="page"]')).toHaveText('terminal');
  });

  test('typing `help` produces output', async ({ page }) => {
    await page.goto('/terminal');
    const input = page.locator('#term-input');
    await input.click();
    await input.fill('help');
    await input.press('Enter');
    // Some line in #term-output should reference 'help' or list commands
    await expect(page.locator('#term-output .term-line')).not.toHaveCount(0);
  });

  test('typing `start` shows the scenario menu (no auto-advance)', async ({ page }) => {
    await page.goto('/terminal');
    const input = page.locator('#term-input');
    await input.click();
    await input.fill('start');
    await input.press('Enter');
    // Menu surfaces both scenarios; HUD stays at 0/5 until a scenario is picked
    await expect(page.locator('#term-output')).toContainText('voice');
    await expect(page.locator('#term-output')).toContainText('trading');
    await expect(page.locator('#hud-stage')).toHaveText('0/5');
  });

  test('`start trading` jumps into the trading scenario and sets HUD scenario label', async ({ page }) => {
    await page.goto('/terminal');
    const input = page.locator('#term-input');
    await input.click();
    await input.fill('start trading');
    await input.press('Enter');
    await expect(page.locator('#hud-scenario')).toHaveText('trading');
    await expect(page.locator('#hud-stage')).toHaveText('1/5');
    await expect(page.locator('#term-output')).toContainText('STAGE 1 / TRIAGE');
    await expect(page.locator('#term-output')).toContainText('data_drift');
  });

  test('`start voice` jumps into the voice scenario', async ({ page }) => {
    await page.goto('/terminal');
    const input = page.locator('#term-input');
    await input.click();
    await input.fill('start voice');
    await input.press('Enter');
    await expect(page.locator('#hud-scenario')).toHaveText('voice');
    await expect(page.locator('#hud-stage')).toHaveText('1/5');
    await expect(page.locator('#term-output')).toContainText('hallucination');
  });
});

test.describe('mobile layout (iPhone-class viewport, 390x844)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const path of ['/', '/about', '/terminal', examplePost]) {
    test(`${path} fits viewport without horizontal scroll`, async ({ page }) => {
      await page.goto(path);
      // page should not exceed the viewport horizontally
      const overflow = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      expect(overflow.scroll, `horizontal overflow on ${path}`).toBeLessThanOrEqual(overflow.client + 1);
    });
  }

  test('about: avatar drops the float and renders above the bio', async ({ page }) => {
    await page.goto('/about');
    const figure = page.locator('figure.avatar');
    await expect(figure).toBeVisible();
    const float = await figure.evaluate((el) => getComputedStyle(el).float);
    expect(float).toBe('none');
  });

  test('terminal: term-foot wraps and HUD remains visible', async ({ page }) => {
    await page.goto('/terminal');
    await expect(page.locator('.term-foot')).toBeVisible();
    await expect(page.locator('#hud-stage')).toBeVisible();
    await expect(page.locator('#hud-score')).toBeVisible();
  });
});

test.describe('home — no decorative ticker', () => {
  test('the market ticker is gone', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.ticker')).toHaveCount(0);
  });
});

test.describe('function-key style nav', () => {
  test('every nav link declares an [F#] data-fkey', async ({ page }) => {
    await page.goto('/');
    const fkeys = await page.locator('nav.top .nav-links a').evaluateAll((els) =>
      els.map((e) => (e as HTMLAnchorElement).getAttribute('data-fkey'))
    );
    expect(fkeys).toEqual(['F1', 'F2', 'F3']);
  });

  test('the F-key prefix renders as ::before content', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('ja_mode', 'eng'));
    await page.goto('/');
    const before = await page.locator('nav.top .nav-links a').first().evaluate((el) =>
      getComputedStyle(el, '::before').content
    );
    expect(before).toMatch(/F1/);
  });
});

test.describe('status strip (Bloomberg-style)', () => {
  test('renders on every page with status, time placeholder, and build', async ({ page }) => {
    for (const path of ['/', '/about', '/terminal', examplePost]) {
      await page.addInitScript(() => localStorage.setItem('ja_mode', 'eng'));
      await page.goto(path);
      await expect(page.locator('.status-strip')).toBeVisible();
      await expect(page.locator('.status-strip')).toContainText('STATUS');
      await expect(page.locator('.status-strip')).toContainText('open_to_select_work');
      await expect(page.locator('.status-strip')).toContainText('REGIONS');
      await expect(page.locator('.status-strip')).toContainText('AU + US');
      await expect(page.locator('.status-strip')).toContainText('BUILD');
      // Local time hydrates client-side; just assert the slot exists with HH:MM shape eventually
      await expect(page.locator('#ss-time')).toHaveText(/^\d{2}:\d{2}$/);
    }
  });
});

test.describe('selected work on /about', () => {
  test('lists fraud-detection bank line, Brokerloop, low-latency arch, OSS interests', async ({ page }) => {
    await page.goto('/about');
    const work = page.locator('.work-list');
    await expect(work).toBeVisible();
    await expect(work).toContainText('tier-one Australian bank');
    await expect(work).toContainText('Fraud detection AI');
    await expect(work).toContainText('US engineering contract');
    await expect(work).toContainText('Los Angeles');
    await expect(work).toContainText('Brokerloop');
    await expect(work).toContainText('IoT automation');
    await expect(work).toContainText('largest laundry in the southern hemisphere');
    await expect(work).toContainText('Low-latency event-driven architecture');
    await expect(work).toContainText('nautilus_trader');
  });
});

test.describe('SEO / AEO — head + structured data', () => {
  for (const path of ['/', '/about', '/terminal', examplePost]) {
    test(`${path} has canonical, robots, og:*, twitter:* meta`, async ({ page }) => {
      await page.goto(path);

      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toMatch(/^https:\/\/jabrahamtech\.com/);

      // robots index,follow (not noindex)
      const robots = await page.locator('meta[name="robots"]').getAttribute('content');
      expect(robots).toMatch(/index/);
      expect(robots).not.toMatch(/noindex/);

      // OG essentials
      for (const prop of ['og:title', 'og:description', 'og:url', 'og:image', 'og:site_name', 'og:type', 'og:locale']) {
        const c = await page.locator(`meta[property="${prop}"]`).first().getAttribute('content');
        expect(c, `missing ${prop} on ${path}`).toBeTruthy();
      }

      // Twitter card
      const tw = await page.locator('meta[name="twitter:card"]').getAttribute('content');
      expect(tw).toBe('summary_large_image');

      // Description meta
      const desc = await page.locator('meta[name="description"]').getAttribute('content');
      expect(desc?.length || 0).toBeGreaterThan(60);
    });

    test(`${path} emits valid JSON-LD with Person + WebSite anchors`, async ({ page }) => {
      await page.goto(path);
      const blocks = await page.$$eval('script[type="application/ld+json"]', (els) => els.map((e) => e.textContent || ''));
      expect(blocks.length).toBeGreaterThan(0);
      const parsed = blocks.map((b) => JSON.parse(b));
      // Site-wide Person and WebSite must always be present
      const types = parsed.map((p) => p['@type']);
      expect(types).toContain('Person');
      expect(types).toContain('WebSite');
    });
  }

  test('homepage embeds Blog schema with blogPost list', async ({ page }) => {
    await page.goto('/');
    const blocks = await page.$$eval('script[type="application/ld+json"]', (els) => els.map((e) => JSON.parse(e.textContent || 'null')));
    const blog = blocks.find((b) => b && b['@type'] === 'Blog');
    expect(blog).toBeTruthy();
    expect(Array.isArray(blog.blogPost)).toBe(true);
    // Homepage Blog graph lists live posts only (drafts are excluded).
    expect(blog.blogPost.length).toBe(liveSlugs.length);
  });

  test('post page embeds BlogPosting + BreadcrumbList schemas', async ({ page }) => {
    await page.goto(examplePost);
    const blocks = await page.$$eval('script[type="application/ld+json"]', (els) => els.map((e) => JSON.parse(e.textContent || 'null')));
    const types = blocks.map((b) => b?.['@type']);
    expect(types).toContain('BlogPosting');
    expect(types).toContain('BreadcrumbList');
    const post = blocks.find((b) => b['@type'] === 'BlogPosting');
    expect(post.headline).toBeTruthy();
    expect(post.author?.['@id']).toMatch(/#jonathan$/);
    expect(post.image?.url || post.image).toBeTruthy();
  });

  test('every BlogPosting carries an image (Rich Results requirement)', async ({ page }) => {
    // Page-level BlogPosting — every post (drafts included) must surface
    // an image, falling back to /og/default.png when no cover is declared.
    for (const slug of allPostSlugs) {
      await page.goto(`/posts/${slug}`);
      const blocks = await page.$$eval('script[type="application/ld+json"]', (els) => els.map((e) => JSON.parse(e.textContent || 'null')));
      const post = blocks.find((b) => b['@type'] === 'BlogPosting');
      expect(post, `${slug} has no BlogPosting JSON-LD`).toBeTruthy();
      const img = typeof post.image === 'string' ? post.image : post.image?.url;
      expect(img, `${slug} BlogPosting.image missing`).toBeTruthy();
      expect(img).toMatch(/^https?:\/\//);
    }

    // Homepage Blog graph: every blogPost[] entry must carry image too.
    await page.goto('/');
    const homeBlocks = await page.$$eval('script[type="application/ld+json"]', (els) => els.map((e) => JSON.parse(e.textContent || 'null')));
    const blog = homeBlocks.find((b) => b['@type'] === 'Blog');
    expect(blog?.blogPost?.length).toBe(liveSlugs.length);
    for (const bp of blog.blogPost) {
      const v = typeof bp.image === 'string' ? bp.image : bp.image?.url;
      expect(v, `Blog.blogPost[].image missing for ${bp.url}`).toBeTruthy();
    }
  });

  test('about page emits ProfilePage with sameAs links', async ({ page }) => {
    await page.goto('/about');
    const blocks = await page.$$eval('script[type="application/ld+json"]', (els) => els.map((e) => JSON.parse(e.textContent || 'null')));
    expect(blocks.find((b) => b['@type'] === 'ProfilePage')).toBeTruthy();
    const person = blocks.find((b) => b['@type'] === 'Person');
    expect(person.sameAs).toEqual(expect.arrayContaining([
      expect.stringMatching(/github\.com\/jabrahamtech/),
      expect.stringMatching(/linkedin\.com\/in\/jabrahamtech/),
    ]));
  });

  test('og:image returns 200 and is a real asset', async ({ page }) => {
    await page.goto('/');
    const ogImg = await page.locator('meta[property="og:image"]').first().getAttribute('content');
    expect(ogImg).toBeTruthy();
    // og:image is built absolute against Astro.site; resolve the path against the test server
    const path = new URL(ogImg!).pathname;
    const r = await page.request.get(path);
    expect(r.status()).toBe(200);
    expect(r.headers()['content-type']).toMatch(/svg|image/);
  });
});

test.describe('AEO — llms.txt + AI crawler robots', () => {
  test('llms.txt is served and follows the spec shape', async ({ page }) => {
    const r = await page.request.get('/llms.txt');
    expect(r.status()).toBe(200);
    const body = await r.text();
    // H1 + summary blockquote per llmstxt.org
    expect(body).toMatch(/^#\s+Jonathan Abraham/);
    expect(body).toMatch(/^>\s+/m);
    // Sections we care about
    expect(body).toMatch(/##\s+Posts/);
    expect(body).toMatch(/##\s+Identity/);
    // Live posts are linked from llms.txt; drafts are excluded.
    for (const slug of liveSlugs) {
      expect(body, `${slug} missing from llms.txt`).toContain(`/posts/${slug}`);
    }
    for (const slug of draftSlugs) {
      expect(body, `draft ${slug} must NOT be in llms.txt`).not.toContain(`/posts/${slug}`);
    }
  });

  test('robots.txt explicitly allows the major AI / answer-engine bots', async ({ page }) => {
    const r = await page.request.get('/robots.txt');
    expect(r.status()).toBe(200);
    const body = await r.text();
    expect(body).toContain('Sitemap: https://jabrahamtech.com/sitemap-index.xml');
    for (const bot of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'Bingbot']) {
      expect(body, `${bot} not allow-listed`).toMatch(new RegExp(`User-agent:\\s*${bot}`));
    }
  });
});

test.describe('copy style', () => {
  test('site copy uses Australian spelling for common variants', async ({ page }) => {
    const forbidden = /\b(personalization|personalized|personalize|behavior|behaviors|optimize|optimizes|optimized)\b/i;

    for (const path of ['/', '/about', '/terminal', ...allPostSlugs.map((slug) => `/posts/${slug}`)]) {
      await page.goto(path);
      const visible = await page.locator('body').innerText();
      expect(visible, `${path} contains US spelling`).not.toMatch(forbidden);
    }

    const llms = await page.request.get('/llms.txt');
    expect(await llms.text()).not.toMatch(forbidden);
  });
});

test.describe('post template — slice 2 (TOC, autolinks, edit-link, progress bar)', () => {
  test('headings are slugged and autolinked with a permalink anchor', async ({ page }) => {
    await page.goto(examplePost);
    // Every h2/h3 in the prose body has an id (rehype-slug).
    const headings = page.locator('article.prose h2[id], article.prose h3[id]');
    expect(await headings.count()).toBeGreaterThanOrEqual(3);
    // Every heading carries a .heading-anchor link pointing back to its own id.
    const first = headings.first();
    const id = await first.getAttribute('id');
    const anchor = first.locator('a.heading-anchor');
    await expect(anchor).toHaveCount(1);
    await expect(anchor).toHaveAttribute('href', `#${id}`);
  });

  test('right-rail TOC renders on wide viewports with one entry per h2/h3', async ({ page }) => {
    // Desktop TOC requires a wide viewport so the article stays centred and
    // the TOC sits outside it in the right gutter (>=1320px).
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(examplePost);
    const toc = page.locator('aside.toc');
    await expect(toc).toBeVisible();
    const tocLinks = toc.locator('a[data-toc-slug]');
    const headingIds = await page
      .locator('article.prose h2[id], article.prose h3[id]')
      .evaluateAll((els) => els.map((e) => e.id));
    await expect(tocLinks).toHaveCount(headingIds.length);
    const tocSlugs = await tocLinks.evaluateAll((els) =>
      els.map((e) => e.getAttribute('data-toc-slug')),
    );
    expect(tocSlugs).toEqual(headingIds);
  });

  test('desktop right-rail TOC is hidden on narrow viewports (mobile bar takes over)', async ({ page }) => {
    // Anything below the desktop breakpoint (1320px) falls back to the mobile bar.
    await page.setViewportSize({ width: 1100, height: 900 });
    await page.goto(examplePost);
    await expect(page.locator('aside.toc.toc-desktop')).toBeHidden();
    // The collapsible mobile TOC bar takes over and is visible.
    await expect(page.locator('details.toc-mobile')).toBeVisible();
  });

  test('mobile TOC is sticky-positioned and collapses after a link tap', async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 900 });
    await page.goto(examplePost);
    const mtoc = page.locator('details.toc-mobile');
    await expect(mtoc).toBeVisible();
    const position = await mtoc.evaluate((el) => getComputedStyle(el as HTMLElement).position);
    expect(position).toBe('sticky');
    // Open the bar, click a link, and verify it auto-collapses.
    await mtoc.locator('summary').click();
    await expect(mtoc).toHaveAttribute('open', '');
    await mtoc.locator('a[data-toc-slug]').first().click();
    await expect(mtoc).not.toHaveAttribute('open', '');
  });

  test('reading progress bar is in the DOM and gets a width on scroll', async ({ page }) => {
    await page.goto(examplePost);
    const fill = page.locator('#reading-progress > span');
    await expect(fill).toHaveCount(1);
    // Scroll into the article body so the progress meter moves. The
    // calculation in DocLayout requires `body.getBoundingClientRect().top`
    // to be negative — easiest way to guarantee that is to scroll to
    // a point past the start of #post-body.
    await page.evaluate(() => {
      const body = document.getElementById('post-body');
      const offsetTop = body ? body.getBoundingClientRect().top + window.scrollY : 200;
      window.scrollTo(0, offsetTop + Math.max(window.innerHeight, 600));
    });
    await page.waitForFunction(() => {
      const el = document.querySelector('#reading-progress > span') as HTMLElement | null;
      return !!el && parseFloat(el.style.width || '0') > 0;
    }, null, { timeout: 2000 });
  });

  test('edit-on-GitHub link points at the correct repo path for this post', async ({ page }) => {
    await page.goto(examplePost);
    const link = page.locator('.edit-link a');
    await expect(link).toHaveCount(1);
    /* The slug is derived from examplePost above so the assertion tracks
       whichever fixture post is in use. */
    const slug = examplePost.replace(/^\/posts\//, '');
    await expect(link).toHaveAttribute(
      'href',
      `https://github.com/jabrahamtech/personal-website/edit/main/site/src/content/posts/${slug}.mdx`,
    );
  });

  test('every <pre> in a post gets a [copy] button mounted by the layout script', async ({ page }) => {
    await page.goto(examplePost);
    /* The current fixture post has no fenced code; the layout script still
       has to do the right thing when it does. Asserts the relationship —
       one copy-btn per <pre> — which holds vacuously at zero and would
       still flag a regression if a <pre> appeared without a button. */
    const preCount = await page.locator('article.prose pre').count();
    await expect(page.locator('article.prose pre .copy-btn')).toHaveCount(preCount);
  });

  test('post id renders in the meta row and matches the EOF marker', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('ja_mode', 'eng'));
    await page.goto(examplePost);
    const idCell = page.locator('.meta-row span', { hasText: /^id\s+0x[0-9A-F]+/i }).first();
    await expect(idCell).toBeVisible();
    const idText = ((await idCell.textContent()) || '').trim().replace(/^id\s+/i, '');
    const eof = page.locator('.post-eof');
    await expect(eof).toContainText(`[EOF — ${idText}]`);
    await expect(eof).toContainText('[exit 0]');
  });

  test('readTime is auto-computed from the post body when frontmatter omits it', async ({ page }) => {
    await page.goto(examplePost);
    const readCell = page.locator('.meta-row span', { hasText: /^read\s+~\s+\d+\s+min$/ }).first();
    await expect(readCell).toBeVisible();
  });

  test('Callout component renders with type-coloured header and accessible label', async ({ page }) => {
    await page.goto(examplePost);
    // The fixture post has at least one tip callout. Assert it renders
    // with the expected header structure; other variants (warn/note/info)
    // are exercised when posts that use them are present.
    const tips = page.locator('.callout.callout-tip');
    const tipCount = await tips.count();
    expect(tipCount).toBeGreaterThan(0);
    await expect(tips.first().locator('.callout-label')).toHaveText(/^TIP$/);
  });

  test('Figure component renders an <img> with a <figcaption>', async ({ page }) => {
    await page.goto(examplePost);
    const fig = page.locator('figure.post-figure');
    const figCount = await fig.count();
    expect(figCount).toBeGreaterThan(0);
    // Each figure carries a visible trigger img + non-empty figcaption.
    // (A second <img> lives inside the per-figure <dialog> zoom modal but
    // is hidden until the modal opens.)
    for (let i = 0; i < figCount; i++) {
      await expect(fig.nth(i).locator('.post-figure-trigger img')).toBeVisible();
      const caption = (await fig.nth(i).locator('figcaption').textContent()) || '';
      expect(caption.trim().length, 'figcaption should not be empty').toBeGreaterThan(0);
    }
  });

  test('Figure click opens zoom modal, wheel zooms, ESC closes', async ({ page }) => {
    await page.goto(examplePost);
    const trigger = page.locator('.post-figure-trigger').first();
    const dialog = page.locator('.figure-zoom').first();
    await expect(trigger).toBeVisible();
    // Dialog has no [open] until trigger fires.
    await expect(dialog).not.toHaveAttribute('open', '');
    await trigger.click();
    await expect(dialog).toHaveAttribute('open', '');
    // Panzoom should be wired: a wheel event applies a non-identity transform.
    await page.locator('.figure-zoom-stage').first().dispatchEvent('wheel', { deltaY: -300, bubbles: true, cancelable: true });
    const transform = await page.locator('.figure-zoom-img').first().evaluate((el) => getComputedStyle(el).transform);
    expect(transform, 'panzoom should apply a non-identity transform on wheel zoom').not.toBe('none');
    expect(transform).not.toBe('matrix(1, 0, 0, 1, 0, 0)');
    await page.keyboard.press('Escape');
    await expect(dialog).not.toHaveAttribute('open', '');
  });
});
