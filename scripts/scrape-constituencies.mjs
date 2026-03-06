#!/usr/bin/env node
/**
 * Scrapes constituency boundary GeoJSON from the Election Commission Nepal site
 * (result.election.gov.np) and writes a merged FeatureCollection to
 * frontend/public/geojson/nepal-constituencies.geojson
 *
 * Usage: node scripts/scrape-constituencies.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, '..', 'frontend', 'public', 'geojson', 'nepal-constituencies.geojson');

const BASE = 'https://result.election.gov.np';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

// ECN DCODEs: 1-75, 77, 78 (77 districts)
function ecnDcodeToApiDistrictId(dcode) {
  if (dcode <= 75) return dcode;
  if (dcode === 77) return 76;
  if (dcode === 78) return 77;
  throw new Error(`Unknown DCODE: ${dcode}`);
}

const ALL_DCODES = [...Array.from({ length: 75 }, (_, i) => i + 1), 77, 78];

function simplifyCoords(coords) {
  if (typeof coords[0] === 'number') {
    return coords.map((c) => Math.round(c * 10000) / 10000);
  }
  return coords.map(simplifyCoords);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function establishSession() {
  console.log('Establishing session...');

  // Step 1: Visit the main page to get initial cookies
  const mainRes = await fetch(BASE, {
    headers: { 'User-Agent': USER_AGENT },
    redirect: 'follow',
  });
  if (!mainRes.ok) throw new Error(`Main page: ${mainRes.status}`);

  const rawCookies = mainRes.headers.getSetCookie?.() ?? [];
  let cookies = rawCookies.map((c) => c.split(';')[0]).filter((c) => c.includes('=')).join('; ');

  const html = await mainRes.text();

  // Extract CSRF token from cookie (CsrfToken=xxx)
  const csrfCookieMatch = cookies.match(/CsrfToken=([^;]+)/);
  const csrfFromCookie = csrfCookieMatch?.[1] ?? '';

  // Also try __RequestVerificationToken from HTML
  const tokenMatch = html.match(
    /name="__RequestVerificationToken"[^>]*value="([^"]+)"/,
  );
  const verificationToken = tokenMatch?.[1] || csrfFromCookie;

  // Step 2: Visit the map/result page to fully establish session
  const mapRes = await fetch(`${BASE}/Map`, {
    headers: {
      'User-Agent': USER_AGENT,
      Cookie: cookies,
      Referer: BASE + '/',
    },
    redirect: 'follow',
  });

  // Merge any new cookies
  const mapCookies = mapRes.headers.getSetCookie?.() ?? [];
  if (mapCookies.length > 0) {
    const newParts = mapCookies.map((c) => c.split(';')[0]).filter((c) => c.includes('='));
    if (newParts.length > 0) {
      cookies = cookies ? `${cookies}; ${newParts.join('; ')}` : newParts.join('; ');
    }
  }

  console.log(`  Cookies: ${cookies.substring(0, 60)}...`);
  console.log(`  Token: ${verificationToken ? verificationToken.substring(0, 20) + '...' : '(none)'}`);

  return { cookies, verificationToken };
}

async function fetchJson(url, cookies, verificationToken, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const headers = {
      'User-Agent': USER_AGENT,
      Cookie: cookies,
      'X-Requested-With': 'XMLHttpRequest',
      Accept: 'application/json, text/javascript, */*; q=0.01',
      Referer: BASE + '/Map',
    };
    if (verificationToken) {
      headers['__RequestVerificationToken'] = verificationToken;
      headers['X-CSRF-Token'] = verificationToken;
      headers['CsrfToken'] = verificationToken;
    }

    const res = await fetch(url, { headers });

    if (res.status === 429) {
      const wait = attempt * 3000;
      console.log(`    Rate limited, waiting ${wait / 1000}s (attempt ${attempt}/${retries})...`);
      await sleep(wait);
      continue;
    }

    if (!res.ok) {
      if (attempt < retries) {
        await sleep(1000 * attempt);
        continue;
      }
      throw new Error(`HTTP ${res.status}`);
    }

    return res.json();
  }
  throw new Error('Max retries exceeded');
}

async function main() {
  const { cookies, verificationToken } = await establishSession();

  // Test with a single district first
  console.log('\nTesting with district 1...');
  const testUrl = `${BASE}/Handlers/SecureJson.ashx?file=JSONFiles/JSONMap/geojson/Const/dist-1.json`;
  try {
    const testResult = await fetchJson(testUrl, cookies, verificationToken);
    console.log(`  Success! Got ${Array.isArray(testResult) ? testResult.length : 'non-array'} features`);
  } catch (err) {
    console.error(`  Test failed: ${err.message}`);
    console.error('\nThe ECN site may require browser-based authentication.');
    console.error('Try providing cookies manually via COOKIES environment variable:');
    console.error('  COOKIES="ASP.NET_SessionId=xxx; .ASPXAUTH=yyy" node scripts/scrape-constituencies.mjs');

    // Check if manual cookies were provided
    if (!process.env.COOKIES) {
      process.exit(1);
    }
  }

  // Allow manual cookie override
  const finalCookies = process.env.COOKIES || cookies;
  const finalToken = process.env.CSRF_TOKEN || verificationToken;

  console.log(`\nFetching constituency data for ${ALL_DCODES.length} districts...`);

  const allFeatures = [];
  let completed = 0;
  let failed = 0;

  // Process sequentially with delays to avoid rate limiting
  for (const dcode of ALL_DCODES) {
    const url = `${BASE}/Handlers/SecureJson.ashx?file=JSONFiles/JSONMap/geojson/Const/dist-${dcode}.json`;
    try {
      const features = await fetchJson(url, finalCookies, finalToken);
      const arr = Array.isArray(features) ? features : [];
      const apiDistrictId = ecnDcodeToApiDistrictId(dcode);

      for (const f of arr) {
        // Skip conservation areas (F_CONST=5999)
        if (f.properties?.F_CONST === 5999) continue;
        f.properties = f.properties ?? {};
        f.properties.district_id = apiDistrictId;
        const distName = (f.properties.DISTRICT || '').toLowerCase().trim();
        f.properties.constituency_key = `${distName}-${f.properties.F_CONST}`;
        if (f.geometry?.coordinates) {
          f.geometry.coordinates = simplifyCoords(f.geometry.coordinates);
        }
        allFeatures.push(f);
      }
      completed++;
      process.stdout.write(`  ${completed + failed}/${ALL_DCODES.length} (${completed} ok, ${failed} failed)\r`);
    } catch (err) {
      failed++;
      console.error(`  DCODE ${dcode}: ${err.message}`);
    }

    // Small delay between requests
    await sleep(200);
  }

  console.log(`\n\nTotal features: ${allFeatures.length} (${completed} districts ok, ${failed} failed)`);

  if (allFeatures.length === 0) {
    console.error('No features collected. Exiting without writing file.');
    process.exit(1);
  }

  const featureCollection = {
    type: 'FeatureCollection',
    features: allFeatures,
  };

  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(featureCollection));

  const sizeMb = (Buffer.byteLength(JSON.stringify(featureCollection)) / 1024 / 1024).toFixed(2);
  console.log(`Written to: ${OUTPUT} (${sizeMb} MB)`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
