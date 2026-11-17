#!/usr/bin/env python3
"""Assemble the single-file app.  Usage: python3 build/build.py
src/shell.html + src/css/*.css + src/js/*.js (sorted by filename) + content/*.txt (order.txt)
  -> dist/index.html  (Claude artifact build; not committed)
  -> ./index.html     (GitHub Pages / PWA build, + static files copied from src/standalone/)
Rules for editing live in AGENTS.md."""
import json, pathlib, re, shutil
ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'src'
read = lambda p: p.read_text(encoding='utf-8')
cat = lambda d, ext: ''.join(read(p) for p in sorted((SRC / d).glob('*.' + ext)))

# 1. content: one <script class="sa-src"> block per @CH
blocks = []
for stem in read(ROOT / 'content' / 'order.txt').split():
    text = read(ROOT / 'content' / f'{stem}.txt')
    assert '</script' not in text.lower() and '<!--' not in text, stem
    for p in re.split(r'(?m)^(?=@CH )', text):
        if p.strip():
            cid = p.split('|', 1)[0].replace('@CH', '').strip()
            blocks.append(f'<script type="text/plain" class="sa-src" data-ch="{cid}">\n{p.strip()}\n</script>')

# 2. artifact build
out = (read(SRC / 'shell.html')
       .replace('/*@@CSS@@*/\n', cat('css', 'css'), 1)
       .replace('/*@@JS@@*/\n', cat('js', 'js'), 1)
       .replace('<!--@@CONTENT@@-->', '\n'.join(blocks), 1))
(ROOT / 'dist').mkdir(exist_ok=True)
(ROOT / 'dist' / 'index.html').write_bytes(out.encode('utf-8'))
print('dist/index.html', len(out.encode()) // 1024, 'KiB,', len(blocks), 'chapters')

# 3. standalone build: PWA head + service worker tail + public Firebase config
fb = json.loads(read(SRC / 'standalone' / 'firebase.json'))
HEAD = """<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icon-180.png">
<link rel="icon" type="image/png" href="icon-192.png">
<script>window.SA_STANDALONE = true;</script>
<script>window.SA_FB = """ + json.dumps({'apiKey': fb['apiKey'], 'projectId': fb['projectId']}) + ";</script>"
TAIL = """<script>
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(()=>{}));
try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}
</script>
</body>"""
T = '<title>SA 碎片學習</title>'
assert out.count(T) == 1
sa = out.replace(T, T + '\n' + HEAD, 1)
i = sa.rindex('</body>'); sa = sa[:i] + TAIL + sa[i + len('</body>'):]
sd = ROOT
(sd / 'index.html').write_bytes(sa.encode('utf-8'))
for f in (SRC / 'standalone').iterdir():
    if f.name != 'firebase.json': shutil.copy(f, sd / f.name)
print('index.html (standalone)', len(sa.encode()) // 1024, 'KiB')
