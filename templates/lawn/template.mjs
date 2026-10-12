// Lawn care / landscaping site template. render(lead, config) -> full HTML string.
// Three styles (modern, classy, simple) x two modes (light, dark), switched via <html data-style data-mode>.
// Inside the setup wizard the page is embedded with ?embed and reconfigured live over postMessage.

const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const slugify = s => String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-').slice(0, 48);

export const STYLES = ['modern', 'classy', 'simple'];

const FONTS = {
  modern: 'family=Montserrat:wght@400;500;600;700&family=Playfair+Display:ital,wght@1,500;1,600',
  classy: 'family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=Jost:wght@400;500;600',
  simple: 'family=Inter:wght@400;500;600;700',
};

// Free-license stock (Pexels) until the business sends its own photos via lead.photos.
const img = (id, w = 900) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
const STOCK = { hero: 6728925, about: 20727438, house: 18559625, stripes: 8469933 };

// [name, description, season tag, photo id, opens instant quote?]
const SERVICES = [
  ['Lawn mowing', 'Weekly or every-other-week cuts, edged, trimmed and blown clean.', 'Spring – Fall', 6728930, true],
  ['Edging & trimming', 'Crisp lines on driveways, walks and beds that sharpen the whole property.', 'Every visit', 4162016, true],
  ['Hedge & shrub care', 'Shaped, healthy hedges and shrubs without the overgrown look.', 'Seasonal', 24595772, false],
  ['Mulch & bed care', 'Fresh mulch, weeded beds and tidy borders that hold up all season.', 'Spring', 9890699, false],
  ['Seasonal cleanups', 'Leaves, branches and storm debris cleared and hauled away.', 'Spring & Fall', 33356825, false],
  ['Landscape installs', 'New plants, sod and borders to refresh a tired yard.', 'Custom projects', 33350017, false],
];

const stars = n => '★★★★★'.slice(0, Math.round(n)) + '☆☆☆☆☆'.slice(0, 5 - Math.round(n));
const trim = (s, n) => (s.length > n ? s.slice(0, s.lastIndexOf(' ', n)) + '…' : s);

const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';
const phoneIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>';
const leafIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10z"/><path d="M2 21c0-3 1.9-5.4 5.1-6"/></svg>';
const shieldIcon = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3zm-1.2 14.2-3.5-3.5 1.4-1.4 2.1 2.1 4.9-4.9 1.4 1.4-6.3 6.3z"/></svg>';
const gBadge = '<span class="g" aria-hidden="true">G</span>';
const chev = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d === 'l' ? 'M15 18 9 12l6-6' : 'M9 18l6-6-6-6'}"/></svg>`;

export function render(lead, config, { slug = '' } = {}) {
  const style = STYLES.includes(lead.style) ? lead.style : 'modern';
  const mode = lead.mode === 'dark' ? 'dark' : 'light';
  const preview = config.preview !== false && lead.preview !== false;
  const fonts = preview ? STYLES : [style]; // previews can switch styles live, so load all fonts
  const photos = { ...Object.fromEntries(Object.entries(STOCK).map(([k, id]) => [k, img(id, k === 'hero' ? 1800 : 1000)])), ...lead.photos };
  const services = lead.services?.length ? lead.services : SERVICES;
  const city = lead.city || '';
  const area = city ? `${city}${lead.state ? ', ' + lead.state : ''}` : 'your area';
  const tel = (lead.phoneIntl || lead.phone || '').replace(/[^\d+]/g, '');
  const hasRating = lead.rating >= 4 && lead.reviewCount > 0;
  const reviews = (lead.reviews || []).filter(r => r.rating >= 4 && r.text.length > 40).slice(0, 3);
  const pricing = lead.pricing?.residential ? lead.pricing : config.pricing;
  const year = new Date().getFullYear();
  const ownerFirst = (lead.owner || '').trim().split(/\s+/)[0];
  const o = config.offer;
  const usd = n => '$' + Number(n).toLocaleString('en-US');

  // Preview sites double as the sales pitch: the owner books on their own site and gets the
  // real confirmation text + email (demoEndpoint). Live sites send bookings to formEndpoint.
  const quoteConfig = JSON.stringify({
    business: lead.name, placeId: lead.id, slug, city: area, phone: lead.phone || '', pricing,
    bookingEndpoint: (preview ? config.demoEndpoint : config.formEndpoint) || '',
    lotLookupEndpoint: config.lotLookupEndpoint || '', trackEndpoint: preview ? config.trackEndpoint || '' : '',
    pitch: preview, ownerFirst, offer: o, checkoutUrl: o.checkoutUrl || '',
  }).replace(/</g, '\\u003c');

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'LocalBusiness', name: lead.name,
    telephone: lead.phone || undefined, address: lead.address || undefined, areaServed: area,
    description: `Lawn care and landscaping in ${area}.`,
  }).replace(/</g, '\\u003c');

  const addrForm = (id, btn = 'Get my price') => `<form class="addr-form" aria-label="Instant quote">
          <label class="sr" for="${id}">Property address</label>
          <input id="${id}" name="address" autocomplete="street-address" placeholder="Enter your address" required>
          <button class="pbtn lime" type="submit"><span>${btn}</span><i>${arrow}</i></button>
        </form>`;

  return `<!doctype html>
<html lang="en" data-style="${style}" data-mode="${mode}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(lead.name)} | Lawn Care & Landscaping in ${esc(area)}</title>
<meta name="description" content="${esc(lead.name)} keeps lawns in ${esc(area)} mowed, trimmed and looking sharp. Get an instant price and book online.">
${preview ? '<meta name="robots" content="noindex">' : ''}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?${fonts.map(f => FONTS[f]).join('&')}&display=swap" rel="stylesheet">
<link rel="preload" as="image" href="${esc(photos.hero)}">
<script>(function(){var q=new URLSearchParams(location.search),h=document.documentElement;if(q.get('style'))h.dataset.style=q.get('style');if(q.get('mode'))h.dataset.mode=q.get('mode');if(q.has('embed'))h.classList.add('embed');})();</script>
<script type="application/ld+json">${jsonLd}</script>
<style>
/* ---------- style tokens ---------- */
:root{--max:1180px;--hero-mix:94%}
[data-style=modern]{
  --font-body:Montserrat,system-ui,sans-serif;--font-head:var(--font-body);--font-em:"Playfair Display",Georgia,serif;--em-style:italic;--em-w:500;--head-w:500;--head-ls:-.025em;
  --brand:#13291a;--brand-2:#2a5230;--accent:#c8ef7e;--accent-ink:#13291a;--accent-on-dark:#c8ef7e;
  --bg:#fff;--surface:#fff;--soft:#f2f5ee;--ink:#141a14;--muted:#5d655b;--line:#e4e8e0;
  --r:26px;--r-card:22px;--btn-r:999px;--icon-r:50%;--eyebrow-ls:.08em;
}
[data-style=modern][data-mode=dark]{--bg:#0c130e;--surface:#131d16;--soft:#101912;--ink:#eef3ea;--muted:#9eab9a;--line:#243229;--brand:#1b3a22;--brand-2:#b4e27a}
[data-style=classy]{
  --font-body:Jost,system-ui,sans-serif;--font-head:"Cormorant Garamond",Georgia,serif;--font-em:var(--font-head);--em-style:italic;--em-w:500;--head-w:600;--head-ls:-.005em;
  --brand:#1d2a22;--brand-2:#8a6d3b;--accent:#c9a96a;--accent-ink:#1d2a22;--accent-on-dark:#e2c88f;
  --bg:#faf7f1;--surface:#fffdf9;--soft:#f2ede3;--ink:#1d2420;--muted:#6b6a60;--line:#e5ddcd;
  --r:8px;--r-card:6px;--btn-r:3px;--icon-r:2px;--eyebrow-ls:.22em;
}
[data-style=classy][data-mode=dark]{--bg:#111511;--surface:#181e19;--soft:#151a16;--ink:#f1ece2;--muted:#aaa597;--line:#2d332c;--brand:#24342a;--brand-2:#d9bd85}
[data-style=simple]{
  --font-body:Inter,system-ui,sans-serif;--font-head:var(--font-body);--font-em:var(--font-body);--em-style:normal;--em-w:700;--head-w:700;--head-ls:-.035em;
  --brand:#14532d;--brand-2:#15803d;--accent:#22c55e;--accent-ink:#052e16;--accent-on-dark:#86efac;
  --bg:#fff;--surface:#fff;--soft:#f4f6f4;--ink:#111827;--muted:#4b5563;--line:#e5e7eb;
  --r:16px;--r-card:14px;--btn-r:10px;--icon-r:7px;--eyebrow-ls:.06em;
}
[data-style=simple][data-mode=dark]{--bg:#0a0f0c;--surface:#111814;--soft:#0e1410;--ink:#f3f4f6;--muted:#9ca3af;--line:#1f2a24;--brand:#14532d;--brand-2:#4ade80}

/* ---------- base ---------- */
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:var(--font-body);color:var(--ink);background:var(--bg);line-height:1.55;-webkit-font-smoothing:antialiased;overflow-x:hidden;transition:background .3s,color .3s}
h1,h2,h3{font-family:var(--font-head);font-weight:var(--head-w);letter-spacing:var(--head-ls);line-height:1.08}
em{font-family:var(--font-em);font-style:var(--em-style);font-weight:var(--em-w);letter-spacing:-.01em}
a{color:inherit;text-decoration:none}
img{display:block;max-width:100%}
.wrap{max-width:var(--max);margin:0 auto;padding:0 20px}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
svg{width:18px;height:18px;flex:none}

/* pill buttons with arrow bubble */
.pbtn{display:inline-flex;align-items:center;gap:12px;padding:6px 6px 6px 20px;border-radius:var(--btn-r);font:600 14.5px/1 var(--font-body);border:0;cursor:pointer;white-space:nowrap;transition:transform .2s ease,box-shadow .2s ease}
.pbtn i{width:36px;height:36px;border-radius:var(--icon-r);display:grid;place-items:center;transition:transform .25s ease}
.pbtn:hover i{transform:rotate(45deg)}
.pbtn:active{transform:scale(.98)}
.pbtn.lime{background:var(--accent);color:var(--accent-ink)}
.pbtn.lime i{background:var(--accent-ink);color:var(--accent)}
.pbtn.dark{background:var(--brand);color:#fff}
.pbtn.dark i{background:var(--accent);color:var(--accent-ink)}
.pbtn.white{background:#fff;color:#141a14}
.pbtn.white i{background:var(--brand);color:#fff}
[data-style=classy] .pbtn{text-transform:uppercase;letter-spacing:.12em;font-size:12px;font-weight:500}
.ulink{display:inline-flex;align-items:center;gap:4px;font-weight:600;font-size:14.5px;text-decoration:underline;text-underline-offset:4px}
.ulink svg{width:14px;height:14px}
.eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:600;letter-spacing:var(--eyebrow-ls);text-transform:uppercase;margin-bottom:16px}
.eyebrow::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--brand-2)}
[data-style=classy] .eyebrow::before{width:28px;height:1px;border-radius:0}
h2 em{color:var(--brand-2)}


/* hero card */
.hero{position:relative;margin:12px;border-radius:var(--r);overflow:hidden;color:#fff;background:var(--brand);min-height:min(820px,calc(100svh - 24px))}
[data-style=classy] .hero{margin:0;border-radius:0}
.hero>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:60% 50%}
.hero::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,color-mix(in srgb,var(--brand) 94%,transparent) 0%,color-mix(in srgb,var(--brand) 78%,transparent) 55%,color-mix(in srgb,var(--brand) 55%,transparent) 100%)}
.hero>*:not(img){position:relative;z-index:1}

.nav{position:absolute!important;top:16px;left:16px;right:16px;z-index:5!important;display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--surface);color:var(--ink);border-radius:calc(var(--r) * .7);padding:8px 8px 8px 14px;box-shadow:0 8px 30px rgba(0,0,0,.12)}
[data-style=classy] .nav{background:transparent;color:#fff;box-shadow:none;border-bottom:1px solid rgba(255,255,255,.25);border-radius:0;padding:10px 0;left:24px;right:24px}
.brand{display:flex;align-items:center;gap:10px;font-family:var(--font-head);font-weight:700;font-size:16px;letter-spacing:-.02em;line-height:1.1}
[data-style=classy] .brand{font-size:22px;font-weight:600;letter-spacing:0}
.brand-mark{width:38px;height:38px;border-radius:calc(var(--icon-r) * 2.2);background:var(--brand);color:var(--accent-on-dark);display:grid;place-items:center}
[data-style=classy] .brand-mark{border-radius:50%;background:transparent;border:1px solid var(--accent-on-dark)}
[data-style=simple] .brand-mark{border-radius:10px}
.links{display:none;gap:2px;font-size:13.5px;font-weight:500}
.links a{padding:8px 14px;border-radius:var(--btn-r)}
.links a:hover{background:var(--soft)}
.links a.on{background:var(--accent);color:var(--accent-ink);font-weight:600}
[data-style=classy] .links a:hover{background:rgba(255,255,255,.1)}
[data-style=classy] .links a.on{background:none;color:var(--accent-on-dark)}
.nav-right{display:flex;align-items:center;gap:14px}
.callnow{display:flex;align-items:center;gap:10px;font-size:12px;line-height:1.3;color:var(--muted)}
[data-style=classy] .callnow{color:rgba(255,255,255,.75)}
.callnow b{display:block;color:var(--ink);font-size:14px}
[data-style=classy] .callnow b{color:#fff}
.callnow .ic{width:38px;height:38px;border-radius:var(--icon-r);background:var(--accent);color:var(--accent-ink);display:grid;place-items:center}
[data-style=classy] .callnow .ic{border-radius:50%}
.callnow .txt{display:none}

.hero-body{padding:132px 22px 28px;max-width:var(--max);margin:0 auto;display:grid;gap:28px;min-height:inherit;align-content:end}
.badge{display:inline-flex;align-items:center;gap:10px;font-size:13px;margin-bottom:18px}
.g{width:30px;height:30px;border-radius:50%;background:#fff;color:#4285f4;font:700 16px/30px Montserrat,Inter,sans-serif;text-align:center;flex:none}
.badge .stars{color:var(--accent-on-dark);letter-spacing:1px}
.badge small{display:block;opacity:.8;font-size:12px}
.tags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:18px}
.tags span{font-size:12px;font-weight:500;padding:5px 12px;border-radius:var(--btn-r);border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.06)}
.hero h1{font-size:clamp(40px,6.4vw,76px);max-width:12ch;margin-bottom:18px}
[data-style=classy] .hero h1{font-size:clamp(46px,7vw,88px);font-weight:500}
.hero h1 em{color:var(--accent-on-dark)}
.hero .lead{font-size:clamp(15.5px,1.6vw,17.5px);max-width:46ch;color:rgba(255,255,255,.85);margin-bottom:26px}
.addr-form{display:flex;align-items:center;gap:6px;background:var(--surface);border-radius:var(--btn-r);padding:6px;max-width:540px;box-shadow:0 12px 40px rgba(0,0,0,.25)}
.addr-form input{flex:1;min-width:0;border:0;outline:0;font:500 16px var(--font-body);color:var(--ink);padding:0 4px 0 18px;background:none}
.addr-form input::placeholder{color:var(--muted)}
.addr-form:focus-within{box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 60%,transparent),0 12px 40px rgba(0,0,0,.25)}
.hero-alt{margin-top:16px;display:flex;flex-wrap:wrap;gap:6px 18px;align-items:center;font-size:13.5px;color:rgba(255,255,255,.8)}
.hero-alt .ulink{color:#fff}

.hero-side{display:grid;gap:14px;justify-items:start}
.assure{display:flex;gap:10px;font-size:12.5px;line-height:1.5;color:rgba(255,255,255,.85)}
.assure svg{color:var(--accent-on-dark);width:22px;height:22px}
.glass{text-align:left;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-radius:calc(var(--r-card) * .9);padding:12px;display:flex;gap:14px;align-items:stretch;max-width:420px}
[data-style=simple] .glass{backdrop-filter:none;background:rgba(0,0,0,.4);border-color:rgba(255,255,255,.12)}
.glass .big{font-family:var(--font-head);font-size:34px;font-weight:600;letter-spacing:-.03em;line-height:1}
.glass .meta{font-size:12px;opacity:.85;margin-top:6px}
.glass .q{font-size:13px;line-height:1.5;margin-top:10px}
.glass .txt{padding:6px 4px 6px 6px;display:flex;flex-direction:column}
.glass img{width:120px;border-radius:calc(var(--r-card) * .65);object-fit:cover;flex:none}

/* marquee */
.strip{overflow:hidden;padding:26px 0;border-bottom:1px solid var(--line)}
.strip-track{display:flex;width:max-content;animation:scroll 40s linear infinite}
.strip-track span{display:flex;align-items:center;gap:28px;padding-right:28px;font-family:var(--font-head);font-size:clamp(18px,2.2vw,24px);font-weight:500;color:color-mix(in srgb,var(--muted) 75%,var(--bg));white-space:nowrap}
.strip-track span::after{content:"";width:10px;height:10px;border-radius:50%;background:var(--accent)}
[data-style=classy] .strip-track span{font-style:italic;font-size:clamp(20px,2.6vw,28px)}
@keyframes scroll{to{transform:translateX(-50%)}}

section.block{padding:clamp(72px,9vw,120px) 0}
.sec-head{display:grid;gap:18px;margin-bottom:44px;align-items:end}
.sec-head h2{font-size:clamp(34px,4.6vw,54px)}
[data-style=classy] .sec-head h2{font-size:clamp(40px,5.4vw,64px)}
.sec-head p{color:var(--muted);font-size:14.5px;max-width:34ch}
.sec-tools{display:flex;flex-direction:column;align-items:flex-start;gap:16px}

/* about */
.about{display:grid;gap:36px}
.about-img{border-radius:var(--r-card);overflow:hidden;aspect-ratio:4/3;max-width:420px}
.about-img img{width:100%;height:100%;object-fit:cover}
.about .say{font-size:clamp(21px,2.5vw,29px);line-height:1.42;letter-spacing:-.015em;font-weight:500;margin-bottom:28px}
[data-style=classy] .about .say{font-family:var(--font-head);font-size:clamp(25px,3vw,36px);line-height:1.3;letter-spacing:0}
.about .say em{color:var(--brand-2)}
.row-ctas{display:flex;flex-wrap:wrap;align-items:center;gap:22px}
.socials{display:flex;gap:10px;margin-top:14px;font-size:13px;font-weight:600}

/* service cards */
.rail{--pad:max(20px,calc((100vw - var(--max))/2 + 20px));display:flex;gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;padding:0 var(--pad) 8px;scroll-padding-inline:var(--pad);scrollbar-width:none}
.rail::-webkit-scrollbar{display:none}
.svc{position:relative;flex:0 0 min(300px,80vw);aspect-ratio:3/4;border-radius:var(--r-card);overflow:hidden;scroll-snap-align:start;color:#fff;display:flex;flex-direction:column;justify-content:flex-end;padding:20px}
.svc img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .6s ease}
.svc:hover img{transform:scale(1.05)}
.svc::before{content:"";position:absolute;inset:0;z-index:1;background:linear-gradient(0deg,color-mix(in srgb,var(--brand) 92%,transparent) 0%,color-mix(in srgb,var(--brand) 35%,transparent) 50%,transparent 75%)}
.svc>*:not(img){position:relative;z-index:2}
.svc .chip{position:absolute;top:16px;left:16px;font-size:11px;font-weight:500;padding:4px 10px;border-radius:var(--btn-r);background:rgba(0,0,0,.28);backdrop-filter:blur(6px)}
.svc h3{font-size:22px;font-weight:600;margin-bottom:8px}
[data-style=classy] .svc h3{font-size:28px}
.svc p{font-size:13.5px;opacity:.88;margin-bottom:18px}
.svc .pbtn{align-self:flex-start;padding:5px 5px 5px 16px;font-size:13px}
.svc .pbtn i{width:32px;height:32px}
.navbtns{display:flex;gap:8px}
.navbtns button{width:44px;height:44px;border-radius:var(--icon-r);border:1.5px solid var(--line);background:var(--surface);color:var(--ink);display:grid;place-items:center;cursor:pointer}
.navbtns button:last-child{background:var(--brand);border-color:var(--brand);color:var(--accent-on-dark)}

/* process bento */
.process{background:var(--soft)}
.bento{display:grid;gap:16px}
.tile{background:var(--surface);border-radius:var(--r-card);padding:24px;overflow:hidden;position:relative;display:flex;flex-direction:column}
[data-style=classy] .tile{border:1px solid var(--line)}
.tile .n{font-size:13px;color:var(--muted);font-weight:500;margin-bottom:10px}
.tile h3{font-size:22px;margin-bottom:8px}
[data-style=classy] .tile h3{font-size:28px}
.tile p{font-size:14px;color:var(--muted)}
.tile .pic{margin:22px -24px -24px;flex:1;min-height:200px}
.tile .pic img{width:100%;height:100%;object-fit:cover}
.mock{margin-top:22px;display:grid;gap:8px}
.mock-row{display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:600;padding:12px 14px;border-radius:calc(var(--r-card) * .55);border:1.5px solid var(--line)}
.mock-row.on{border-color:var(--brand-2);background:color-mix(in srgb,var(--accent) 22%,var(--surface))}
.mock-row small{color:var(--muted);font-weight:500}
.sms{margin-top:22px;display:grid;gap:8px;font-size:13px}
.sms div{padding:10px 14px;border-radius:16px 16px 16px 4px;background:var(--soft);max-width:88%}
.sms div.me{justify-self:end;border-radius:16px 16px 4px 16px;background:var(--brand);color:#fff}
.tile.dark{background:var(--brand);color:#fff;border:0}
.tile.dark p{color:rgba(255,255,255,.75)}
.tile.dark .n{color:var(--accent-on-dark)}
.invoice{margin-top:24px;background:#fff;color:#141a14;border-radius:calc(var(--r-card) * .75);padding:16px;max-width:300px;box-shadow:0 20px 40px rgba(0,0,0,.25);font-size:13px}
.invoice .top{display:flex;justify-content:space-between;font-weight:700;margin-bottom:12px}
.invoice .line{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed #e4e8e0}
.invoice .pay{margin-top:12px;background:var(--accent);color:var(--accent-ink);font-weight:700;text-align:center;padding:10px;border-radius:var(--btn-r)}

/* reviews */
.revs{display:grid;gap:16px}
.score{background:var(--brand);color:#fff;border-radius:var(--r-card);padding:28px;display:flex;flex-direction:column;justify-content:space-between;gap:24px}
.score .big{font-family:var(--font-head);font-size:64px;font-weight:600;letter-spacing:-.04em;line-height:1}
.score .stars{color:var(--accent-on-dark);font-size:20px;letter-spacing:2px}
.score .ulink{color:var(--accent-on-dark)}
.rev{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-card);padding:26px;display:flex;flex-direction:column;gap:16px}
.rev .stars{color:#e3a51c;letter-spacing:1px}
.rev blockquote{font-size:15px}
[data-style=classy] .rev blockquote{font-family:var(--font-head);font-size:20px;line-height:1.4}
.rev cite{margin-top:auto;font-style:normal;display:flex;align-items:center;gap:10px;font-weight:600;font-size:14px}
.rev cite .g{width:26px;height:26px;font-size:14px;line-height:26px;box-shadow:0 0 0 1px var(--line)}

/* contact */
.info{display:grid;gap:16px}
.card{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-card);padding:28px}
.card h3{font-size:24px;margin-bottom:16px}
[data-style=classy] .card h3{font-size:30px}
.hours{list-style:none;display:grid;gap:8px}
.hours li{display:flex;justify-content:space-between;gap:16px;padding-bottom:8px;border-bottom:1px dashed var(--line);font-size:14.5px}
.hours li span:first-child{font-weight:600}
.card p{color:var(--muted);margin-bottom:20px}

/* final cta */
.cta{position:relative;margin:0 12px 12px;border-radius:var(--r);overflow:hidden;color:#fff;text-align:center;padding:clamp(72px,10vw,120px) 20px}
[data-style=classy] .cta{margin:0;border-radius:0}
.cta>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.cta::after{content:"";position:absolute;inset:0;background:color-mix(in srgb,var(--brand) 80%,transparent)}
.cta>*:not(img){position:relative;z-index:1}
.cta h2{font-size:clamp(34px,5vw,60px);margin-bottom:14px}
.cta h2 em{color:var(--accent-on-dark)}
.cta p{color:rgba(255,255,255,.85);margin-bottom:28px}
.cta .addr-form{margin:0 auto}

footer{padding:28px 0 110px;font-size:13px;color:var(--muted)}
footer .wrap{display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px}
footer b{color:var(--ink)}

.mobile-bar{position:fixed;left:12px;right:12px;bottom:12px;z-index:20;display:grid;grid-template-columns:${tel ? 'auto 1fr' : '1fr'};gap:8px;padding:6px;background:rgba(19,26,19,.9);backdrop-filter:blur(10px);border-radius:calc(var(--btn-r) + 6px);box-shadow:0 10px 30px rgba(0,0,0,.3)}
.mobile-bar .call{display:flex;align-items:center;gap:8px;color:#fff;font-weight:600;font-size:14px;padding:0 16px}
.mobile-bar .pbtn{justify-content:space-between}

/* quote dialog */
.quote{border:0;border-radius:calc(var(--r) * .9);padding:0;width:min(520px,calc(100vw - 24px));max-height:calc(100svh - 24px);margin:auto;background:var(--surface);color:var(--ink);box-shadow:0 40px 80px rgba(0,0,0,.35)}
.quote::backdrop{background:rgba(10,20,12,.55);backdrop-filter:blur(4px)}
.quote[open]{animation:pop .28s cubic-bezier(.2,.9,.3,1.2)}
@keyframes pop{from{opacity:0;transform:translateY(12px) scale(.98)}}
.qbody{padding:28px;position:relative}
.x{position:absolute;top:16px;right:16px;width:36px;height:36px;border-radius:50%;border:0;background:var(--soft);cursor:pointer;font-size:20px;line-height:1;color:var(--ink)}
.qstep[hidden]{display:none}
.qstep h2{font-size:28px;margin-bottom:6px;padding-right:40px}
[data-style=classy] .qstep h2{font-size:34px}
.qstep h2:focus{outline:none}
.sub{color:var(--muted);font-size:14.5px;margin-bottom:18px}
.qpill{display:inline-block;font-size:12px;font-weight:600;background:var(--accent);color:var(--accent-ink);padding:5px 12px;border-radius:var(--btn-r);margin-bottom:14px}
.field{display:grid;gap:6px;margin-bottom:14px}
.field label{font-size:13px;font-weight:600}
.field input,.field select,.field textarea{font:inherit;font-size:16px;padding:12px 14px;border:1.5px solid var(--line);border-radius:calc(var(--r-card) * .55);background:var(--bg);color:var(--ink);width:100%}
.field input:focus,.field select:focus,.field textarea:focus{outline:none;border-color:var(--brand-2);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 45%,transparent)}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.qstep .pbtn{width:100%;justify-content:space-between;margin-top:4px}
.alt,.fine{font-size:13px;color:var(--muted);margin-top:14px}
.link{font:inherit;font-weight:600;color:var(--brand-2);background:none;border:0;padding:0;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.back{font:600 13px var(--font-body);color:var(--muted);background:none;border:0;margin-bottom:12px;cursor:pointer}
.back:hover{color:var(--ink)}
.form-msg{margin-top:14px;padding:12px 14px;border-radius:12px;background:var(--soft);font-size:14px;font-weight:600}
.lot{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 10px;padding:12px 14px;border-radius:calc(var(--r-card) * .55);background:var(--soft);margin-bottom:12px;font-size:13.5px}
.lot strong{font-size:17px}
.q-lot-note{color:var(--muted);font-size:12.5px;flex-basis:100%}
.sizes,.dates{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px}
.chip{font:600 13px var(--font-body);padding:8px 14px;border-radius:var(--btn-r);border:1.5px solid var(--line);background:var(--surface);color:var(--ink);cursor:pointer}
.chip[aria-checked="true"]{background:var(--brand);border-color:var(--brand);color:#fff}
.chip small{font-weight:500;opacity:.7}
.dates .chip{display:grid;text-align:center;line-height:1.3;padding:8px 10px;border-radius:calc(var(--r-card) * .55);min-width:60px}
.dates .chip small{font-size:11.5px}
.acres{display:flex;align-items:center;gap:10px;margin:-4px 0 16px;font-size:13.5px;font-weight:600}
.acres input{width:90px;font:inherit;font-size:16px;padding:8px 10px;border:1.5px solid var(--line);border-radius:calc(var(--r-card) * .5);background:var(--bg);color:var(--ink)}
.acres[hidden]{display:none}
.plans{display:grid;gap:8px;margin-bottom:16px}
.plan{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;text-align:left;font:inherit;color:var(--ink);padding:14px;border:1.5px solid var(--line);border-radius:calc(var(--r-card) * .65);background:var(--surface);cursor:pointer;position:relative}
.plan:hover{border-color:var(--muted)}
.plan[aria-checked="true"]{border-color:var(--brand-2);background:color-mix(in srgb,var(--accent) 18%,var(--surface))}
.plan .dot{width:18px;height:18px;border-radius:50%;border:2px solid var(--line)}
.plan[aria-checked="true"] .dot{border:6px solid var(--brand-2)}
.plan .name{font-weight:700;font-size:15px;display:block}
.plan .meta{font-size:12.5px;color:var(--muted)}
.plan .price{font-family:var(--font-head);font-weight:700;font-size:24px;letter-spacing:-.03em;text-align:right;line-height:1}
.plan .price small{display:block;font:500 11.5px var(--font-body);color:var(--muted);letter-spacing:0;margin-top:4px}
.plan .tag{position:absolute;top:-9px;right:12px;font-size:10.5px;font-weight:700;background:var(--accent);color:var(--accent-ink);padding:2px 8px;border-radius:var(--btn-r)}
.done{text-align:center;padding:8px 0}
.check{width:60px;height:60px;border-radius:50%;background:var(--accent);color:var(--accent-ink);display:grid;place-items:center;font-size:28px;font-weight:700;margin:0 auto 16px}
.done h2{padding:0}

/* ---------- pitch mode (preview sites sent to owners) ---------- */
.pitch{border:0;margin:auto;width:min(460px,calc(100vw - 24px));padding:30px 28px 22px;border-radius:calc(var(--r) * .9);background:var(--surface);color:var(--ink);text-align:center;box-shadow:0 40px 80px rgba(0,0,0,.35)}
.pitch::backdrop{background:rgba(10,20,12,.6);backdrop-filter:blur(5px)}
.pitch[open]{animation:pop .35s cubic-bezier(.2,.9,.3,1.2)}
.pitch h2{font-size:clamp(28px,4vw,34px);margin-bottom:14px}
.pitch h2 em{color:var(--brand-2)}
.pitch p{color:var(--muted);font-size:15.5px;margin-bottom:10px}
.pitch p:first-of-type{color:var(--ink);font-weight:600}
.pitch .pbtn{width:100%;justify-content:space-between;margin:14px 0 8px}
.pitch .link{color:var(--muted);font-size:14px}
.coach{display:inline-block;margin:0 auto 14px;background:var(--accent);color:var(--accent-ink);font-weight:700;font-size:14px;padding:8px 16px;border-radius:var(--btn-r);animation:bob 1.4s ease-in-out infinite}
.coach[hidden]{display:none}
@keyframes bob{50%{transform:translateY(-5px)}}
.spot{animation:glow 1.6s ease-out 2}
@keyframes glow{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--accent) 90%,transparent),0 12px 40px rgba(0,0,0,.25)}100%{box-shadow:0 0 0 22px transparent,0 12px 40px rgba(0,0,0,.25)}}
.owner-tip{font-size:13.5px;line-height:1.5;padding:12px 14px;margin-bottom:14px;border-radius:calc(var(--r-card) * .55);background:color-mix(in srgb,var(--accent) 28%,var(--surface));border:1.5px dashed color-mix(in srgb,var(--brand-2) 55%,transparent)}
.pitch-next{margin-top:18px;padding-top:20px;border-top:1px solid var(--line)}
.pitch-next .sent{font-size:14px;color:var(--muted);margin-bottom:16px}
.pitch-next .sent b{color:var(--ink)}
.pitch-next h3{font-size:22px;margin-bottom:16px}
.pitch-next .pbtn,.offer #o-buy{width:100%;justify-content:space-between}
.offer h2 em{color:var(--brand-2)}
.ocard{border:1.5px solid var(--line);border-radius:calc(var(--r-card) * .7);padding:16px;margin-bottom:10px}
.ocard.main{border-color:var(--brand-2)}
.ohead{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}
.ohead b{display:block;font-size:15.5px}
.ohead small{color:var(--muted);font-size:12.5px;line-height:1.4;display:block}
.oprice{text-align:right;white-space:nowrap;flex:none}
.oprice s{display:block;color:var(--muted);font-size:12.5px}
.oprice s small{display:inline;font-size:11px}
.oprice strong{display:block;font-family:var(--font-head);font-size:26px;letter-spacing:-.03em;line-height:1.1}
.pay{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:14px}
.pay button{font:inherit;font-size:12.5px;color:var(--muted);text-align:left;padding:10px 12px;border:1.5px solid var(--line);border-radius:calc(var(--r-card) * .5);background:var(--surface);cursor:pointer}
.pay button b{display:block;color:var(--ink);font-size:15px}
.pay button[aria-pressed=true]{border-color:var(--brand-2);background:color-mix(in srgb,var(--accent) 18%,var(--surface))}
.switch{display:flex;align-items:center;gap:10px;margin-top:14px;font-weight:600;font-size:14px;cursor:pointer}
.switch input{appearance:none;width:44px;height:26px;border-radius:999px;background:var(--line);position:relative;cursor:pointer;transition:background .2s;flex:none}
.switch input::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2);transition:transform .2s}
.switch input:checked{background:var(--brand-2)}
.switch input:checked::after{transform:translateX(18px)}
.osum{display:grid;gap:6px;font-size:14px;padding:14px 16px;border-radius:calc(var(--r-card) * .6);background:var(--soft);margin:6px 0 14px}
.osum div{display:flex;justify-content:space-between;gap:12px}
.osum .total{font-weight:700;font-size:16px;padding-top:8px;border-top:1px solid var(--line)}

@media (min-width:640px){
  .callnow .txt{display:block}
  .revs{grid-template-columns:1fr 1fr}
  .info{grid-template-columns:1fr 1fr}
  .bento{grid-template-columns:1fr 1fr}
  .bento .t1{grid-row:span 2}
  .bento .t4{grid-column:1/-1}
}
@media (min-width:900px){
  .hero::after{background:linear-gradient(90deg,color-mix(in srgb,var(--brand) 94%,transparent) 0%,color-mix(in srgb,var(--brand) 70%,transparent) 42%,color-mix(in srgb,var(--brand) 10%,transparent) 78%),linear-gradient(0deg,color-mix(in srgb,var(--brand) 85%,transparent),transparent 45%)}
  .hero-body{padding:150px 48px 44px;grid-template-columns:1fr auto;align-items:end}
  .hero-side{justify-items:end;text-align:right}
  .assure{flex-direction:row-reverse}
  .sec-head{grid-template-columns:1fr auto}
  .sec-tools{align-items:flex-end;text-align:right}
  .about{grid-template-columns:.8fr 1.2fr;gap:64px;align-items:start}
  .bento{grid-template-columns:repeat(3,1fr)}
  .bento .t4{grid-column:2/4;flex-direction:row;gap:24px;align-items:center}
  .bento .t4 .invoice{margin-top:0;flex:none;width:280px}
  .revs{grid-template-columns:${reviews.length ? `0.8fr repeat(${reviews.length},1fr)` : '1fr'}}
  .mobile-bar{display:none}
  footer{padding-bottom:28px}
}
@media (min-width:1080px){.links{display:flex}}
@media (max-width:520px){
  .addr-form{flex-direction:column;align-items:stretch;border-radius:calc(var(--r-card) * .9);padding:8px}
  .addr-form input{padding:12px 12px}
  .addr-form .pbtn{justify-content:space-between}
  .row2{grid-template-columns:1fr}
  .nav .pbtn span{display:none}
  .nav .pbtn{padding:5px}
  .glass img{width:96px}
  .plan .meta{display:none}
}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
</style>
</head>
<body>

<section class="hero" id="top">
  <img src="${esc(photos.hero)}" alt="" fetchpriority="high">
  <nav class="nav" aria-label="Main">
    <a class="brand" href="#top"><span class="brand-mark">${leafIcon}</span><span>${esc(lead.name)}</span></a>
    <div class="links"><a class="on" href="#top">Home</a><a href="#services">Services</a><a href="#process">How it works</a>${reviews.length ? '<a href="#reviews">Reviews</a>' : ''}<a href="#contact">Contact</a></div>
    <div class="nav-right">
      ${tel ? `<a class="callnow" href="tel:${esc(tel)}"><span class="ic">${phoneIcon}</span><span class="txt">Call now<b>${esc(lead.phone)}</b></span></a>` : ''}
      <button class="pbtn dark" type="button" data-open-quote><span>Instant price</span><i>${arrow}</i></button>
    </div>
  </nav>

  <div class="hero-body">
    <div>
      ${hasRating ? `<div class="badge">${gBadge}<div><span class="stars">${stars(lead.rating)}</span> <b>${lead.rating.toFixed(1)}</b><small>${lead.reviewCount} Google reviews</small></div></div>` : ''}
      <div class="tags"><span>Lawn Care</span><span>Landscaping</span><span>Seasonal Cleanups</span></div>
      <h1>${esc(city || 'Local')} lawn care, <em>done right.</em></h1>
      <p class="lead">Mowing, trimming, cleanups and landscaping for homes across ${esc(city || 'the area')}. Enter your address for an instant price and book your first mow in minutes.</p>
      ${addrForm('hero-address')}
      <div class="hero-alt">${tel ? `<span>Prefer to talk?</span><a class="ulink" href="tel:${esc(tel)}">Call ${esc(lead.phone)} ${arrow}</a>` : ''}</div>
    </div>

    <div class="hero-side">
      <div class="assure">${shieldIcon}<span>Instant online pricing<br>Text reminder before every visit<br>Pay by card from your phone</span></div>
      ${reviews[0] ? `<div class="glass">
        <div class="txt"><span class="big">${lead.rating.toFixed(1)}★</span><span class="meta">${lead.reviewCount} happy customers on Google</span><span class="q">“${esc(trim(reviews[0].text, 90))}”</span></div>
        <img src="${esc(photos.stripes)}" alt="">
      </div>` : `<div class="glass"><div class="txt"><span class="big">2 min</span><span class="meta">From address to booked</span><span class="q">See your price instantly. No waiting for a callback.</span></div><img src="${esc(photos.stripes)}" alt=""></div>`}
    </div>
  </div>
</section>

<div class="strip" aria-hidden="true"><div class="strip-track">${[0, 1].map(() => services.map(s => `<span>${esc(s[0])}</span>`).join('')).join('')}</div></div>

<section class="block" id="about">
  <div class="wrap about">
    <div>
      <span class="eyebrow">About ${esc(lead.name)}</span>
      <div class="about-img"><img src="${esc(photos.about)}" alt="Lawn being mowed" loading="lazy"></div>
      ${lead.socialUrl ? `<div class="socials"><a class="ulink" href="${esc(lead.socialUrl)}" target="_blank" rel="noopener">Follow us ${arrow}</a></div>` : ''}
    </div>
    <div>
      <p class="say">${esc(lead.name)} keeps lawns across ${esc(city || 'the area')} looking sharp, <em>week after week.</em> Get a price for your address in seconds, book online, and we'll take it from there, from the weekly cut to spring and fall cleanups.</p>
      <div class="row-ctas">
        <button class="pbtn lime" type="button" data-open-quote><span>Get my instant price</span><i>${arrow}</i></button>
        ${tel ? `<a class="ulink" href="tel:${esc(tel)}">Call us now ${arrow}</a>` : ''}
      </div>
    </div>
  </div>
</section>

<section class="block" id="services" style="padding-top:0">
  <div class="wrap sec-head">
    <div><span class="eyebrow">Our services</span><h2>Everything your<br><em>property</em> needs</h2></div>
    <div class="sec-tools">
      <p>One crew for the whole season, so you never juggle multiple contractors.</p>
      <div class="navbtns"><button type="button" data-rail="-1" aria-label="Previous">${chev('l')}</button><button type="button" data-rail="1" aria-label="Next">${chev('r')}</button></div>
    </div>
  </div>
  <div class="rail" id="rail">
    ${services.map(([n, d, tag, photo, instant]) => `<article class="svc">
      <img src="${esc(typeof photo === 'number' ? img(photo, 700) : photo)}" alt="" loading="lazy">
      <span class="chip">${esc(tag || 'Service')}</span>
      <h3>${esc(n)}</h3><p>${esc(d)}</p>
      <button class="pbtn white" type="button" ${instant ? 'data-open-quote' : `data-open-quote="custom" data-service="${esc(n)}"`}><span>${instant ? 'Instant price' : 'Get a quote'}</span><i>${arrow}</i></button>
    </article>`).join('\n    ')}
  </div>
</section>

<section class="block process" id="process">
  <div class="wrap">
    <div class="sec-head">
      <div><span class="eyebrow">Our process</span><h2>How it works,<br><em>start to finish</em></h2></div>
      <div class="sec-tools"><p>No phone tag, no waiting on quotes. Book, get reminded, and pay, all from your phone.</p></div>
    </div>
    <div class="bento">
      <div class="tile t1"><span class="n">Step 01</span><h3>Enter your address</h3><p>We size up your lot and show your price instantly. No site visit needed to get started.</p><div class="pic"><img src="${esc(photos.house)}" alt="" loading="lazy"></div></div>
      <div class="tile t2"><span class="n">Step 02</span><h3>Pick a plan &amp; date</h3><p>Weekly, every two weeks or monthly. Choose your first visit.</p>
        <div class="mock" aria-hidden="true">
          <div class="mock-row on"><span>Weekly</span><span><b data-price="residential.weekly">$${pricing.residential.weekly}</b> <small>/ mow</small></span></div>
          <div class="mock-row"><span>Every 2 weeks</span><span><b data-price="residential.biweekly">$${pricing.residential.biweekly}</b> <small>/ mow</small></span></div>
          <div class="mock-row"><span>Monthly</span><span><b data-price="residential.monthly">$${pricing.residential.monthly}</b> <small>/ mow</small></span></div>
        </div></div>
      <div class="tile t3"><span class="n">Step 03</span><h3>Get a reminder</h3><p>A text the day before every visit, so you're never surprised.</p>
        <div class="sms" aria-hidden="true"><div>Hi! ${esc(lead.name)} here. We'll be at your place tomorrow between 9 and 11am 🌿</div><div class="me">Perfect, gate's unlocked 👍</div></div></div>
      <div class="tile t4 dark"><div><span class="n">Step 04</span><h3>Pay from your phone</h3><p>After each visit you get a simple invoice by text and email. Pay by card in one tap, or turn on autopay and forget about it.</p></div>
        <div class="invoice" aria-hidden="true"><div class="top"><span>Invoice #1042</span><span style="color:#2a5230">Due today</span></div>
          <div class="line"><span>Weekly mowing</span><span data-price="residential.weekly" data-suffix=".00">$${pricing.residential.weekly}.00</span></div>
          <div class="line"><span>Edging &amp; blow-off</span><span>Included</span></div>
          <div class="pay">Pay <span data-price="residential.weekly" data-suffix=".00">$${pricing.residential.weekly}.00</span></div></div></div>
    </div>
  </div>
</section>

${reviews.length ? `<section class="block" id="reviews">
  <div class="wrap">
    <div class="sec-head"><div><span class="eyebrow">Reviews</span><h2>What neighbors<br><em>are saying</em></h2></div></div>
    <div class="revs">
      <div class="score"><div><div class="big">${lead.rating.toFixed(1)}</div><div class="stars">${stars(lead.rating)}</div><p style="margin-top:8px;opacity:.8">${lead.reviewCount} reviews on Google</p></div>${lead.mapsUrl ? `<a class="ulink" href="${esc(lead.mapsUrl)}" target="_blank" rel="noopener">Read them all ${arrow}</a>` : ''}</div>
      ${reviews.map(r => `<figure class="rev"><span class="stars" aria-label="${r.rating} out of 5 stars">${stars(r.rating)}</span><blockquote>“${esc(trim(r.text, 240))}”</blockquote><cite>${gBadge}${esc(r.author)}</cite></figure>`).join('\n      ')}
    </div>
  </div>
</section>` : ''}

<section class="block" id="contact" style="${reviews.length ? 'padding-top:0' : ''}">
  <div class="wrap info">
    ${lead.hours?.length ? `<div class="card"><h3>Hours</h3><ul class="hours">${lead.hours.map(h => { const [d, ...t] = h.split(': '); return `<li><span>${esc(d)}</span><span>${esc(t.join(': '))}</span></li>`; }).join('')}</ul></div>` : ''}
    <div class="card"${lead.hours?.length ? '' : ' style="grid-column:1/-1"'}>
      <h3>Service area</h3>
      <p>Based in ${esc(area)} and serving the surrounding neighborhoods. Not sure we cover your street? Enter your address for an instant answer, or just ask.</p>
      <div class="row-ctas">
        ${tel ? `<a class="pbtn dark" href="tel:${esc(tel)}"><span>${esc(lead.phone)}</span><i>${phoneIcon}</i></a>` : ''}
        ${lead.mapsUrl ? `<a class="ulink" href="${esc(lead.mapsUrl)}" target="_blank" rel="noopener">View on Google Maps ${arrow}</a>` : ''}
      </div>
    </div>
  </div>
</section>

<section class="cta" id="book">
  <img src="${esc(photos.stripes)}" alt="" loading="lazy">
  <h2>Ready for a lawn<br><em>you're proud of?</em></h2>
  <p>See your price in seconds and book your first mow in minutes.</p>
  ${preview ? `<p class="coach" hidden>Start here. Try your own address 👇</p>` : ''}
  ${addrForm('cta-address', 'See my price')}
</section>

<footer>
  <div class="wrap">
    <span><b>${esc(lead.name)}</b>${lead.address ? ` · ${esc(lead.address)}` : ''}</span>
    <span>© ${year}${config.agencyName ? ` · Site by ${esc(config.agencyName)}` : ''}</span>
  </div>
</footer>

<nav class="mobile-bar" aria-label="Quick actions">
  ${tel ? `<a class="call" href="tel:${esc(tel)}">${phoneIcon}Call</a>` : ''}
  <button class="pbtn lime" type="button" data-open-quote><span>Get my instant price</span><i>${arrow}</i></button>
</nav>

<dialog class="quote" id="quote" aria-label="Instant quote">
  <script type="application/json" id="quote-config">${quoteConfig}</script>
  <div class="qbody">
    <button class="x" type="button" data-close aria-label="Close">×</button>

    <form class="qstep" data-step="address">
      <span class="qpill">⚡ Instant quote</span>
      <h2>Price your lawn in seconds</h2>
      <p class="sub">Enter your address. We'll size up your lot, show your price and let you book in minutes.</p>
      <div class="field"><label for="q-address">Property address</label><input id="q-address" name="address" autocomplete="street-address" placeholder="123 Main St, ${esc(city || 'City')}" required></div>
      <button class="pbtn dark" type="submit"><span>See my price</span><i>${arrow}</i></button>
      <p class="alt">Need a cleanup, mulch or something else? <button type="button" class="link" data-go="custom">Request a custom quote</button></p>
    </form>

    <div class="qstep" data-step="plans" hidden>
      <button type="button" class="back" data-go="address">← Change address</button>
      <h2>Your mowing price</h2>
      <p class="sub q-addr-out"></p>
      <div class="lot"><span>Lot size</span><strong class="q-lot"></strong><span class="q-lot-note"></span></div>
      <div class="sizes" role="radiogroup" aria-label="Lot size"></div>
      <label class="acres" hidden>How many acres? <input type="number" min="3" max="50" step="0.5" value="3" inputmode="decimal"></label>
      <div class="plans" role="radiogroup" aria-label="Plan"></div>
      <button type="button" class="pbtn dark" data-go="book"><span>Pick a start date</span><i>${arrow}</i></button>
      <p class="fine">Every visit includes mowing, edging, trimming and blow-off. Final price confirmed at your first visit.</p>
    </div>

    <form class="qstep" data-step="book" hidden>
      <button type="button" class="back" data-go="plans">← Back to plans</button>
      <h2>Book your first mow</h2>
      <p class="sub q-summary"></p>
      <div class="dates" role="radiogroup" aria-label="Start date"></div>
      ${preview ? `<div class="owner-tip"><b>${ownerFirst ? esc(ownerFirst) + ', use' : 'Use'} your real mobile number and email.</b> You'll get the same confirmation text and email your customers will.</div>` : ''}
      <div class="row2">
        <div class="field"><label for="b-name">Name</label><input id="b-name" name="name" autocomplete="name" required></div>
        <div class="field"><label for="b-phone">Mobile</label><input id="b-phone" name="phone" type="tel" autocomplete="tel" required></div>
      </div>
      <div class="field"><label for="b-email">Email <span style="font-weight:400;color:var(--muted)">(for invoices)</span></label><input id="b-email" name="email" type="email" autocomplete="email"></div>
      <button class="pbtn dark" type="submit"><span>Confirm booking</span><i>${arrow}</i></button>
      <p class="fine">No payment needed today. By booking, you agree to get texts and emails about your service, including a reminder before each visit. Msg &amp; data rates may apply. Reply STOP to opt out.</p>
      <p class="form-msg" hidden role="status"></p>
    </form>

    <form class="qstep" data-step="custom" hidden>
      <button type="button" class="back" data-go="address">← Back to instant quote</button>
      <h2>Request a custom quote</h2>
      <p class="sub">Tell us about the job. We usually reply the same day.</p>
      <div class="row2">
        <div class="field"><label for="c-name">Name</label><input id="c-name" name="name" autocomplete="name" required></div>
        <div class="field"><label for="c-phone">Mobile</label><input id="c-phone" name="phone" type="tel" autocomplete="tel" required></div>
      </div>
      <div class="field"><label for="c-address">Property address</label><input id="c-address" name="address" autocomplete="street-address"></div>
      <div class="field"><label for="c-service">What do you need?</label>
        <select id="c-service" name="service">${services.map(s => `<option>${esc(s[0])}</option>`).join('')}<option>Something else</option></select>
      </div>
      <div class="field"><label for="c-notes">Details <span style="font-weight:400;color:var(--muted)">(optional)</span></label><textarea id="c-notes" name="notes" rows="2"></textarea></div>
      <button class="pbtn dark" type="submit"><span>Send request</span><i>${arrow}</i></button>
      <p class="form-msg" hidden role="status"></p>
    </form>

    <div class="qstep done" data-step="done" hidden>
      <div class="check" aria-hidden="true">✓</div>
      <h2 class="q-done-title"></h2>
      <p class="sub q-done-text"></p>
      ${preview ? `<div class="pitch-next">
        <p class="sent" data-sent="yes" hidden><b>📱 Check your phone and inbox.</b> Your confirmation text and email are on the way, exactly what your customers will get.</p>
        <p class="sent" data-sent="no" hidden><b>Demo messages aren't connected yet,</b> so no text or email went out this time.</p>
        <h3>${ownerFirst ? esc(ownerFirst) + ', your' : 'Your'} site can be up and booking jobs in the next 10 minutes.</h3>
        <button class="pbtn lime" type="button" data-go="pricing"><span>Show me pricing</span><i>${arrow}</i></button>
      </div>` : `<button class="pbtn lime" type="button" data-close style="margin-top:18px"><span>Done</span><i>${arrow}</i></button>`}
    </div>

    ${preview ? `<div class="qstep offer" data-step="pricing" hidden>
      <button type="button" class="back" data-go="done">← Back</button>
      <span class="qpill">For ${esc(lead.name)}</span>
      <h2>Live in 10 minutes. <em>Simple pricing.</em></h2>
      <p class="sub">Everything you just tried, on your own web address, booking real customers.</p>
      <div class="ocard main">
        <div class="ohead">
          <span><b>Website + instant booking</b><small>Your site, your prices, lead alerts</small></span>
          <span class="oprice"><s><small>Typical agency build</small> ${usd(o.websiteAnchor)}</s><strong>${usd(o.website)}</strong><small>one time</small></span>
        </div>
        <div class="pay" role="group" aria-label="Payment">
          <button type="button" data-pay="full" aria-pressed="true"><b>${usd(o.website)}</b>Pay in full</button>
          <button type="button" data-pay="split" aria-pressed="false"><b>${o.splitCount} × ${usd(o.splitAmount)}</b>Split payments</button>
        </div>
      </div>
      <div class="ocard">
        <div class="ohead">
          <span><b>Business Automation</b><small>Service reminders, post-service notifications, invoices and payment reminders</small></span>
          <span class="oprice"><s>${usd(o.automationAnchor)}</s><strong>${usd(o.automationSetup)}</strong><small>then ${usd(o.automationMonthly)}/mo</small></span>
        </div>
        <label class="switch"><input type="checkbox" id="o-auto" checked> Add Business Automation</label>
      </div>
      <div class="osum" id="o-sum"></div>
      <button type="button" class="pbtn lime" id="o-buy"><span>Get my website now</span><i>${arrow}</i></button>
      ${config.agencyPhone ? `<p class="fine">Questions first? Call or text ${esc(config.agencyPhone)}.</p>` : ''}
      <p class="form-msg" id="o-msg" hidden role="status"></p>
    </div>` : ''}
  </div>
</dialog>

${preview ? `<dialog class="pitch" id="pitch" aria-labelledby="pitch-title">
  <span class="qpill">Made for ${esc(lead.name)}</span>
  <h2 id="pitch-title">${ownerFirst ? esc(ownerFirst) + ', this' : 'This'} site is <em>ready for you.</em></h2>
  <p>It can start booking customers for ${esc(lead.name)} within 24 hours.</p>
  <p>First, see it the way your customers will. Get an instant price and book a mow. It takes about a minute.</p>
  <button class="pbtn lime" type="button" data-pitch-go><span>Show me how customers book</span><i>${arrow}</i></button>
  <button class="link" type="button" data-pitch-close>Keep looking around</button>
</dialog>` : ''}

<script>${CLIENT_JS}</script>
</body>
</html>
`;
}

// Instant quote → plan → book flow, in a dialog. Runs in the browser; no template interpolation inside.
const CLIENT_JS = String.raw`
(function () {
  var html = document.documentElement;
  var root = document.getElementById('quote');
  var cfg = JSON.parse(document.getElementById('quote-config').textContent);
  var embedded = window.parent !== window;
  var ACRE = 43560;
  var TIERS = [
    { key: 'residential', label: 'Residential', range: 'Under 1 acre' },
    { key: 'large', label: 'Large lot', range: '1–3 acres' },
    { key: 'acreage', label: '3+ acres', range: 'Priced per acre' }
  ];
  var PLANS = [
    { key: 'weekly', name: 'Weekly', meta: 'Best-looking lawn all season', perMonth: 52 / 12, tag: 'Most popular' },
    { key: 'biweekly', name: 'Every 2 weeks', meta: 'Great for slower growth', perMonth: 26 / 12 },
    { key: 'monthly', name: 'Monthly', meta: 'Light upkeep', perMonth: 1 }
  ];
  var state = { address: '', lotSqft: null, lotSource: '', tier: 0, acres: 3, plan: 'weekly', date: '' };

  function $(s, el) { return (el || root).querySelector(s); }
  function money(n) { return '$' + Math.round(n); }
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function tierFor(sqft) { var a = sqft / ACRE; return a < 1 ? 0 : a < 3 ? 1 : 2; }

  // Residential and large lots have set prices; 3+ acres is price-per-acre, with the
  // bi-weekly and monthly prices scaled by the same ratio as residential.
  function priceFor(tier, plan) {
    var p = cfg.pricing;
    if (tier < 2) return p[TIERS[tier].key][plan];
    var ratio = p.residential[plan] / p.residential.weekly;
    return Math.round(p.perAcre * state.acres * ratio);
  }
  function current() { return { plan: PLANS.filter(function (p) { return p.key === state.plan; })[0], tier: TIERS[state.tier], price: priceFor(state.tier, state.plan) }; }

  function show(step) {
    if (!root.open) root.showModal();
    root.querySelectorAll('.qstep').forEach(function (s) { s.hidden = s.dataset.step !== step; });
    if (step === 'book') renderBook();
    if (step === 'custom' && state.address && !$('#c-address').value) $('#c-address').value = state.address;
    var h = $('[data-step="' + step + '"] h2');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }

  // Real lot sizes come from lotLookupEndpoint (county parcel data). Previews simulate one.
  function lookupLot(address) {
    if (cfg.lotLookupEndpoint) {
      return fetch(cfg.lotLookupEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: address }) })
        .then(function (r) { if (!r.ok) throw r; return r.json(); })
        .then(function (d) { if (!d.lotSqft) throw 0; return { lotSqft: Math.round(d.lotSqft), source: 'lookup' }; });
    }
    var h = 0;
    for (var i = 0; i < address.length; i++) h = (h * 31 + address.charCodeAt(i)) >>> 0;
    return new Promise(function (res) { setTimeout(function () { res({ lotSqft: 4000 + (h % 110) * 100, source: 'simulated' }); }, 900); });
  }

  function lotText() {
    if (!state.lotSqft) return TIERS[state.tier].label + ' (' + TIERS[state.tier].range.toLowerCase() + ')';
    return state.lotSqft < ACRE ? '~' + state.lotSqft.toLocaleString('en-US') + ' sq ft' : '~' + (state.lotSqft / ACRE).toFixed(1) + ' acres';
  }

  function renderPrices() {
    $('.plans').innerHTML = PLANS.map(function (p) {
      var price = priceFor(state.tier, p.key);
      return '<button type="button" class="plan" role="radio" aria-checked="' + (p.key === state.plan) + '" data-plan="' + p.key + '">' +
        (p.tag ? '<span class="tag">' + p.tag + '</span>' : '') +
        '<span class="dot"></span><span><span class="name">' + p.name + '</span><span class="meta">' + p.meta + '</span></span>' +
        '<span class="price">' + money(price) + '<small>per mow · ~' + money(price * p.perMonth) + '/mo</small></span></button>';
    }).join('');
  }

  function renderPlans() {
    $('.q-addr-out').textContent = state.address;
    $('.q-lot').textContent = lotText();
    $('.q-lot-note').textContent = {
      simulated: 'Preview: lot size is simulated. Live sites pull it from county parcel records. Not right? Pick your lot size:',
      lookup: 'From county parcel records. Not right? Pick your lot size:',
      manual: 'Pick the size that best matches your property:',
      none: "We couldn't find your lot automatically. Pick your lot size:"
    }[state.lotSource] || '';
    $('.sizes').innerHTML = TIERS.map(function (x, i) {
      return '<button type="button" class="chip" role="radio" aria-checked="' + (i === state.tier) + '" data-tier="' + i + '">' + x.label + ' <small>' + x.range + '</small></button>';
    }).join('');
    $('.acres').hidden = state.tier !== 2;
    $('.acres input').value = state.acres;
    renderPrices();
  }

  function renderBook() {
    var c = current();
    $('.q-summary').textContent = c.plan.name + ' mowing · ' + money(c.price) + ' per visit · ' + state.address;
    var days = [], d = new Date();
    d.setDate(d.getDate() + 1); // earliest start is the day after tomorrow
    while (days.length < 8) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0) days.push(new Date(d)); }
    if (!days.some(function (x) { return iso(x) === state.date; })) state.date = iso(days[0]);
    $('.dates').innerHTML = days.map(function (x) {
      var v = iso(x);
      return '<button type="button" class="chip" role="radio" aria-checked="' + (v === state.date) + '" data-date="' + v + '">' +
        x.toLocaleDateString('en-US', { weekday: 'short' }) + '<small>' + x.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + '</small></button>';
    }).join('');
  }

  // Price mentions in the page body (process section mock-ups).
  function renderPageprices() {
    document.querySelectorAll('[data-price]').forEach(function (el) {
      var path = el.dataset.price.split('.'), v = cfg.pricing[path[0]][path[1]];
      el.textContent = '$' + v + (el.dataset.suffix || '');
    });
  }

  root.addEventListener('click', function (e) {
    if (e.target === root || e.target.closest('[data-close]')) return root.close();
    var go = e.target.closest('[data-go]');
    if (go) { e.preventDefault(); return show(go.dataset.go); }
    var tier = e.target.closest('[data-tier]');
    if (tier) {
      state.tier = +tier.dataset.tier; state.lotSource = 'manual';
      if (state.lotSqft && tierFor(state.lotSqft) !== state.tier) state.lotSqft = null;
      return renderPlans();
    }
    var plan = e.target.closest('[data-plan]');
    if (plan) { state.plan = plan.dataset.plan; return renderPrices(); }
    var date = e.target.closest('[data-date]');
    if (date) { state.date = date.dataset.date; root.querySelectorAll('[data-date]').forEach(function (x) { x.setAttribute('aria-checked', x === date); }); }
  });

  $('.acres input').addEventListener('input', function () {
    var v = parseFloat(this.value);
    if (v >= 3) { state.acres = v; renderPrices(); }
  });

  // Buttons around the page that open the quote: data-open-quote (instant) or data-open-quote="custom".
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-open-quote]');
    if (!b) return;
    if (b.dataset.openQuote === 'custom') {
      show('custom');
      if (b.dataset.service) $('#c-service').value = b.dataset.service;
    } else {
      show('address');
      $('#q-address').focus();
    }
  });

  // Address bars in the hero and final CTA jump straight to pricing.
  document.querySelectorAll('.addr-form').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      $('#q-address').value = f.address.value;
      show('address');
      $('[data-step="address"]').requestSubmit();
    });
  });

  $('[data-step="address"]').addEventListener('submit', function (e) {
    e.preventDefault();
    var label = $('button[type=submit] span', this), b = label.parentNode;
    state.address = $('#q-address').value.trim();
    b.disabled = true; label.textContent = 'Measuring your lot…';
    lookupLot(state.address)
      .then(function (r) { state.lotSqft = r.lotSqft; state.lotSource = r.source; })
      .catch(function () { state.lotSqft = null; state.lotSource = 'none'; })
      .then(function () {
        b.disabled = false; label.textContent = 'See my price';
        state.tier = state.lotSqft ? tierFor(state.lotSqft) : 0;
        if (state.tier === 2) state.acres = Math.round(state.lotSqft / ACRE * 2) / 2;
        renderPlans(); show('plans');
      });
  });

  function send(form, payload, title, text) {
    var b = $('button[type=submit]', form), msg = $('.form-msg', form);
    var done = function () {
      b.disabled = false; form.reset();
      $('.q-done-title').textContent = title;
      $('.q-done-text').textContent = text;
      if (cfg.pitch) {
        root.querySelectorAll('[data-sent]').forEach(function (p) { p.hidden = p.dataset.sent !== (cfg.bookingEndpoint ? 'yes' : 'no'); });
        track('demo_booking', { booking: payload });
        try { sessionStorage.setItem('pitch:booked', '1'); } catch (e) {}
      }
      show('done');
      if (embedded) parent.postMessage({ type: 'lawn:booking', payload: payload }, location.origin);
    };
    b.disabled = true; msg.hidden = true;
    if (!cfg.bookingEndpoint) return setTimeout(done, 500);
    fetch(cfg.bookingEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(function (r) { if (!r.ok) throw r; done(); })
      .catch(function () { b.disabled = false; msg.textContent = 'Something went wrong.' + (cfg.phone ? ' Please call ' + cfg.phone + '.' : ''); msg.hidden = false; });
  }

  $('[data-step="book"]').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = Object.fromEntries(new FormData(this)), c = current();
    var when = new Date(state.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    send(this, {
      type: 'booking', business: cfg.business, placeId: cfg.placeId, source: 'website',
      name: f.name, phone: f.phone, email: f.email, address: state.address,
      lotSqft: state.lotSqft, lotSource: state.lotSource, lotTier: c.tier.key, acres: state.tier === 2 ? state.acres : null,
      plan: state.plan, planName: c.plan.name, pricePerVisit: c.price, startDate: state.date, startDateText: when
    }, "You're booked!", c.plan.name + ' mowing starts ' + when + ' at ' + money(c.price) + " per visit. We'll text you a reminder the day before.");
  });

  $('[data-step="custom"]').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = Object.fromEntries(new FormData(this));
    f.type = 'custom_quote'; f.business = cfg.business; f.placeId = cfg.placeId; f.source = 'website';
    send(this, f, 'Request sent', "Thanks! We'll get back to you with a quote shortly.");
  });

  // ---------- pitch mode: the owner experiences their own site as a customer ----------
  function track(event, extra) {
    if (!cfg.trackEndpoint) return;
    try {
      fetch(cfg.trackEndpoint, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({ event: event, slug: cfg.slug, business: cfg.business, placeId: cfg.placeId, at: new Date().toISOString() }, extra || {})) });
    } catch (e) {}
  }

  if (cfg.pitch) {
    var pitch = document.getElementById('pitch');
    var seen = function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } };
    var mark = function (k) { try { sessionStorage.setItem(k, '1'); } catch (e) {} };
    track('visit', { ref: document.referrer || '' });

    // At 75% scroll, invite the owner to try booking (once per visit, and not mid-quote).
    var onScroll = function () {
      var max = document.documentElement.scrollHeight - innerHeight;
      if (max <= 0 || scrollY / max < 0.75) return;
      if (root.open || seen('pitch:shown') || seen('pitch:booked')) return;
      mark('pitch:shown');
      removeEventListener('scroll', onScroll);
      pitch.showModal();
      track('popup_shown');
    };
    addEventListener('scroll', onScroll, { passive: true });

    pitch.addEventListener('click', function (e) {
      if (e.target === pitch || e.target.closest('[data-pitch-close]')) { pitch.close(); return track('popup_dismissed'); }
      if (!e.target.closest('[data-pitch-go]')) return;
      pitch.close();
      track('popup_cta');
      var book = document.getElementById('book'), coach = book.querySelector('.coach'), form = book.querySelector('.addr-form');
      coach.hidden = false;
      book.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
      setTimeout(function () {
        form.classList.remove('spot'); void form.offsetWidth; form.classList.add('spot');
        form.address.focus({ preventScroll: true });
      }, 650);
    });

    // Pricing step at the end of the demo.
    var o = cfg.offer, offer = { pay: 'full', automation: true };
    var renderOffer = function () {
      root.querySelectorAll('[data-pay]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.pay === offer.pay); });
      var site = offer.pay === 'split' ? o.splitAmount : o.website;
      var rows = ['<div><span>Website' + (offer.pay === 'split' ? ' (1 of ' + o.splitCount + ')' : '') + '</span><span>' + money(site) + '</span></div>'];
      if (offer.automation) rows.push('<div><span>Automation setup</span><span>' + money(o.automationSetup) + '</span></div>');
      rows.push('<div class="total"><span>Due today</span><span>' + money(site + (offer.automation ? o.automationSetup : 0)) + '</span></div>');
      if (offer.pay === 'split') rows.push('<div><span>Remaining ' + (o.splitCount - 1) + ' × in 30-day steps</span><span>' + money(o.splitAmount) + '</span></div>');
      if (offer.automation) rows.push('<div><span>Automation, from next month</span><span>' + money(o.automationMonthly) + '/mo</span></div>');
      $('#o-sum').innerHTML = rows.join('');
    };
    root.addEventListener('click', function (e) {
      var p = e.target.closest('[data-pay]');
      if (p) { offer.pay = p.dataset.pay; renderOffer(); }
      if (e.target.closest('[data-go="pricing"]')) { renderOffer(); track('pricing_viewed'); }
    });
    $('#o-auto').addEventListener('change', function () { offer.automation = this.checked; renderOffer(); });
    $('#o-buy').addEventListener('click', function () {
      track('checkout_click', { pay: offer.pay, automation: offer.automation });
      if (!cfg.checkoutUrl) { var m = $('#o-msg'); m.hidden = false; m.textContent = "Checkout isn't connected yet. Add offer.checkoutUrl in config.json."; return; }
      var q = new URLSearchParams({ slug: cfg.slug, pay: offer.pay, automation: offer.automation ? '1' : '0' });
      location.href = cfg.checkoutUrl + (cfg.checkoutUrl.indexOf('?') < 0 ? '?' : '&') + q.toString();
    });
  }

  // Service carousel arrows.
  var rail = document.getElementById('rail');
  document.querySelectorAll('[data-rail]').forEach(function (b) {
    b.addEventListener('click', function () { rail.scrollBy({ left: +b.dataset.rail * Math.min(rail.clientWidth * 0.8, 640), behavior: 'smooth' }); });
  });

  // Live reconfiguration from the setup wizard (same origin only).
  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin || !e.data || e.data.type !== 'lawn:config') return;
    var m = e.data;
    if (m.style) html.dataset.style = m.style;
    if (m.mode) html.dataset.mode = m.mode;
    if (m.pricing) {
      cfg.pricing = m.pricing;
      renderPageprices();
      if (root.open && !$('[data-step="plans"]').hidden) renderPrices();
    }
  });
  if (embedded) parent.postMessage({ type: 'lawn:ready' }, location.origin);
})();
`;
