#!/usr/bin/env python3
"""
1. Copies content.json into the FALLBACK block of app.js. The page never
   fetches anything, so this is what it actually reads — off the disk, on
   GitHub Pages, and on the custom domain alike.
2. Inlines everything into dist/hey-little-fairy.html — one self-contained
   page, ready to publish.

Run this after editing content.json.
"""
import json, pathlib, re

root = pathlib.Path(__file__).parent
content = json.loads((root / 'content.json').read_text())
pretty = json.dumps(content, indent=2, ensure_ascii=False)

# ── 1. sync the fallback ──────────────────────────────────────
app = (root / 'app.js').read_text()
app, n = re.subn(
    r'(/\* >>> FALLBACK-CONTENT.*?\*/\n).*?(\n/\* <<< FALLBACK-CONTENT \*/)',
    lambda m: f'{m.group(1)}const FALLBACK = {pretty};{m.group(2)}',
    app, flags=re.S,
)
if n != 1:
    raise SystemExit('could not find the FALLBACK-CONTENT markers in app.js')
(root / 'app.js').write_text(app)

# ── 2. inline into one page ───────────────────────────────────
html = (root / 'index.html').read_text()
css = (root / 'styles.css').read_text()

body = re.search(r'<body>(.*)</body>', html, re.S).group(1)
body = body.replace('<script src="app.js"></script>', '').strip()
# Everything in <head> that has to come along: the fonts and the EmailJS SDK.
head = '\n'.join(re.findall(
    r'<link rel="preconnect"[^>]*>'
    r'|<link rel="stylesheet" href="https://fonts\.googleapis[^"]*">'
    r'|<script src="https://cdn\.jsdelivr\.net/npm/@emailjs[^>]*></script>', html))

out = f"""<title>Hey Little Fairy</title>
{head}
<style>
{css}
</style>

{body}

<script>
window.__CONTENT__ = {pretty};
</script>
<script>
{app}
</script>
"""

dist = root / 'dist'
dist.mkdir(exist_ok=True)
target = dist / 'hey-little-fairy.html'
target.write_text(out)
print(f'synced app.js fallback  ·  wrote {target.relative_to(root)} ({len(out):,} bytes)')
