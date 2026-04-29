// Pings IndexNow with every URL in the freshly-built sitemap.
//
// Behaviour:
//  - Runs as `npm run postbuild` (auto-fired by npm after `npm run build`).
//  - No-op unless INDEXNOW_ENABLED=1. Railway sets this in production env;
//    local builds stay quiet so dev iteration doesn't ping the index.
//  - Never throws. IndexNow being down or rate-limiting must not fail a deploy.

import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SITEMAP = resolve(HERE, '../dist/sitemap-0.xml');
const HOST = 'jonathanabraham.dev';
const KEY = '3c6a32b924ae3459a89431ac3e5fe8c2';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';

if (process.env.INDEXNOW_ENABLED !== '1') {
  console.log('[indexnow] skipped (INDEXNOW_ENABLED != 1)');
  process.exit(0);
}

async function urlsFromSitemap() {
  try {
    const xml = await readFile(SITEMAP, 'utf8');
    const matches = xml.match(/<loc>([^<]+)<\/loc>/g) || [];
    return matches.map((m) => m.replace(/<\/?loc>/g, '').trim()).filter(Boolean);
  } catch (err) {
    console.warn('[indexnow] sitemap unreadable, skipping:', err.message);
    return [];
  }
}

async function ping(urls) {
  const body = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  };
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    });
    // 200/202 are both success per spec.
    console.log(`[indexnow] ${res.status} ${res.statusText} — pinged ${urls.length} url(s)`);
  } catch (err) {
    console.warn('[indexnow] ping failed (non-fatal):', err.message);
  }
}

const urls = await urlsFromSitemap();
if (urls.length === 0) {
  console.warn('[indexnow] no urls found, nothing to ping');
  process.exit(0);
}
await ping(urls);
