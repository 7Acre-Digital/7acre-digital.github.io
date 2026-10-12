# Lawn template

A one-page site for a lawn care or landscaping business: hero with Google rating, services, how it works, reviews, hours, and an instant-quote booking flow.

## Data it uses (`lead`)

| Field | Used for |
|---|---|
| `name` (required) | Everywhere |
| `phone`, `address`, `city`, `state` | Call buttons, footer, "lawns in {city}" copy, schema.org data |
| `rating`, `reviewCount`, `mapsUrl` | Google badge (shown at 4.0+), "Read them all" link |
| `reviews[]` (`author`, `rating`, `text`) | Up to 3 reviews, 4 stars and up, over 40 characters |
| `hours[]` (`"Monday: 8 AM – 5 PM"`) | Hours card |
| `services[]` | Service cards (falls back to a default set) |
| `owner` | First name in the pitch pop-up and booking tip |
| `socialUrl`, `photos`, `pricing` | Optional overrides |
| `style` (`modern` / `classy` / `simple`), `mode` (`light` / `dark`) | Look. Try any combination live with `?style=classy&mode=dark` |
| `preview: false` | Live site: no pitch pop-up, no `noindex`, bookings go to `formEndpoint` |

Stock photos (Pexels, free licence) are used until the business sends its own.

## Pitch mode

Preview sites double as the sales pitch. At 75% scroll the owner is invited to book a mow on their own site, gets the real confirmation text and email, then sees pricing. See [`pipeline/README.md`](../../pipeline/README.md) for the endpoints this needs.
