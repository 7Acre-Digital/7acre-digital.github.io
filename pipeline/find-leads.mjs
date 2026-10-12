// Find lawn/landscaping businesses with no real website via Google Places API (New).
//
// Usage:
//   $env:GOOGLE_PLACES_API_KEY = "..."          (PowerShell)
//   node find-leads.mjs "Tampa, FL" "Brandon, FL"
//
// Writes data/leads.json (merged with previous runs, keeps your status/notes) and data/leads.csv.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

process.chdir(dirname(fileURLToPath(import.meta.url)));

const KEY = process.env.GOOGLE_PLACES_API_KEY;
const cities = process.argv.slice(2);
if (!KEY) exit('Set GOOGLE_PLACES_API_KEY first.');
if (!cities.length) exit('Pass at least one city, e.g. node find-leads.mjs "Tampa, FL"');

const config = JSON.parse(await readFile('config.json', 'utf8'));

const ENDPOINT = 'https://places.googleapis.com/v1/places:searchText';
const FIELDS = [
  'places.id', 'places.displayName', 'places.formattedAddress', 'places.addressComponents',
  'places.nationalPhoneNumber', 'places.internationalPhoneNumber', 'places.rating',
  'places.userRatingCount', 'places.websiteUri', 'places.googleMapsUri', 'places.businessStatus',
  'places.regularOpeningHours', 'places.reviews', 'places.primaryTypeDisplayName', 'nextPageToken',
].join(',');

// Listings whose "website" is really a social/directory page — these still count as no website.
const NOT_A_WEBSITE = /facebook\.com|fb\.com|fb\.me|instagram\.com|yelp\.com|nextdoor\.com|linktr\.ee|angi\.com|homeadvisor\.com|thumbtack\.com|business\.site|sites\.google\.com|g\.page|tiktok\.com/i;

async function searchAll(textQuery) {
  const places = [];
  let pageToken;
  for (let page = 0; page < 3; page++) { // API caps at 60 results per query
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': KEY, 'X-Goog-FieldMask': FIELDS },
      body: JSON.stringify({ textQuery, pageSize: 20, regionCode: 'US', ...(pageToken && { pageToken }) }),
    });
    if (!res.ok) throw new Error(`Places API ${res.status}: ${await res.text()}`);
    const body = await res.json();
    places.push(...(body.places ?? []));
    pageToken = body.nextPageToken;
    if (!pageToken) break;
    await new Promise(r => setTimeout(r, 1500));
  }
  return places;
}

function toLead(p, searchedCity) {
  const comp = type => p.addressComponents?.find(c => c.types?.includes(type));
  const website = p.websiteUri ?? '';
  const websiteStatus = !website ? 'none' : NOT_A_WEBSITE.test(website) ? 'social' : 'real';
  const rating = p.rating ?? 0;
  const reviewCount = p.userRatingCount ?? 0;
  const qualified = websiteStatus !== 'real'
    && p.businessStatus === 'OPERATIONAL'
    && rating >= config.minRating
    && reviewCount >= config.minReviews;

  return {
    id: p.id,
    name: p.displayName?.text ?? '',
    category: p.primaryTypeDisplayName?.text ?? '',
    phone: p.nationalPhoneNumber ?? '',
    phoneIntl: p.internationalPhoneNumber ?? '',
    address: p.formattedAddress ?? '',
    city: comp('locality')?.longText ?? searchedCity.split(',')[0].trim(),
    state: comp('administrative_area_level_1')?.shortText ?? '',
    rating,
    reviewCount,
    websiteStatus,
    socialUrl: websiteStatus === 'social' ? website : '',
    mapsUrl: p.googleMapsUri ?? '',
    hours: p.regularOpeningHours?.weekdayDescriptions ?? [],
    reviews: (p.reviews ?? []).map(r => ({
      author: r.authorAttribution?.displayName ?? '',
      rating: r.rating ?? 0,
      text: r.text?.text ?? r.originalText?.text ?? '',
      when: r.relativePublishTimeDescription ?? '',
    })),
    qualified,
    searchedCity,
    fetchedAt: new Date().toISOString(),
  };
}

// Merge with previous runs so pipeline fields (status, email, notes) survive re-fetches.
await mkdir('data', { recursive: true });
let existing = [];
try { existing = JSON.parse(await readFile('data/leads.json', 'utf8')); } catch {}
const byId = new Map(existing.map(l => [l.id, l]));

let seen = 0;
for (const city of cities) {
  for (const q of config.queries) {
    const places = await searchAll(`${q} in ${city}`);
    seen += places.length;
    for (const p of places) {
      const prev = byId.get(p.id);
      byId.set(p.id, {
        ...toLead(p, city),
        status: prev?.status ?? 'new',
        email: prev?.email ?? '',
        owner: prev?.owner ?? '',
        notes: prev?.notes ?? '',
      });
    }
    console.log(`  ${city} · "${q}": ${places.length} results`);
  }
}

const all = [...byId.values()].sort((a, b) => b.qualified - a.qualified || b.reviewCount - a.reviewCount);
await writeFile('data/leads.json', JSON.stringify(all, null, 2));
await writeFile('data/leads.csv', toCsv(all.filter(l => l.qualified), [
  'name', 'phone', 'city', 'state', 'rating', 'reviewCount', 'websiteStatus', 'socialUrl', 'mapsUrl', 'status', 'email', 'owner', 'notes',
]));

const qualified = all.filter(l => l.qualified).length;
console.log(`\n${seen} results scanned · ${all.length} unique businesses · ${qualified} qualified leads`);
console.log('→ data/leads.json, data/leads.csv');

function toCsv(rows, cols) {
  const cell = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [cols.join(','), ...rows.map(r => cols.map(c => cell(r[c])).join(','))].join('\n');
}

function exit(msg) { console.error(msg); process.exit(1); }
