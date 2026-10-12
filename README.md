# seven//acre

Source of truth for seven//acre (7Acre Digital): the marketing site, the brand files, the client site templates, and the pipeline that turns a CRM record into a live site.

> **This repo is public** (GitHub Pages on a free plan needs that). Never commit API keys, prospect lists, CRM exports or internal strategy docs. `.gitignore` blocks the usual suspects.

## Layout

| Folder | What's in it | Where it shows up |
|---|---|---|
| [`site/`](site/) | The live marketing site, plus the internal CRM app (`crm/`) and call tracker | https://7acredigital.com (GitHub Pages, deployed by [`.github/workflows/pages.yml`](.github/workflows/pages.yml)) |
| [`brand/`](brand/) | Logo files (icon, responsive wordmark), Figma exports, fonts | — |
| [`design/`](design/) | Work in progress, e.g. the new seven//acre homepage | Not deployed |
| [`templates/`](templates/) | Client site templates, one folder each | `<business>.7acredigital.com` |
| [`pipeline/`](pipeline/) | Scripts: find leads, build sites from a list or from Fibery | Run locally with Node 20+ |
| [`archive/`](archive/) | Retired tools kept for reference | — |

## How a client site gets built

1. A business in Fibery (`Sales/Business`) moves to **Ready for build**.
2. The pipeline fills a template from the record (name, phone, services, Google rating and reviews).
3. The site is served at `https://<business-slug>.7acredigital.com`.
4. A `Sales/Site` record with the URL is linked back to the business, and the business moves to **Site built**.

Today steps 2–4 run with `node pipeline/build-from-fibery.mjs`. Next up: a Cloudflare Worker that does this automatically on the Fibery state change and serves the wildcard subdomain (it will live in `workers/`).

## Common tasks

```bash
# Preview the client template with sample businesses
node pipeline/build-sites.mjs pipeline/data/sample-leads.json

# Build everything that's "Ready for build" in Fibery (needs FIBERY_TOKEN)
node pipeline/build-from-fibery.mjs --dry-run
```

Edits to `site/` go live on push to `main`. Everything else is not deployed by this repo.
