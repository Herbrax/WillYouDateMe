#!/usr/bin/env python3
"""
1. Copies content.json into the FALLBACK block of app.js. The page never
   fetches anything, so this is what it actually reads — off the disk, on
   GitHub Pages, and on the custom domain alike.
2. Inlines everything into dist/hey-little-fairy.html — one self-contained
   page, ready to publish.

Run this after editing content.json.
"""
import json, pathlib, re, shutil

root = pathlib.Path(__file__).parent

# Every file here is UTF-8 — the copy has accents and emoji in it. Say so
# explicitly, or Python picks the console codepage (cp1252 on a French Windows)
# and dies on the first character outside it.
UTF8 = {'encoding': 'utf-8'}

content = json.loads((root / 'content.json').read_text(**UTF8))
pretty = json.dumps(content, indent=2, ensure_ascii=False)

# ── 1. sync the fallback ──────────────────────────────────────
app = (root / 'app.js').read_text(**UTF8)
app, n = re.subn(
    r'(/\* >>> FALLBACK-CONTENT.*?\*/\n).*?(\n/\* <<< FALLBACK-CONTENT \*/)',
    lambda m: f'{m.group(1)}const FALLBACK = {pretty};{m.group(2)}',
    app, flags=re.S,
)
if n != 1:
    raise SystemExit('could not find the FALLBACK-CONTENT markers in app.js')
(root / 'app.js').write_text(app, **UTF8)

# ── 2. inline into one page ───────────────────────────────────
# The page is one file, but the music sits next to it rather than inside it —
# base64 in the markup costs a third more bytes and blocks the first paint.

html = (root / 'index.html').read_text(**UTF8)
css = (root / 'styles.css').read_text(**UTF8)

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
target.write_text(out, **UTF8)

track = root / content.get('sound', {}).get('track', '')
if track.is_file():
    shutil.copy2(track, dist / track.name)
elif content.get('sound', {}).get('track'):
    print(f'  ! {track.name} not found — the built page will be silent')
print(f'synced app.js fallback  ·  wrote {target.relative_to(root)} ({len(out):,} bytes)')
