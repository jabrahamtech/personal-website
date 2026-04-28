import { test, expect } from '@playwright/test';

test.describe('home (posts list)', () => {
  test('renders header, intro, and a list of posts', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Jonathan Abraham');
    await expect(page.locator('.page-head h1')).toHaveText('Notes');
    await expect(page.locator('.page-head .intro')).toContainText('Brokerloop');

    // posts list
    const rows = page.locator('.post-list .post-row');
    await expect(rows).toHaveCount(3);
    // each row links to /posts/<slug>
    const hrefs = await rows.evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).getAttribute('href')));
    for (const href of hrefs) expect(href).toMatch(/^\/posts\//);

    // every row currently shows the draft badge
    const drafts = page.locator('.post-list .draft');
    await expect(drafts).toHaveCount(3);
  });

  test('no pitch-surface artifacts remain', async ({ page }) => {
    await page.goto('/');
    const html = await page.content();
    for (const needle of [
      'term-input', 'status-hud', 'boot-inner', 'sprite',          // structural
      'Production Readiness Sprint', 'Operating system', 'Backend AI Infrastructure', // section headings
      'Founder-engineer building',                                  // hero
      'work_with_me', 'view_proof_of_work', 'tell_me_what_youre_building', // CTAs
      'available_for_contracts', 'selective_intake',                // status copy
      'send_message',                                               // contact form
    ]) {
      expect(html, `unexpected leftover: ${needle}`).not.toContain(needle);
    }
  });

  test('nav has posts, about, rss only', async ({ page }) => {
    await page.goto('/');
    const linkTexts = await page.locator('nav.top .nav-links a').allTextContents();
    expect(linkTexts).toEqual(['posts', 'about', 'rss']);
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
});

test.describe('infrastructure', () => {
  test('rss.xml lists no drafts (currently empty channel)', async ({ page }) => {
    const r = await page.request.get('/rss.xml');
    expect(r.status()).toBe(200);
    expect(r.headers()['content-type']).toMatch(/xml/);
    const body = await r.text();
    expect(body).toContain('<rss');
    expect(body).toContain('Jonathan Abraham');
    // All current posts are drafts → no <item> elements
    expect(body).not.toContain('<item>');
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
