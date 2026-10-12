// Build a pitch site for every Fibery business in the "Ready for build" state, then write the
// result back: a Site record (URL, style, outreach text) linked to the business, and the business
// moved to "Site built".
//
// Usage:
//   $env:FIBERY_TOKEN = "your-token"          (Fibery: avatar menu → Settings → API Keys)
//   node build-from-fibery.mjs                 build everything in "Ready for build"
//   node build-from-fibery.mjs --dry-run       render the sites only; change nothing in Fibery
//
// Writes sites/<slug>/index.html next to the sites from build-sites.mjs (it never wipes sites/).
// A business that already has a Site is rebuilt in place at the same URL.

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, slugify } from '../templates/lawn/template.mjs';

const WORKSPACE = process.env.FIBERY_WORKSPACE || 'seven-acre';
const TOKEN = process.env.FIBERY_TOKEN;
const dryRun = process.argv.includes('--dry-run');

// Fibery IDs (Sales space). States and selects are matched by ID so renaming them in Fibery is safe.
const ID = {
  readyForBuild: 'a868d029-bb83-4128-80d2-315377951d06',
  siteBuilt: '0c31ae0f-a28e-4fe7-80bf-6df1d9944f33',
  style: { modern: 'f81924f4-127d-44e3-91cb-ea87181a6d46', classy: 'bcf31c35-9d3a-4ff2-8f4c-58306884f745', simple: '26735e24-6401-4aa8-96d4-2ef20588bc16' },
  mode: { light: '6d1f19f1-a1ad-4a3a-a5f7-512e8c5222d2', dark: '41f7b4eb-f515-47e7-bc16-afccc37b217d' },
  preview: 'b462a668-6e38-4c02-98df-9508bc9c1fba',
};

const here = dirname(fileURLToPath(import.meta.url));
process.chdir(here);
if (!TOKEN) fail('Set FIBERY_TOKEN first (Fibery → Settings → API Keys). --dry-run still needs it to read Fibery.');

const config = JSON.parse(await readFile('config.json', 'utf8'));
const domain = config.siteDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');

const businesses = await fibery('fibery.entity/query', {
  query: {
    'q/from': 'Sales/Business',
    'q/select': {
      id: 'fibery/id', name: 'Sales/Name', placeId: 'Sales/Google Place ID', phone: 'Sales/Phone',
      email: 'Sales/Email', street: 'Sales/Street Address', city: 'Sales/City', zip: 'Sales/Zip',
      state: ['Sales/US State', 'enum/name'], rating: 'Sales/Google Rating', reviewCount: 'Sales/Review Count',
      mapsUrl: 'Sales/Google Maps', socialUrl: 'Sales/Social URL', services: 'Sales/Services',
      owner: ['Sales/Primary Contact', 'Sales/Name'], ownerFirst: ['Sales/Primary Contact', 'Sales/First Name'],
      siteId: ['Sales/Site', 'fibery/id'], siteUrl: ['Sales/Site', 'Sales/Site URL'],
    },
    'q/where': ['=', ['workflow/state', 'fibery/id'], '$state'],
    'q/limit': 'q/no-limit',
  },
  params: { $state: ID.readyForBuild },
});

if (!businesses.length) { console.log('Nothing in "Ready for build".'); process.exit(0); }

const taken = new Set(await readdir('sites').catch(() => []));
const today = new Date().toISOString().slice(0, 10);

for (const b of businesses) {
  // Reuse the slug of an existing Site so a rebuild keeps the same URL.
  let slug = b.siteUrl ? new URL(b.siteUrl).hostname.split('.')[0] : null;
  if (!slug) {
    slug = slugify(b.name);
    if (taken.has(slug)) slug = slugify(`${b.name} ${b.city || ''}`);
    for (let n = 2; taken.has(slug); n++) slug = `${slugify(b.name)}-${n}`;
  }
  taken.add(slug);

  const lead = toLead(b, slug);
  const url = `https://${slug}.${domain}`;
  await mkdir(`sites/${slug}`, { recursive: true });
  await writeFile(`sites/${slug}/index.html`, render(lead, config, { slug }));

  if (dryRun) { console.log(`[dry run] ${b.name} → sites/${slug}/index.html (${lead.services ? lead.services.length + ' services' : 'default services'})`); continue; }

  const site = {
    'Sales/Site URL': url,
    'Sales/Built On': today,
    'Sales/Outreach Text': textFor(lead, url),
  };
  if (b.siteId) {
    await fibery('fibery.entity/update', { type: 'Sales/Site', entity: { 'fibery/id': b.siteId, ...site } });
  } else {
    const created = await fibery('fibery.entity/create', {
      type: 'Sales/Site',
      entity: {
        'Sales/Name': b.name,
        'Sales/Business': { 'fibery/id': b.id },
        'Sales/Style': { 'fibery/id': ID.style.modern },
        'Sales/Color Mode': { 'fibery/id': ID.mode.light },
        'Sales/Mode': { 'fibery/id': ID.preview },
        ...site,
      },
    });
    await fibery('fibery.entity/update', { type: 'Sales/Business', entity: { 'fibery/id': b.id, 'Sales/Site': { 'fibery/id': created['fibery/id'] } } });
  }
  await fibery('fibery.entity/update', {
    type: 'Sales/Business',
    entity: { 'fibery/id': b.id, 'workflow/state': { 'fibery/id': ID.siteBuilt }, 'Sales/Stage Changed On': today },
  });
  console.log(`${b.name} → ${url}`);
}

console.log(dryRun ? 'Dry run: Fibery not changed.' : `Built ${businesses.length}. Deploy the sites/ folder to put them online.`);

// Fibery business row → the lead object template.mjs renders.
function toLead(b, slug) {
  const st = STATES[b.state] || b.state || '';
  return {
    id: b.placeId || b.id,
    slug,
    name: b.name,
    owner: b.ownerFirst || b.owner || '', // the pitch greets them by first name ("Josh", not "Joshua (Josh) Swan")
    phone: b.phone || '',
    email: b.email || '',
    city: b.city || '',
    state: st,
    address: [b.street, b.city, [st, b.zip].filter(Boolean).join(' ')].filter(Boolean).join(', '),
    rating: Number(b.rating) || 0,
    reviewCount: b.reviewCount || 0,
    mapsUrl: b.mapsUrl || '',
    socialUrl: b.socialUrl || '',
    services: toServices(b.services),
  };
}

// "lawn mowing, mulching, snow removal" → the template's service cards
// ([name, description, season tag, photo, instant quote?]). Services we can't match get a generic
// card; with fewer than 4 we top up from the standard lawn services. Nothing listed → template default.
function toServices(text) {
  const names = String(text || '').split(/,|;|\n/).map(s => s.trim()).filter(Boolean);
  if (!names.length) return undefined;
  const cards = [];
  const seen = new Set();
  for (const raw of names) {
    const hit = CATALOG.find(c => c.match.test(raw));
    const key = hit ? hit.card[0] : raw.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cards.push(hit ? hit.card : [cap(raw), `Professional ${raw.toLowerCase()} for homes and businesses.`, 'Ask for a quote', 33350017, false]);
  }
  // Only top up lawn businesses; a pest-control or tree company shouldn't suddenly list mowing.
  const lawnBusiness = cards.some(c => FILLERS.includes(c) || c[0] === 'Lawn maintenance' || c[0] === 'Landscaping');
  for (const card of lawnBusiness ? FILLERS : []) {
    if (cards.length >= 4) break;
    if (!seen.has(card[0])) { seen.add(card[0]); cards.push(card); }
  }
  return cards.slice(0, 8);
}

function textFor(lead, url) {
  const first = (lead.owner || '').trim().split(/\s+/)[0];
  return (first ? config.outreachText : config.outreachTextNoName)
    .replace('{first}', first).replace('{business}', lead.name).replace('{url}', url);
}

async function fibery(command, args) {
  if (!TOKEN) fail('FIBERY_TOKEN is not set.');
  const res = await fetch(`https://${WORKSPACE}.fibery.io/api/commands`, {
    method: 'POST',
    headers: { Authorization: `Token ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([{ command, args }]),
  });
  if (!res.ok) fail(`Fibery ${command} failed: HTTP ${res.status} ${await res.text()}`);
  const [out] = await res.json();
  if (!out.success) fail(`Fibery ${command} failed: ${JSON.stringify(out.result)}`);
  return out.result;
}

function fail(msg) { console.error(msg); process.exit(1); }
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// Photo IDs are the Pexels stock already used by template.mjs. Order matters: the first match wins,
// so specific services ("tree trimming", "sprinkler installation") come before generic ones.
const CARD = {
  mowing: ['Lawn mowing', 'Weekly or every-other-week cuts, edged, trimmed and blown clean.', 'Spring – Fall', 6728930, true],
  edging: ['Edging & trimming', 'Crisp lines on driveways, walks and beds that sharpen the whole property.', 'Every visit', 4162016, true],
  hedges: ['Hedge & shrub care', 'Shaped, healthy hedges and shrubs without the overgrown look.', 'Seasonal', 24595772, false],
  mulch: ['Mulch & bed care', 'Fresh mulch, weeded beds and tidy borders that hold up all season.', 'Spring', 9890699, false],
  cleanups: ['Seasonal cleanups', 'Leaves, branches and storm debris cleared and hauled away.', 'Spring & Fall', 33356825, false],
  installs: ['Landscape installs', 'New plants, sod and borders to refresh a tired yard.', 'Custom projects', 33350017, false],
};
const CATALOG = [
  { match: /snow|ice\b|plow/i, card: ['Snow removal', 'Plowing and shoveling so your driveway and walks stay clear all winter.', 'Winter', 18559625, false] },
  { match: /pressure|power ?wash/i, card: ['Pressure washing', 'Driveways, walks and siding washed back to like-new.', 'Year-round', 18559625, false] },
  { match: /fenc|gate/i, card: ['Fencing', 'New fences and gate repairs that look sharp and hold up.', 'Custom projects', 18559625, false] },
  { match: /sprinkler|irrigat|drip/i, card: ['Sprinkler & irrigation', 'Installs, repairs and seasonal start-ups so every zone waters right.', 'Spring – Fall', 6728925, false] },
  { match: /tree|arbor|stump|limb/i, card: ['Tree care', 'Pruning, removals and stump grinding done safely and cleaned up after.', 'Year-round', 20727438, false] },
  { match: /hedge|shrub|bush/i, card: CARD.hedges },
  { match: /hardscap|patio|paver|retaining|wall|stone|masonry|fire ?pit|walkway|boulder|rock|gravel|outdoor kitchen|deck/i, card: ['Hardscaping', 'Patios, pavers and retaining walls built to last.', 'Custom projects', 18559625, false] },
  { match: /aerat|overseed|seed|dethatch/i, card: ['Aeration & overseeding', 'Loosened soil and fresh seed for a thicker, healthier lawn.', 'Fall', 8469933, false] },
  { match: /fertili|weed|turf|treatment|pest|insect|mosquito|fungi|disease|grub|\bants?\b|flea|tick/i, card: ['Lawn treatments', 'Fertilization and weed control that keep turf thick, green and healthy.', 'Spring – Fall', 6728925, false] },
  { match: /mulch|\bbeds?\b/i, card: CARD.mulch },
  { match: /clean ?up|leaf|leaves|debris|haul|brush|clearing|junk/i, card: CARD.cleanups },
  { match: /mow|\bcuts?\b/i, card: CARD.mowing },
  { match: /\bedg|trim/i, card: CARD.edging },
  { match: /install|design|plant|sod|garden|renovat|artificial|grass/i, card: CARD.installs },
  { match: /lawn (care|maint|service)|maintenance/i, card: ['Lawn maintenance', 'Regular mowing, edging and upkeep that keeps your yard looking its best.', 'Spring – Fall', 6728930, true] },
];
// Top-up cards when a business lists fewer than 4 services, in the template's usual order.
const FILLERS = [CARD.mowing, CARD.edging, CARD.hedges, CARD.mulch, CARD.cleanups, CARD.installs];

const STATES = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA', Colorado: 'CO', Connecticut: 'CT',
  Delaware: 'DE', 'District of Columbia': 'DC', Florida: 'FL', Georgia: 'GA', Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL',
  Indiana: 'IN', Iowa: 'IA', Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD',
  Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS', Missouri: 'MO', Montana: 'MT',
  Nebraska: 'NE', Nevada: 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', Ohio: 'OH', Oklahoma: 'OK', Oregon: 'OR', Pennsylvania: 'PA',
  'Rhode Island': 'RI', 'South Carolina': 'SC', 'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT',
  Vermont: 'VT', Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV', Wisconsin: 'WI', Wyoming: 'WY',
};
