// POST https://api.7acredigital.com/signup
// Called by the "Get started" form on 7acredigital.com. Creates a Business in Fibery
// (Sales space, Source: Inbound, state: New) and returns its URL so the form can include it
// in the email notification it sends next.
//
// Body: { biz, trade, phone, page }      Response: { ok: true, url }  or  { ok: false, error }
// Secret: FIBERY_TOKEN (npx wrangler secret put FIBERY_TOKEN)

const WORKSPACE = 'seven-acre';
const ALLOWED_ORIGINS = ['https://7acredigital.com', 'https://www.7acredigital.com'];

// Fibery enum IDs (Sales/Business). Matched by ID so renaming them in Fibery is safe.
const SOURCE_INBOUND = '9e523c63-820d-4eb8-bf3b-879fdfc8d6ff';
const TRADE = {
  'lawn care': '0e93916e-be51-4841-984f-4c100271aa84',
  'landscaping': 'ff28cbee-4b11-4ca6-8fc6-883ccbfa89b0',
  'handyman': 'f10d2ac9-5f28-40bf-971d-599f78db6c77',
  'hvac': '62c5920b-623c-46b4-87b1-f8202caea91f',
  'plumbing': 'e22cb7ed-7c25-4db9-a6da-bbc21673fe3f',
  'electrical': 'b633559b-3f06-4199-9b28-d6e5623a6fb6',
  'masonry & concrete': 'feba48e8-7d37-45fb-aa36-18d4cf41d383',
  'appliance repair': '046b71ff-14da-4cdb-a012-102c6c0605c7',
  'cleaning': 'bf116b23-b252-4927-bf75-a34ee7ed9ffb',
  'something else': '234511e7-858a-4398-bede-368c017f5ac1',
};

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const { pathname } = new URL(request.url);
    if (pathname !== '/signup' || request.method !== 'POST') return json({ ok: false, error: 'Not found' }, 404, cors);
    if (!cors['Access-Control-Allow-Origin']) return json({ ok: false, error: 'Forbidden' }, 403, cors);

    let body;
    try { body = await request.json(); } catch { return json({ ok: false, error: 'Invalid JSON' }, 400, cors); }
    const biz = clean(body.biz, 120);
    const phone = clean(body.phone, 40);
    const trade = TRADE[clean(body.trade, 40).toLowerCase()];
    if (!biz || phone.replace(/\D/g, '').length < 10) return json({ ok: false, error: 'Business name and a 10-digit mobile are required' }, 400, cors);

    try {
      const entity = await fibery(env.FIBERY_TOKEN, 'fibery.entity/create', {
        type: 'Sales/Business',
        entity: {
          'Sales/Name': biz,
          'Sales/Phone': phone,
          'Sales/Source': { 'fibery/id': SOURCE_INBOUND },
          ...(trade && { 'Sales/Trade': { 'fibery/id': trade } }),
          'Sales/Summary': `Signed up on 7acredigital.com${body.page ? ` (${clean(body.page, 200)})` : ''}`,
        },
      });
      const url = `https://${WORKSPACE}.fibery.io/Sales/Business/${entity['fibery/public-id']}`;
      return json({ ok: true, url }, 200, cors);
    } catch (err) {
      console.error(err);
      return json({ ok: false, error: 'Could not save to the CRM' }, 502, cors);
    }
  },
};

async function fibery(token, command, args) {
  if (!token) throw new Error('FIBERY_TOKEN secret is not set');
  const res = await fetch(`https://${WORKSPACE}.fibery.io/api/commands`, {
    method: 'POST',
    headers: { Authorization: `Token ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([{ command, args }]),
  });
  if (!res.ok) throw new Error(`Fibery ${command}: HTTP ${res.status} ${await res.text()}`);
  const [out] = await res.json();
  if (!out.success) throw new Error(`Fibery ${command}: ${JSON.stringify(out.result)}`);
  return out.result;
}

function corsHeaders(request) {
  const origin = request.headers.get('Origin');
  return ALLOWED_ORIGINS.includes(origin)
    ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin' }
    : { Vary: 'Origin' };
}

const clean = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const json = (data, status, headers) => new Response(JSON.stringify(data), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
