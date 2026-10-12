# Pipeline

Scripts that find prospects and build their sites from a template in [`../templates/`](../templates/). Run them from anywhere with Node 20+; paths resolve relative to this folder. Generated sites land in `pipeline/sites/` and lead data in `pipeline/data/`, both kept out of git.

Find lawn care / landscaping businesses with no real website, build each one a site on its own subdomain, and text the owner the link. The site pitches itself: the owner books a mow as a customer would, gets the real confirmation text and email, then sees pricing.

## The flow

1. **Source prospects** → `find-leads.mjs` (Google Places) or your CRM sheet.
2. **Enrich** with owner first name, mobile, email, socials (in the sheet).
3. **Build** → `build-sites.mjs` creates `sites/<slug>/index.html`, hosted at `https://<slug>.7acredigital.com`.
4. **Text the owner**, pre-written per lead in `data/outreach.csv`:
   > Hey Marcus, you using anything like this? https://green-ridge-lawn-care.7acredigital.com
5. **On their site:**
   - At **75% scroll**, a pop-up: "Marcus, this site is ready for you. It can start booking customers within 24 hours. First, see it the way your customers will." → **Show me how customers book**
   - It scrolls to the booking section at the bottom of the page, with a "Start here" hint.
   - Address → instant price → plan → date. At the contact step a tip says: *use your real mobile number and email; you'll get the same confirmation your customers will.*
   - Booking sends the **real confirmation text + email** (`demoEndpoint`).
   - Confirmation: "Check your phone and inbox… Marcus, your site can be up and booking jobs in the next 10 minutes." → **Show me pricing** → website $1,500 → $499 (or 2 × $299) + Business Automation $399 → $97 + $29/mo → **Get my website now**.

## Run it

```bash
# 1. Find leads (needs a Google Places API key with "Places API (New)" enabled)
$env:GOOGLE_PLACES_API_KEY = "your-key"
node find-leads.mjs "Tampa, FL" "Brandon, FL"

# 2. Build sites
node build-sites.mjs                       # from data/leads.json
node build-sites.mjs my-crm-export.csv     # or from a CRM / Google Sheet CSV

# Try it with made-up businesses:
node build-sites.mjs data/sample-leads.json
```

**CSV columns** (header names are matched loosely; only a business name is required):
`Business Name, Owner Name, Phone, Email, Address, City, State, Rating, Review Count, Google Maps, Facebook/Instagram, Style, Mode, Status, Notes`

## Build from Fibery

Move a business to **Ready for build** in Fibery, then:

```bash
$env:FIBERY_TOKEN = "your-token"     # Fibery → Settings → API Keys
node build-from-fibery.mjs --dry-run   # render only, Fibery untouched
node build-from-fibery.mjs             # render, create the Site record, move business to "Site built"
```

It fills the template from the business record: name, phone, address, rating and reviews, Google Maps link, social link, the primary contact's first name, and the **Services** field (each service becomes a service card). It adds to `sites/` without wiping it, and rebuilding a business that already has a Site keeps the same URL.

## Settings (`config.json`)

| Key | What it does |
|---|---|
| `siteDomain` | Your domain. Sites live at `<slug>.<siteDomain>` |
| `outreachText`, `outreachTextNoName` | First-touch text. `{first}`, `{business}`, `{url}` get filled in |
| `demoEndpoint` | Webhook for bookings on pitch sites. Sends the confirmation **text + email to the phone/email entered** (the owner) |
| `trackEndpoint` | Webhook for engagement events: `visit`, `popup_shown`, `popup_cta`, `popup_dismissed`, `demo_booking`, `pricing_viewed`, `checkout_click`. Use it to alert you when a prospect is hot |
| `formEndpoint` | Webhook for real customer bookings once a site is live (`preview: false`) |
| `offer` | Your prices and `checkoutUrl` (e.g. a Stripe payment link). It gets `?slug&pay=full\|split&automation=1` |
| `pricing` | Default mowing prices (`residential`, `large`, `perAcre`) |
| `lotLookupEndpoint` | Takes `{address}`, returns `{lotSqft}`. Empty = simulated lot size |
| `agencyName`, `agencyPhone` | Footer credit, "Questions first?" line on pricing |

Per-business overrides on a lead: `owner`, `style` (`modern` / `classy` / `simple`), `mode` (`light` / `dark`), `pricing`, `photos`, `services`, `preview: false` (live site: no pitch pop-up, no noindex, bookings go to `formEndpoint`).

Try other looks on any site with `?style=classy&mode=dark`.

## Hosting on subdomains

Sites are served at `https://<slug>.7acredigital.com`. The domain's DNS is on Cloudflare; the plan is a wildcard `*.7acredigital.com` record plus a Cloudflare Worker that reads the subdomain and serves the matching site (it will live in `workers/`). Until then, `build-sites.mjs` still writes `sites/vercel.json` and `sites/_redirects`, which do the same routing on Vercel or Netlify.

## Demo booking payload (sent to `demoEndpoint`)

```json
{ "type": "booking", "business": "Green Ridge Lawn Care", "placeId": "...", "name": "Marcus Reed",
  "phone": "(813) 555-0100", "email": "marcus@example.com", "address": "4512 W Bay Ave, Tampa, FL",
  "lotSqft": 8200, "lotTier": "residential", "acres": null, "plan": "weekly", "planName": "Weekly",
  "pricePerVisit": 35, "startDate": "2026-10-09", "startDateText": "Friday, October 9" }
```

The endpoint should:
1. Text `phone`: *"Hi Marcus! You're booked with Green Ridge Lawn Care: weekly mowing starting Friday, October 9 at $35/visit. We'll text a reminder the day before. Reply STOP to opt out."*
2. Email `email` the same confirmation.
3. Alert you that this prospect just tried the demo.

## Not built yet

1. **`demoEndpoint`**: e.g. an n8n workflow with a webhook, Twilio for SMS, and Gmail/SMTP for email.
2. **`trackEndpoint`**: log events to the sheet and ping you on `popup_cta` / `demo_booking`.
3. **Checkout:** Stripe payment links.
4. **Lot lookup:** a parcel data API (e.g. Regrid).
5. **Live booking backend** for paying clients (reminders, post-service notifications, invoices, payment reminders).

## Compliance notes

- **Cold texting is the riskiest part of this.** Federal TCPA and Florida's FTSA restrict marketing texts to cell phones without prior consent. Florida's law is strict and lawsuits under it are common. Send first-touch texts one at a time from a regular phone, never in bulk or through an autodialer or texting platform. Honor any "stop" immediately, and check the Do Not Call list. Get a lawyer's read before scaling this.
- Texts from the demo go only to the number the owner typed in. The booking form includes consent and opt-out wording, and US business texting needs 10DLC registration with your SMS provider.
- Google's terms limit how long you can store Places data (reviews, hours). Re-fetch before a site goes live.
- The struck-through prices are labeled "Typical agency build." Don't present them as your own former price unless you actually charged it.
- Sales copy promises instant pricing, reminders and invoices. Make sure each client's live setup actually delivers them.
