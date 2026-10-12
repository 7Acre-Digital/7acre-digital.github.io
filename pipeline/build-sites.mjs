// Generate a pitch site for every qualified lead, ready to host at <slug>.<siteDomain>.
//
// Usage:
//   node build-sites.mjs                          (uses data/leads.json from find-leads.mjs)
//   node build-sites.mjs data/sample-leads.json
//   node build-sites.mjs crm-export.csv           (CSV/Google Sheet export, see README for columns)
//
// Writes, per lead:
//   sites/<slug>/index.html       their site (served at https://<slug>.<siteDomain>)
// plus sites/index.html (internal list), sites/_redirects + sites/vercel.json (subdomain routing)
// and data/outreach.csv (with the text message to send each owner).

import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, slugify } from '../templates/lawn/template.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const input = resolve(process.argv[2] || resolve(here, 'data/leads.json'));
process.chdir(here);

const config = JSON.parse(await readFile('config.json', 'utf8'));
const raw = (await readFile(input, 'utf8')).replace(/^﻿/, '');
const leads = (input.endsWith('.csv') ? fromCsv(raw) : JSON.parse(raw)).filter(l => l.qualified !== false && l.name);
const domain = config.siteDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
const siteUrl = slug => `https://${slug}.${domain}`;

// The first-touch text, e.g. "Hey Marcus, you using anything like this? https://…"
function textFor(lead, url) {
  const first = (lead.owner || '').trim().split(/\s+/)[0];
  return (first ? config.outreachText : config.outreachTextNoName)
    .replace('{first}', first).replace('{business}', lead.name).replace('{url}', url);
}

await rm('sites', { recursive: true, force: true });
await mkdir('sites', { recursive: true });

const used = new Set();
const built = [];
for (const lead of leads) {
  let slug = slugify(lead.slug || lead.name);
  if (used.has(slug)) slug = slugify(`${lead.name} ${lead.city}`);
  for (let n = 2; used.has(slug); n++) slug = `${slugify(lead.name)}-${n}`;
  used.add(slug);
  lead.id ||= slug;

  await mkdir(`sites/${slug}`, { recursive: true });
  await writeFile(`sites/${slug}/index.html`, render(lead, config, { slug }));
  const url = siteUrl(slug);
  built.push({ ...lead, slug, siteUrl: url, textMessage: textFor(lead, url) });
}

// Internal index of everything built (not for clients).
const e = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
await writeFile('sites/index.html', `<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><title>Previews</title>
<style>body{font:15px/1.5 system-ui;max-width:1000px;margin:40px auto;padding:0 16px}table{border-collapse:collapse;width:100%}td,th{text-align:left;padding:8px;border-bottom:1px solid #ddd;vertical-align:top}</style>
<h1>${built.length} businesses</h1>
<table><tr><th>Business</th><th>City</th><th>Rating</th><th>Phone</th><th>Text to send</th></tr>
${built.map(l => `<tr><td><a href="${l.slug}/">${e(l.name)}</a></td><td>${e(l.city)}</td><td>${l.rating ? `${l.rating} (${l.reviewCount})` : ''}</td><td>${e(l.phone)}</td><td>${e(l.textMessage)}</td></tr>`).join('\n')}
</table>`);

// Vercel: route https://<slug>.<domain>/… to /<slug>/… (the project needs a *.<domain> wildcard domain).
await writeFile('sites/vercel.json', JSON.stringify({
  cleanUrls: true,
  rewrites: [{
    source: '/:path*',
    has: [{ type: 'host', value: `(?<slug>[a-z0-9-]+)\\.${domain.replace(/\./g, '\\.')}` }],
    destination: '/:slug/:path*',
  }],
}, null, 2));

// Netlify: same routing via host-specific rewrites (needs <slug>.<domain> or *.<domain> as domain aliases).
await writeFile('sites/_redirects', built.map(l => `https://${l.slug}.${domain}/*  /${l.slug}/:splat  200!`).join('\n') + '\n');

const cols = ['name', 'owner', 'phone', 'email', 'city', 'state', 'rating', 'reviewCount', 'websiteStatus', 'socialUrl', 'mapsUrl', 'siteUrl', 'textMessage', 'status', 'notes'];
const cell = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
await mkdir('data', { recursive: true });
await writeFile('data/outreach.csv', [cols.join(','), ...built.map(r => cols.map(c => cell(r[c])).join(','))].join('\n'));

console.log(`Built ${built.length} sites → sites/  ·  outreach list with texts → data/outreach.csv`);

// CRM sheet export → lead objects. Header names are matched loosely ("Review Count" = reviewCount).
function fromCsv(text) {
  const rows = parseCsv(text);
  const keys = rows.shift().map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
  const FIELD = { name: 'name', business: 'name', businessname: 'name', owner: 'owner', ownername: 'owner', phone: 'phone', email: 'email',
    address: 'address', city: 'city', state: 'state', rating: 'rating', starrating: 'rating',
    reviews: 'reviewCount', reviewcount: 'reviewCount', numberofreviews: 'reviewCount',
    mapsurl: 'mapsUrl', googlemaps: 'mapsUrl', socials: 'socialUrl', socialurl: 'socialUrl', facebook: 'socialUrl', instagram: 'socialUrl',
    style: 'style', mode: 'mode', status: 'status', notes: 'notes', id: 'id', placeid: 'id', slug: 'slug' };
  return rows.filter(r => r.some(Boolean)).map(r => {
    const lead = {};
    keys.forEach((k, i) => { const f = FIELD[k]; if (f && r[i]?.trim()) lead[f] = r[i].trim(); });
    if (lead.rating) lead.rating = parseFloat(lead.rating);
    if (lead.reviewCount) lead.reviewCount = parseInt(lead.reviewCount, 10);
    return lead;
  });
}

function parseCsv(text) {
  const rows = [[]];
  let cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { rows.at(-1).push(cur); cur = ''; }
    else if (c === '\n') { rows.at(-1).push(cur.replace(/\r$/, '')); cur = ''; rows.push([]); }
    else cur += c;
  }
  rows.at(-1).push(cur);
  return rows;
}
