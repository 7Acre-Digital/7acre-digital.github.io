# 7Acre Digital

Static one-page site for 7Acre Digital (Dallas-Fort Worth, TX), served by GitHub Pages from `main` / root.

## Contact email
Edit `assets/config.js` line 2 (`const CONTACT_EMAIL = "..."`). It fills every email link and the quote form.

## Rebrand (name, logo, palette)
1. Edit `brand.json`: `name`, the 5 `palette` hex values, and the logo/favicon file paths.
2. Run `python3 rebrand.py --og-logo-png path/to/new-lockup.png` (the flag is optional and regenerates the social share image).
3. `git commit -am "Rebrand" && git push`

Colors live only in the palette block at the top of `assets/styles.css`. Logos are always loaded from `assets/logo.svg` (light background), `assets/logo-on-dark.svg` (footer), `assets/favicon.svg`, `assets/favicon-32.png`, and `assets/icon-512.png`.
