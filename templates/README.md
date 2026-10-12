# Templates

Client site templates. Each template is a folder with a `template.mjs` that exports:

```js
render(lead, config, { slug })  // → the full HTML page for one business
slugify(name)                   // → URL-safe slug, e.g. "Imperial Lawn & Landscape" → "imperial-lawn-landscape"
```

`lead` is one business (name, phone, city, rating, reviews, services and so on); `config` is [`pipeline/config.json`](../pipeline/config.json). Templates make no network calls and write no files: they take data and return HTML. The scripts in [`pipeline/`](../pipeline/) do the rest.

| Template | For | Notes |
|---|---|---|
| [`lawn/`](lawn/) | Lawn care and landscaping | Instant mowing quote, booking flow, Google reviews, pitch mode for previews |

## Adding a template

1. Create `templates/<trade>/template.mjs` with the two exports above.
2. Add a `README.md` listing which `lead` fields it uses.
3. Add it to the table above.
