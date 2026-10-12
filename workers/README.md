# Workers

Cloudflare Workers for 7acredigital.com. Each folder is one Worker with its own `wrangler.toml`; deploy from inside the folder with `npx wrangler deploy`. Secrets are set with `npx wrangler secret put <NAME>` and never committed.

| Worker | URL | What it does | Secrets |
|---|---|---|---|
| [`signup/`](signup/) | `POST https://api.7acredigital.com/signup` | The homepage "Get started" form: creates a Business in Fibery (Source: Inbound, state: New) and returns its link | `FIBERY_TOKEN` |

## Sign-up flow

1. Visitor submits the form on 7acredigital.com.
2. The page posts to the `signup` Worker, which creates the Business in Fibery.
3. The page then emails the lead to dennis@7acredigital.com through FormSubmit, with the Fibery link. If the Worker is down, the email still goes out (without the link), so no lead is lost.
