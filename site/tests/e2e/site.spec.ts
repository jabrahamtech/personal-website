import { test, expect } from '@playwright/test';

test.describe('home (posts list)', () => {
  test('renders brand header, links row, and post list', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Jonathan Abraham');
    await expect(page.locator('.page-head h1.brandline')).toHaveText('Jonathan Abraham');
    await expect(page.locator('.page-head .tagline')).toContainText('founder');
    await expect(page.locator('.page-head .tagline')).toContainText('melbourne');

    // links row contains the four expected links
    const linkLabels = await page.locator('.links-row a').allTextContents();
    expect(linkLabels).toEqual(['email', 'github', 'linkedin', 'about']);

    // posts list
    const rows = page.locator('.post-list .post-row');
    await expect(rows).toHaveCount(3);
    const hrefs = await rows.evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).getAttribute('href')));
    for (const href of hrefs) expect(href).toMatch(/^\/posts\//);

    // every row currently shows the draft badge
    await expect(page.locator('.post-list .draft')).toHaveCount(3);
  });

  test('the old "Notes / Working notes…" intro is gone', async ({ page }) => {
    await page.goto('/');
    const html = await page.content();
    expect(html).not.toContain('>Notes<');
    expect(html).not.toContain('Working notes on production AI');
    expect(html).not.toContain('class="intro"');
  });

  test('no pitch-surface or RSS artifacts remain', async ({ page }) => {
    await page.goto('/');
    const html = await page.content();
    for (const needle of [
      'term-input', 'status-hud', 'boot-inner', 'sprite',
      'Production Readiness Sprint', 'Operating system',
      'Founder-engineer building',
      'rss.xml',                                            // RSS removed
    ]) {
      expect(html, `unexpected leftover: ${needle}`).not.toContain(needle);
    }
  });

  test('nav has posts and about only (no rss link)', async ({ page }) => {
    await page.goto('/');
    const linkTexts = await page.locator('nav.top .nav-links a').allTextContents();
    expect(linkTexts).toEqual(['posts', 'about']);
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
    await expect(page.locator('.page-head h1')).toHaveText('About');
    await expect(page.locator('.prose')).toContainText('Brokerloop');
    await expect(page.locator('.prose')).toContainText('Contract work is by referral');
    await expect(page.locator('.prose a[href^="mailto:jabrahamtech@gmail.com"]').first()).toBeVisible();
    await expect(page.locator('.prose a[href*="github.com/jabrahamtech"]')).toBeVisible();
  });

  test('about link is marked current', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('nav.top .nav-links a[aria-current="page"]')).toHaveText('about');
  });
});

test.describe('post pages', () => {
  for (const slug of ['voice-ai-after-demo', 'insurance-intake-design', 'ai-automation-operationalise']) {
    test(`/posts/${slug} renders the WIP shell`, async ({ page }) => {
      const response = await page.goto(`/posts/${slug}`);
      expect(response?.status()).toBe(200);
      await expect(page.locator('.doc h1')).toBeVisible();
      await expect(page.locator('.crumbs')).toContainText('posts');
      await expect(page.locator('.prose blockquote')).toContainText('status: drafting');
      await expect(page.locator('.meta-row')).toContainText('draft');
    });
  }

  test('prev/next links land on neighbouring posts', async ({ page }) => {
    await page.goto('/posts/voice-ai-after-demo');
    const pn = page.locator('.pn a[href^="/posts/"]');
    await expect(pn.first()).toBeVisible();
    const hrefs = await pn.evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).getAttribute('href')));
    for (const href of hrefs) expect(href).toMatch(/^\/posts\//);
  });

  test('voice-ai post renders the seeded cover image', async ({ page }) => {
    await page.goto('/posts/voice-ai-after-demo');
    const cover = page.locator('figure.cover img');
    await expect(cover).toBeVisible();
    await expect(cover).toHaveAttribute('src', '/posts/voice-ai-cover.svg');
    const r = await page.request.get('/posts/voice-ai-cover.svg');
    expect(r.status()).toBe(200);
    expect(r.headers()['content-type']).toContain('svg');
  });

  test('drafts without an image dont render a figure.cover', async ({ page }) => {
    await page.goto('/posts/insurance-intake-design');
    await expect(page.locator('figure.cover')).toHaveCount(0);
  });
});

test.describe('infrastructure', () => {
  test('rss.xml route is removed', async ({ page }) => {
    const r = await page.request.get('/rss.xml');
    expect(r.status()).toBe(404);
  });

  test('sitemap-index.xml + sitemap-0.xml include posts and about', async ({ page }) => {
    const idx = await page.request.get('/sitemap-index.xml');
    expect(idx.status()).toBe(200);
    expect(await idx.text()).toContain('sitemap-0.xml');

    const r = await page.request.get('/sitemap-0.xml');
    expect(r.status()).toBe(200);
    const body = await r.text();
    expect(body).toContain('/posts/voice-ai-after-demo');
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
    await expect(page.locator('.panic h1')).toContainText('404');
    await expect(page.locator('.panic')).toContainText('SIGNAL_NOT_FOUND');
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
