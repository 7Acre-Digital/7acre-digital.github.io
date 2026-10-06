#!/usr/bin/env python3
"""Rebrand the site in one step.

1. Edit brand.json: set "name" to the new business name, set the 5 palette hex values,
   and point the logo/favicon paths at the new files (any path on disk; they get copied
   into assets/ under the fixed names the site uses).
2. Run:  python3 rebrand.py
3. Commit + push:  git commit -am "Rebrand" && git push

What it does: replaces the old business name everywhere in index.html and README.md
(title, og/twitter tags, body copy, footer, logo alt text), rewrites the palette block at
the top of assets/styles.css and the theme-color meta tag, copies the logo/favicon files
into assets/, regenerates assets/og-image.png (needs Pillow + a PNG render of the logo if
the logo is SVG: pass --og-logo-png path/to/lockup.png), then records the new name as
the current one in assets/.brand-current.
"""
import json, re, shutil, sys, os
ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)
b = json.load(open("brand.json"))
cur_file = "assets/.brand-current"
old = open(cur_file).read().strip() if os.path.exists(cur_file) else "Groundwork Digital"
new = b["name"].strip()

def esc(t): return t.replace("&", "&amp;")
for f in ["index.html", "README.md"]:
    s = open(f).read()
    s = s.replace(old, new).replace(esc(old), esc(new))
    if f == "index.html":
        s = re.sub(r'<meta name="theme-color" content="#[0-9A-Fa-f]{6}">',
                   f'<meta name="theme-color" content="{b["palette"]["forest"]}">', s)
    open(f, "w").write(s)

css = open("assets/styles.css").read()
for k, v in b["palette"].items():
    css = re.sub(rf"--{k}:#[0-9A-Fa-f]{{6}};", f"--{k}:{v};", css, count=1)
open("assets/styles.css", "w").write(css)

targets = {"logo_for_light_bg": "assets/logo.svg", "logo_for_dark_bg": "assets/logo-on-dark.svg",
           "favicon_svg": "assets/favicon.svg", "favicon_png_32": "assets/favicon-32.png",
           "icon_png_512": "assets/icon-512.png"}
for key, dst in targets.items():
    src = b.get(key, dst)
    if os.path.abspath(src) != os.path.abspath(dst):
        shutil.copyfile(src, dst); print("copied", src, "->", dst)

if "--og-logo-png" in sys.argv:
    from PIL import Image
    src = Image.open(sys.argv[sys.argv.index("--og-logo-png") + 1]).convert("RGBA")
    bg = Image.new("RGBA", (1200, 630), b["palette"]["sand"])
    w = 900; h = int(src.size[1] * w / src.size[0]); s2 = src.resize((w, h), Image.LANCZOS)
    bg.paste(s2, ((1200 - w) // 2, (630 - h) // 2), s2); bg.convert("RGB").save("assets/og-image.png")
    print("regenerated assets/og-image.png")
else:
    print("NOTE: assets/og-image.png still shows the old logo; rerun with --og-logo-png <lockup.png> to regenerate.")

open(cur_file, "w").write(new + "\n")
print(f"Renamed '{old}' -> '{new}'. Review index.html, then commit and push.")
