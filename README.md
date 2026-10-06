# 7Acre Digital

Static one-page site for 7Acre Digital (Dallas-Fort Worth, TX), served by GitHub Pages from `main` / root.

## Contact email
Edit `assets/config.js` line 2 (`const CONTACT_EMAIL = "..."`). It fills every email link and the quote form.

## Rebrand (name, logo, palette)
1. Edit `brand.json`: `name`, the `palette` hex values (keys match the `--<key>` CSS variables), `roles` (theme color + og-image background), and the logo/favicon file paths.
2. Run `python3 rebrand.py --og-logo-png path/to/new-lockup.png` (the flag is optional and regenerates the social share image).
3. `git commit -am "Rebrand" && git push`

Colors live only in the palette block at the top of `assets/styles.css`. Current brand: Estate Italic logo; Estate Green #1F4532, Fairway #285640, Gold #C9A24A, Light Gold #D8B566, Ink #0F1F18, Cream #F4EEDF. For WCAG AA, text and buttons use green/fairway/ink; gold is an accent only on light backgrounds (never small text on cream/white). If the logo's aspect ratio changes, update the `width`/`height` attributes on the two logo `<img>` tags in `index.html`. Logos are always loaded from `assets/logo.svg` (light background), `assets/logo-on-dark.svg` (footer), `assets/favicon.svg`, `assets/favicon-32.png`, and `assets/icon-512.png`.
