// Renders public/og/default.svg → public/og/default.png at exact 1200x630.
//
// Usage: `npm run render:og` (or `node scripts/render-og.mjs`).
//
// Why a render step at all: Astro emits the SVG fine, but most OG/social
// scrapers (Facebook, LinkedIn, iMessage previews) handle PNG far more
// reliably. Keeping the canonical card as SVG lets us hand-edit it; the
// rendered PNG is what we ship in <meta property="og:image">.
//
// Hard requirements per the OG spec + opengraph.xyz audit:
//  - 1200 × 630 exact (no @2x; some scrapers downscale, others don't,
//    and Twitter explicitly fails on >5MB or >1200px wide)
//  - PNG, 8-bit RGB, non-interlaced
//  - Drop-shadowed text and gradients render correctly
//
// Headless Chromium handles all of that; we just have to set
// deviceScaleFactor: 1 explicitly so we get 1:1 pixels.

import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

// Optional CLI args: `node render-og.mjs <input.svg> <output.png>`. Both
// are resolved relative to site/. Defaults render the canonical OG card.
const [argIn, argOut] = process.argv.slice(2);
const SVG_IN = resolve(ROOT, argIn ?? 'public/og/default.svg');
const PNG_OUT = resolve(ROOT, argOut ?? 'public/og/default.png');

// Resolve the bundled chromium that Playwright already installed for tests.
// Avoids forcing a separate `playwright install` step just for this script.
async function findChromium() {
  // Try the locked Playwright cache path first — that's what `npx playwright
  // install chromium` populates. Fall back to system chromium if missing.
  const home = process.env.HOME || '';
  const cache = `${home}/Library/Caches/ms-playwright`;
  try {
    const fs = await import('node:fs/promises');
    const dirs = await fs.readdir(cache);
    const chromium = dirs.find((d) => d.startsWith('chromium-'));
    if (chromium) {
      const exec = `${cache}/${chromium}/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
      await fs.access(exec);
      return exec;
    }
  } catch (_) { /* fall through */ }
  return undefined; // let Playwright pick the default
}

const svg = await readFile(SVG_IN, 'utf8');
const html = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:#0b0e0c;width:1200px;height:630px;overflow:hidden}svg{display:block}</style></head><body>${svg}</body></html>`;

const exec = await findChromium();
const browser = await chromium.launch(exec ? { executablePath: exec } : {});
const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.setContent(html, { waitUntil: 'networkidle' });
// Small settle so any web fonts (none currently, but be safe) finish layout.
await page.waitForTimeout(200);
await page.screenshot({ path: PNG_OUT, clip: { x: 0, y: 0, width: 1200, height: 630 }, omitBackground: false });
await browser.close();
console.log(`[og] rendered ${PNG_OUT} (1200x630) from ${SVG_IN}`);
