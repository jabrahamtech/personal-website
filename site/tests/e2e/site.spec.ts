import { test, expect, type Page } from '@playwright/test';

// Skip the boot sequence so it doesn't sit on top of the page during tests.
async function gotoFresh(page: Page, path: string) {
  await page.addInitScript(() => sessionStorage.setItem('boot_seen', '1'));
  await page.goto(path);
}

test.describe('home page', () => {
  test('renders hero, terminal, HUD, and key sections', async ({ page }) => {
    await gotoFresh(page, '/');

    await expect(page).toHaveTitle(/Jonathan Abraham/);
    await expect(page.locator('h1.h')).toContainText('Founder-engineer');
    await expect(page.locator('h1.h')).toContainText('production AI');

    // hero badges (after dropping available_for_contracts)
    await expect(page.locator('.badge-row .badge')).toHaveCount(2);
    await expect(page.locator('.badge-row')).toContainText('melbourne · au');
    await expect(page.locator('.badge-row')).toContainText('us_timezone_overlap');
    await expect(page.locator('.badge-row')).not.toContainText('available_for_contracts');

    // terminal scaffolding
    await expect(page.locator('#term-input')).toBeVisible();
    await expect(page.locator('.term-line').first()).toContainText('operator.os v2.6');
    // standalone blinking-block cursor span should be gone (caret comes from the input)
    await expect(page.locator('#term-cur')).toHaveCount(0);

    // status HUD shows new status, no shipped_q row
    await expect(page.locator('#status-hud')).toBeVisible();
    await expect(page.locator('#status-hud')).toContainText('selective_intake');
    await expect(page.locator('#status-hud')).not.toContainText('shipped_q');
    await expect(page.locator('#status-hud')).not.toContainText('accepting_briefs');

    // sections present
    for (const id of ['operating-system', 'proof-of-work', 'services', 'writing', 'about', 'contact']) {
      await expect(page.locator(`#${id}`)).toBeVisible();
    }
  });

  test('operating system pillar swap landed', async ({ page }) => {
    await gotoFresh(page, '/');
    const os = page.locator('#operating-system');
    await expect(os).toContainText('Backend AI Infrastructure');
    await expect(os).not.toContainText('Web3 / Blockchain');
  });

  test('services rewrite landed', async ({ page }) => {
    await gotoFresh(page, '/');
    const svc = page.locator('#services');
    await expect(svc).toContainText('Production Readiness Sprint');
    await expect(svc).not.toContainText('AI Prototype Sprint');
  });

  test('contact channels: no twitter row', async ({ page }) => {
    await gotoFresh(page, '/');
    const channels = page.locator('#contact .channels');
    await expect(channels).toContainText('jabrahamtech@gmail.com');
    await expect(channels).toContainText('/jabrahamtech');
    await expect(channels).not.toContainText('twitter');
    await expect(channels).not.toContainText('@jonabraham');
  });

  test('three project cards link to dynamic routes', async ({ page }) => {
    await gotoFresh(page, '/');
    const projects = page.locator('#proof-of-work .pcard.proj');
    await expect(projects).toHaveCount(3);

    // Slugs we expect from the renamed third project
    const ctas = page.locator('#proof-of-work .pcta');
    const hrefs = await ctas.evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).getAttribute('href')));
    expect(hrefs).toEqual(
      expect.arrayContaining([
        '/projects/voice-ai-intake',
        '/projects/insurance-workflow',
        '/projects/backend-ai-infra',
      ])
    );

    // wip cards render the muted "drafting" pill, not "v0.4.2 · ok" etc.
    await expect(page.locator('#proof-of-work .vis-tag.wip').first()).toBeVisible();
    await expect(page.locator('#proof-of-work')).toContainText('drafting');
    await expect(page.locator('#proof-of-work')).not.toContainText('v0.4.2 · ok');
  });

  test('writing filter buttons toggle visibility', async ({ page }) => {
    await gotoFresh(page, '/');
    const grid = page.locator('#write-grid');
    await expect(grid.locator('.article')).toHaveCount(3);

    await page.locator('.write-cats button[data-cat="voice_ai_in_production"]').click();
    await expect(grid.locator('.article:not(.hide)')).toHaveCount(1);
    await expect(grid.locator('.article:not(.hide)')).toContainText('voice AI fails after the demo');

    await page.locator('.write-cats button[data-cat="all"]').click();
    await expect(grid.locator('.article:not(.hide)')).toHaveCount(3);
  });
});

test.describe('hero terminal commands', () => {
  test('help, whoami, projects, clear all execute', async ({ page }) => {
    await gotoFresh(page, '/');
    const input = page.locator('#term-input');
    const out = page.locator('#term-output');

    await input.click();
    await input.fill('help');
    await input.press('Enter');
    await expect(out).toContainText('available commands:');
    await expect(out).toContainText('whoami');

    await input.fill('whoami');
    await input.press('Enter');
    await expect(out).toContainText('founder, brokerloop');

    await input.fill('projects');
    await input.press('Enter');
    // wip annotation appears alongside listings
    await expect(out).toContainText('voice_ai_intake');
    await expect(out).toContainText('backend_ai_infra');
    await expect(out).toContainText('[wip]');

    await input.fill('clear');
    await input.press('Enter');
    // clear empties output; one of the previous lines must be gone
    await expect(out).not.toContainText('available commands:');
  });

  test('unknown command shows command-not-found warning', async ({ page }) => {
    await gotoFresh(page, '/');
    const input = page.locator('#term-input');
    await input.click();
    await input.fill('frobulate');
    await input.press('Enter');
    await expect(page.locator('#term-output')).toContainText('command not found: frobulate');
  });

  test('book command smooth-scrolls to contact', async ({ page }) => {
    await gotoFresh(page, '/');
    const input = page.locator('#term-input');
    await input.click();
    await input.fill('book');
    await input.press('Enter');
    // wait for the smooth-scroll to settle
    await page.waitForTimeout(800);
    await expect(page.locator('#contact')).toBeInViewport({ ratio: 0.05 });
  });

  test('cursor sits next to the input (visual regression check)', async ({ page }) => {
    await gotoFresh(page, '/');
    const input = page.locator('#term-input');
    // The bug we just fixed: a separate blinking-block was being pushed to the
    // far right of the row by `flex:1` on the input. With the fix the row only
    // contains the prompt + input, no trailing block.
    const row = page.locator('.term-input-row');
    await expect(row.locator('span.cursor')).toHaveCount(0);
    // Native caret-color is green — input is focusable.
    await input.focus();
    await expect(input).toBeFocused();
  });
});

test.describe('project pages', () => {
  for (const slug of ['voice-ai-intake', 'insurance-workflow', 'backend-ai-infra']) {
    test(`/projects/${slug} renders the WIP shell`, async ({ page }) => {
      await gotoFresh(page, `/projects/${slug}`);
      await expect(page.locator('h1.h')).toBeVisible();
      await expect(page.locator('.crumbs')).toContainText('proof-of-work');
      // body is the coming-soon callout
      await expect(page.locator('.prose blockquote')).toContainText('status: drafting');
      // prev/next pcards present
      await expect(page.locator('.pn .pcard')).toHaveCount(2);
    });
  }
});

test.describe('writing pages', () => {
  for (const slug of ['voice-ai-after-demo', 'insurance-intake-design', 'ai-automation-operationalise']) {
    test(`/writing/${slug} renders the WIP shell`, async ({ page }) => {
      await gotoFresh(page, `/writing/${slug}`);
      await expect(page.locator('h1.h')).toBeVisible();
      await expect(page.locator('.crumbs')).toContainText('writing');
      await expect(page.locator('.prose')).toContainText('status: drafting');
      await expect(page.locator('.prose')).toContainText('short version');
    });
  }
});

test.describe('infrastructure', () => {
  test('404 page renders kernel-panic shell', async ({ page }) => {
    const response = await page.goto('/this-route-does-not-exist');
    // serve returns 404 status with the static 404.html as the body
    expect(response?.status()).toBe(404);
    await expect(page.locator('.panic h1')).toContainText('404');
    await expect(page.locator('.panic')).toContainText('SIGNAL_NOT_FOUND');
  });

  test('sitemap-index.xml lists project + writing routes', async ({ page }) => {
    const r = await page.request.get('/sitemap-index.xml');
    expect(r.status()).toBe(200);
    expect(await r.text()).toContain('sitemap-0.xml');

    const r0 = await page.request.get('/sitemap-0.xml');
    expect(r0.status()).toBe(200);
    const body = await r0.text();
    expect(body).toContain('/projects/voice-ai-intake');
    expect(body).toContain('/projects/backend-ai-infra');
    expect(body).toContain('/writing/voice-ai-after-demo');
  });

  test('robots.txt is served', async ({ page }) => {
    const r = await page.request.get('/robots.txt');
    expect(r.status()).toBe(200);
    expect(await r.text()).toContain('Sitemap:');
  });
});

test.describe('responsive', () => {
  test('mobile nav toggle reveals the menu', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 480, height: 900 } });
    const page = await ctx.newPage();
    await page.addInitScript(() => sessionStorage.setItem('boot_seen', '1'));
    await page.goto('/');

    const links = page.locator('#nav-links');
    await expect(links).not.toBeVisible(); // hidden under 780px until toggled
    await page.locator('#nav-toggle').click();
    await expect(links).toBeVisible();
    await ctx.close();
  });

  test('status HUD hides under 560px', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 480, height: 900 } });
    const page = await ctx.newPage();
    await page.addInitScript(() => sessionStorage.setItem('boot_seen', '1'));
    await page.goto('/');
    await expect(page.locator('#status-hud')).not.toBeVisible();
    await ctx.close();
  });
});
